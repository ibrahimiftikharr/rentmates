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
  billPrices?: {
    wifi: number;
    water: number;
    electricity: number;
    gas: number;
    councilTax: number;
  };
  images: string[];
  mainImage?: string;
  availableFrom?: string;
  minimumStay?: number;
  maximumStay?: number;
  status: 'active' | 'inactive' | 'rented';
  views: number;
  wishlistCount: number;
  landlord?: {
    _id: string;
    name: string;
    reputationScore: number;
  };
  createdAt: string;
  distance?: number; // Will be calculated on frontend
  flatmates?: any[];
  houseRules?: {
    petsAllowed: boolean;
    smokingAllowed: boolean;
    guestsAllowed: boolean;
  };
  availabilityDates?: string[];
  moveInBy?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  university?: string;
  course?: string;
  yearOfStudy?: string;
  nationality?: string;
  dateOfBirth?: string;
  phone?: string;
  interests?: string[];
  housingPreferences?: {
    propertyType?: string[];
    budgetMin?: number;
    budgetMax?: number;
    moveInDate?: string;
    furnished?: boolean;
    billsIncluded?: boolean;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
  };
  documents?: {
    profileImage?: string;
    nationalId?: string;
    passport?: string;
    studentId?: string;
    proofOfEnrollment?: string;
  };
  bio?: string;
  reputationScore: number;
  trustLevel: string;
  documentsCount: number;
  completedTasks: number;
  profileSteps?: {
    basicInfo: boolean;
    housingPreferences: boolean;
    documentsUploaded: boolean;
    bioCompleted: boolean;
  };
  isProfileComplete: boolean;
}

// ========================================
// Student Service
// ========================================

export const studentService = {
  /**
   * Get student profile
   */
  async getProfile(): Promise<StudentProfile> {
    try {
      const { data } = await api.get('/student/profile');
      return data.profile;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  /**
   * Update student profile
   */
  async updateProfile(profileData: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const { data } = await api.put('/student/profile', profileData);
      return data.profile;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  /**
   * Upload document
   */
  async uploadDocument(file: File, documentType: string): Promise<{ documentUrl: string; reputationScore: number; documentsCount: number }> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const { data } = await api.post('/student/profile/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload document');
    }
  },

  /**
   * Delete document
   */
  async deleteDocument(documentType: string): Promise<{ reputationScore: number; documentsCount: number }> {
    try {
      const { data } = await api.delete(`/student/profile/document/${documentType}`);
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete document');
    }
  },

  /**
   * Get all active properties
   */
  async getAllProperties(): Promise<Property[]> {
    try {
      const { data } = await api.get('/properties/all');
      return data.properties;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch properties');
    }
  },

  /**
   * Get single property details
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
   * Calculate distance between two addresses using Google Maps Geocoding API
   */
  async calculateDistance(origin: string, destination: string): Promise<number> {
    try {
      const apiKey = 'AIzaSyA7e3dxeNL_-DWYiAAquXEKr_newclW_rc';
      
      // Geocode origin
      const originResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(origin)}&key=${apiKey}`
      );
      
      // Geocode destination
      const destResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${apiKey}`
      );

      if (originResponse.data.status !== 'OK' || destResponse.data.status !== 'OK') {
        return 0;
      }

      const originLoc = originResponse.data.results[0].geometry.location;
      const destLoc = destResponse.data.results[0].geometry.location;

      // Calculate distance using Haversine formula
      const R = 3959; // Radius of Earth in miles
      const dLat = (destLoc.lat - originLoc.lat) * Math.PI / 180;
      const dLon = (destLoc.lng - originLoc.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(originLoc.lat * Math.PI / 180) * Math.cos(destLoc.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return parseFloat(distance.toFixed(1));
    } catch (error) {
      console.error('Distance calculation error:', error);
      return 0;
    }
  },

  /**
   * Get wishlist
   */
  async getWishlist(): Promise<Property[]> {
    try {
      const { data } = await api.get('/student/wishlist');
      return data.wishlist;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  },

  /**
   * Add property to wishlist
   */
  async addToWishlist(propertyId: string): Promise<void> {
    try {
      await api.post('/student/wishlist', { propertyId });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add to wishlist');
    }
  },

  /**
   * Remove property from wishlist
   */
  async removeFromWishlist(propertyId: string): Promise<void> {
    try {
      console.log('Removing property from wishlist:', propertyId);
      const response = await api.delete(`/student/wishlist/${propertyId}`);
      console.log('Remove from wishlist response:', response.data);
    } catch (error: any) {
      console.error('Remove from wishlist error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  },

  /**
   * Check if property is in wishlist
   */
  async isInWishlist(propertyId: string): Promise<boolean> {
    try {
      const { data } = await api.get('/student/wishlist');
      return data.wishlist.some((prop: Property) => prop.id === propertyId);
    } catch (error: any) {
      return false;
    }
  },
};
