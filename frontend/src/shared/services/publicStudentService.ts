import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface PublicStudentProfile {
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
  dateOfBirth?: string;
  bio: string;
  reputationScore: number;
  trustLevel: string;
  completedTasks?: number;
  documentsCount?: number;
  housingPreferences: {
    propertyType: string[];
    budgetMin: number;
    budgetMax: number;
    moveInDate?: Date;
    stayDuration: string;
    preferredAreas: string[];
    petsAllowed: boolean;
    smokingAllowed: boolean;
    furnished: boolean;
    billsIncluded: boolean;
  };
  documents?: {
    hasProfileImage: boolean;
    hasNationalId: boolean;
    hasPassport: boolean;
    hasStudentId: boolean;
    hasProofOfEnrollment: boolean;
  };
  profileSteps?: {
    basicInfo: boolean;
    housingPreferences: boolean;
    bioCompleted: boolean;
    documentsUploaded: boolean;
  };
  walletLinked: boolean;
}

export interface SearchStudentsParams {
  search?: string;
  university?: string;
  nationality?: string;
}

class PublicStudentService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  async searchStudents(params?: SearchStudentsParams): Promise<PublicStudentProfile[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.university && params.university !== 'all') queryParams.append('university', params.university);
      if (params?.nationality && params.nationality !== 'all') queryParams.append('nationality', params.nationality);

      const response = await axios.get(
        `${API_BASE_URL}/public/students?${queryParams.toString()}`,
        this.getAuthHeader()
      );
      
      return response.data.students;
    } catch (error: any) {
      console.error('Failed to search students:', error);
      throw new Error(error.response?.data?.message || 'Failed to search students');
    }
  }

  async getStudentProfile(studentId: string): Promise<PublicStudentProfile> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/public/students/${studentId}`,
        this.getAuthHeader()
      );
      
      return response.data.student;
    } catch (error: any) {
      console.error('Failed to fetch student profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch student profile');
    }
  }
}

export const publicStudentService = new PublicStudentService();
