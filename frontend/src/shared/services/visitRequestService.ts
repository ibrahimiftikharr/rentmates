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
    fullName?: string;
    profilePicture?: string;
    documents?: {
      profileImage?: string;
    };
  };
  property: {
    _id: string;
    title: string;
    address: string;
    location?: string;
    images?: string[];
    mainImage?: string;
  };
  landlord: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
    fullName?: string;
  };
  visitType: 'virtual' | 'in-person';
  visitDate: string;
  visitTime: string; // UTC time in HH:mm format
  visitTimeEnd?: string; // UTC time in HH:mm format
  studentTimeZone?: string; // IANA time zone
  landlordTimeZone?: string; // IANA time zone
  status: 'pending' | 'confirmed' | 'rescheduled' | 'rejected' | 'completed';
  meetLink?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  rescheduledTimeEnd?: string;
  rejectionReason?: string;
  landlordNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string; // HH:mm format in UTC
  endTime: string; // HH:mm format in UTC
  available: boolean;
}

export const visitRequestService = {
  /**
   * Create visit request (Student)
   */
  async createVisitRequest(data: {
    propertyId: string;
    visitType: 'virtual' | 'in-person';
    visitDate: string;
    visitTime: string; // UTC time
    visitTimeEnd?: string; // UTC time
    studentTimeZone?: string; // IANA time zone
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

  /**
   * Mark visit as completed (Landlord)
   */
  async completeVisitRequest(visitRequestId: string): Promise<VisitRequest> {
    try {
      const response = await api.put(`/visit-requests/${visitRequestId}/complete`);
      return response.data.visitRequest;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark visit as completed');
    }
  },

  /**
   * Get available time slots for a property on a specific date
   */
  async getAvailableTimeSlots(propertyId: string, date: string): Promise<TimeSlot[]> {
    try {
      const response = await api.get('/visit-requests/available-slots', {
        params: { propertyId, date }
      });
      return response.data.slots;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available time slots');
    }
  },
};
