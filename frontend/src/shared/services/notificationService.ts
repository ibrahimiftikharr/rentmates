import axios from 'axios';
import { authService } from '@/domains/auth/services/authService';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Notification {
  _id: string;
  recipient: string;
  recipientModel: 'Student' | 'Landlord' | 'Investor';
  type: 'visit_request' | 'visit_confirmed' | 'visit_rescheduled' | 'visit_rejected' | 'message' | 'property_update' | 'application_status' | 'loan_application_submitted' | 'loan_disbursed' | 'loan_repayment_received' | 'investor_profit_earned' | 'loan_defaulted' | 'collateral_liquidated';
  title: string;
  message: string;
  relatedId?: string;
  relatedModel?: string;
  metadata?: any;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  loanActivity?: boolean;
  repayments?: boolean;
  defaults?: boolean;
  profits?: boolean;
  propertyUpdates?: boolean;
  visitRequests?: boolean;
  joinRequests?: boolean;
  poolUpdates?: boolean;
  systemAlerts?: boolean;
  marketingEmails?: boolean;
}

export const notificationService = {
  /**
   * Get notifications for current user
   */
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.unreadCount;
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark as read');
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/notifications/mark-all-read');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark all as read');
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data.preferences || {};
    } catch (error: any) {
      console.error('Failed to fetch notification preferences:', error);
      return {};
    }
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await api.put('/notifications/preferences', { preferences });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update preferences');
    }
  },
};
