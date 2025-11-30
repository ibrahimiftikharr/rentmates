import axios from 'axios';
import { authService } from '@/domains/auth/services/authService';

const API_URL = 'http://localhost:5000/api/student-dashboard';

const api = axios.create({
  baseURL: API_URL,
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

export interface DashboardMetrics {
  wishlistedProperties: number;
  visitRequests: number;
  joinRequests: number;
  approvedRentalRequests: number;
  activeContracts: number;
  unreadNotifications: number;
}

export interface Activity {
  type: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed' | 'completed';
  metadata?: any;
}

export interface LatestNotification {
  _id: string;
  recipient: string;
  recipientModel: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedModel?: string;
  metadata?: any;
  read: boolean;
  createdAt: string;
}

export const studentDashboardService = {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await api.get('/metrics');
      return response.data.metrics;
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      throw error.response?.data || { error: 'Failed to fetch dashboard metrics' };
    }
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<Activity[]> {
    try {
      const response = await api.get('/activity', { params: { limit } });
      return response.data.activities;
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      throw error.response?.data || { error: 'Failed to fetch recent activity' };
    }
  },

  /**
   * Get latest notifications for dashboard preview
   */
  async getLatestNotifications(limit: number = 3): Promise<{
    notifications: LatestNotification[];
    unreadCount: number;
  }> {
    try {
      const response = await api.get('/notifications/latest', { params: { limit } });
      return {
        notifications: response.data.notifications,
        unreadCount: response.data.unreadCount
      };
    } catch (error: any) {
      console.error('Error fetching latest notifications:', error);
      throw error.response?.data || { error: 'Failed to fetch latest notifications' };
    }
  },
};
