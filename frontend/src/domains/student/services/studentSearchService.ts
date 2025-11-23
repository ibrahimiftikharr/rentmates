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

export interface CompatibleStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  photo: string | null;
  university: string;
  course: string;
  yearOfStudy: string;
  nationality: string;
  phone?: string;
  bio: string;
  interests: string[];
  reputationScore: number;
  trustLevel: string;
  compatibilityScore: number;
  housingPreferences: {
    propertyType: string[];
    budgetMin: number;
    budgetMax: number;
    moveInDate?: Date;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    furnished: boolean;
    billsIncluded: boolean;
  };
}

export interface SearchStudentsParams {
  search?: string;
  university?: string;
  nationality?: string;
}

// ========================================
// API Functions
// ========================================

/**
 * Get students with compatibility scores
 */
export const getStudentsWithCompatibility = async (
  params?: SearchStudentsParams
): Promise<CompatibleStudent[]> => {
  try {
    const response = await api.get('/public/students-compatibility', {
      params: {
        search: params?.search || undefined,
        university: params?.university || undefined,
        nationality: params?.nationality || undefined,
      },
    });

    if (response.data.success) {
      return response.data.students;
    } else {
      throw new Error(response.data.message || 'Failed to fetch students');
    }
  } catch (error: any) {
    console.error('Error fetching compatible students:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch compatible students'
    );
  }
};

/**
 * Get a single student's profile by ID
 */
export const getStudentProfile = async (studentId: string): Promise<CompatibleStudent> => {
  try {
    const response = await api.get(`/public/students/${studentId}`);

    if (response.data.success) {
      return response.data.student;
    } else {
      throw new Error(response.data.message || 'Failed to fetch student profile');
    }
  } catch (error: any) {
    console.error('Error fetching student profile:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch student profile'
    );
  }
};

export const studentSearchService = {
  getStudentsWithCompatibility,
  getStudentProfile,
};
