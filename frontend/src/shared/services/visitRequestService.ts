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

export interface VisitRequest {
  _id: string;
  student: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
  };
  property: {
    _id: string;
    title: string;
    address: string;
    images?: string[];
    mainImage?: string;
  };
  landlord: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
  };
  visitType: 'virtual' | 'in-person';
  visitDate: string;
  visitTime: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'rejected' | 'completed';
  meetLink?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  rejectionReason?: string;
  landlordNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const visitRequestService = {
  /**
   * Create visit request (Student)
   */
  async createVisitRequest(data: {
    propertyId: string;
    visitType: 'virtual' | 'in-person';
    visitDate: string;
    visitTime: string;
  }): Promise<VisitRequest> {
    try {
      const response = await api.post('/visit-requests', data);
      return response.data.visitRequest;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create visit request');
    }
  },

  /**
   * Get student's visit requests
   */
  async getStudentVisitRequests(): Promise<VisitRequest[]> {
    try {
      const response = await api.get('/visit-requests/student');
      return response.data.visitRequests;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch visit requests');
    }
  },

  /**
   * Get landlord's visit requests
   */
  async getLandlordVisitRequests(): Promise<VisitRequest[]> {
    try {
      const response = await api.get('/visit-requests/landlord');
      return response.data.visitRequests;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch visit requests');
    }
  },

  /**
   * Confirm visit request (Landlord)
   */
  async confirmVisitRequest(visitRequestId: string, meetLink?: string): Promise<VisitRequest> {
    try {
      const response = await api.put(`/visit-requests/${visitRequestId}/confirm`, { meetLink });
      return response.data.visitRequest;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to confirm visit request');
    }
  },

  /**
   * Reschedule visit request (Landlord)
   */
  async rescheduleVisitRequest(
    visitRequestId: string,
    newDate: string,
    newTime: string,
    landlordNotes?: string
  ): Promise<VisitRequest> {
    try {
      const response = await api.put(`/visit-requests/${visitRequestId}/reschedule`, {
        newDate,
        newTime,
        landlordNotes,
      });
      return response.data.visitRequest;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reschedule visit request');
    }
  },

  /**
   * Reject visit request (Landlord)
   */
  async rejectVisitRequest(
    visitRequestId: string,
    rejectionReason?: string
  ): Promise<VisitRequest> {
    try {
      const response = await api.put(`/visit-requests/${visitRequestId}/reject`, {
        rejectionReason,
      });
      return response.data.visitRequest;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject visit request');
    }
  },
};
