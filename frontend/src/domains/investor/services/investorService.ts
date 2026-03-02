import axios from 'axios';
import { authService } from '@/domains/auth/services/authService';

const API_BASE_URL = 'http://localhost:5000/api/investor';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_BASE_URL,
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

export interface InvestorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  govIdDocument: string;
  isVerified: boolean;
  reputationScore: number;
}

export const investorService = {
  /**
   * Get investor profile
   */
  async getProfile(): Promise<InvestorProfile> {
    try {
      const { data } = await api.get('/profile');
      return data.investor;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  /**
   * Update investor profile
   */
  async updateProfile(profileData: { phone?: string }): Promise<InvestorProfile> {
    try {
      const { data } = await api.put('/profile', profileData);
      return data.investor;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  /**
   * Upload profile image
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const { data } = await api.post('/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return data.imageUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload profile image');
    }
  },

  /**
   * Upload government ID document
   */
  async uploadGovIdDocument(file: File): Promise<{ documentUrl: string; isVerified: boolean }> {
    try {
      const formData = new FormData();
      formData.append('govIdDocument', file);

      const { data } = await api.post('/profile/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        documentUrl: data.documentUrl,
        isVerified: data.isVerified,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload document');
    }
  },

  /**
   * Delete profile image
   */
  async deleteProfileImage(): Promise<void> {
    try {
      await api.delete('/profile/image');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete profile image');
    }
  },

  /**
   * Delete government ID document
   */
  async deleteGovIdDocument(): Promise<boolean> {
    try {
      const { data } = await api.delete('/profile/document');
      return data.isVerified;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete document');
    }
  },
};
