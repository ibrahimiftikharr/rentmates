import axios from 'axios';
import { authService } from '@/domains/auth/services/authService';

// Create axios instance with default config
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

export interface LandlordProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  address: string;
  governmentId: string;
  profileImage: string;
  govIdDocument: string;
  reputationScore: number;
  isProfileComplete: boolean;
  properties: string[];
}

export interface UpdateProfileData {
  phone: string;
  nationality: string;
  address: string;
  governmentId?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'flat' | 'house' | 'studio' | 'apartment';
  address: string;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  furnished: boolean;
  price: number;
  deposit?: number;
  amenities: string[];
  billsIncluded: string[];
  images: string[];
  mainImage?: string;
  availableFrom?: string;
  minimumStay?: number;
  maximumStay?: number;
  status: 'active' | 'inactive' | 'rented';
  views: number;
  wishlistCount: number;
  createdAt: string;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  type: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  furnished: boolean;
  price: number;
  deposit?: number;
  amenities: string[];
  billsIncluded: string[];
  availableFrom?: string;
  minimumStay?: number;
  maximumStay?: number;
  images: File[];
}

// ========================================
// Landlord Service
// ========================================

export const landlordService = {
  /**
   * Get landlord profile
   */
  async getProfile(): Promise<LandlordProfile> {
    try {
      const { data } = await api.get('/landlord/profile');
      return data.landlord;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  /**
   * Update landlord profile
   */
  async updateProfile(profileData: UpdateProfileData): Promise<LandlordProfile> {
    try {
      const { data } = await api.put('/landlord/profile', profileData);
      return data.landlord;
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

      const { data } = await api.post('/landlord/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.imageUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  },

  /**
   * Upload government ID document
   */
  async uploadGovIdDocument(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('govIdDocument', file);

      const { data } = await api.post('/landlord/profile/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.documentUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload document');
    }
  },

  /**
   * Update reputation score
   */
  async updateReputationScore(scoreChange: number): Promise<{ reputationScore: number }> {
    try {
      const { data } = await api.put('/landlord/reputation', { scoreChange });
      return {
        reputationScore: data.reputationScore
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update reputation');
    }
  },

  /**
   * Create new property
   */
  async createProperty(propertyData: CreatePropertyData): Promise<Property> {
    try {
      const formData = new FormData();

      // Add all text fields
      Object.keys(propertyData).forEach((key) => {
        if (key === 'images') return; // Handle images separately
        if (key === 'amenities' || key === 'billsIncluded' || key === 'billPrices' || key === 'houseRules' || key === 'availabilityDates') {
          // Stringify arrays and objects
          const value = propertyData[key as keyof CreatePropertyData];
          if (value !== undefined && value !== null) {
            formData.append(key, JSON.stringify(value));
          }
        } else {
          const value = propertyData[key as keyof CreatePropertyData];
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        }
      });

      // Add images
      if (propertyData.images && propertyData.images.length > 0) {
        propertyData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const { data } = await api.post('/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.property;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create property');
    }
  },

  /**
   * Get all properties for logged-in landlord
   */
  async getMyProperties(): Promise<Property[]> {
    try {
      const { data } = await api.get('/properties/my-properties');
      return data.properties;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch properties');
    }
  },

  /**
   * Get single property
   */
  async getProperty(id: string): Promise<Property> {
    try {
      const { data } = await api.get(`/properties/${id}`);
      return data.property;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch property');
    }
  },

  /**
   * Update property
   */
  async updateProperty(id: string, propertyData: Partial<CreatePropertyData>): Promise<Property> {
    try {
      const { data } = await api.put(`/properties/${id}`, propertyData);
      return data.property;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update property');
    }
  },

  /**
   * Delete property
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      await api.delete(`/properties/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete property');
    }
  },
};
