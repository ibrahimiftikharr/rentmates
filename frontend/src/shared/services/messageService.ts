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

// ========================================
// TypeScript Interfaces
// ========================================

export interface Message {
  id: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  mediaUrl?: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  readAt?: string;
}

export interface Conversation {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientRole: 'student' | 'landlord';
  recipientProfileImage: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  createdAt: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string;
}

// ========================================
// Message Service
// ========================================

export const messageService = {
  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get('/messages/conversations');
      return response.data.conversations;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
    }
  },

  /**
   * Get messages for a specific conversation
   */
  async getMessages(recipientId: string): Promise<Message[]> {
    try {
      const response = await api.get(`/messages/messages/${recipientId}`);
      return response.data.messages;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  },

  /**
   * Send a text message
   */
  async sendMessage(recipientId: string, content: string, messageType: string = 'text', mediaUrl?: string): Promise<Message> {
    try {
      const response = await api.post('/messages/send', {
        recipientId,
        content,
        messageType,
        mediaUrl
      });
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await api.put(`/messages/read/${conversationId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark messages as read');
    }
  },

  /**
   * Upload media (image)
   */
  async uploadMedia(file: File): Promise<{ mediaUrl: string; mediaType: string }> {
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await api.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        mediaUrl: response.data.mediaUrl,
        mediaType: response.data.mediaType
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload media');
    }
  },

  /**
   * Search users
   */
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    try {
      const response = await api.get('/messages/search', {
        params: { query }
      });
      return response.data.users;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }
};
