import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Student APIs
export const checkStudentProfile = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/join-requests/check-profile`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to check profile' };
  }
};

export const checkPropertyVisit = async (propertyId: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/join-requests/check-visit/${propertyId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to check visit status' };
  }
};

export const checkHigherBids = async (propertyId: string, bidAmount: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/join-requests/check-bids/${propertyId}`,
      { bidAmount },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to check bids' };
  }
};

export const createJoinRequest = async (data: {
  propertyId: string;
  movingDate: string;
  bidAmount: number;
  message?: string;
}) => {
  try {
    const response = await axios.post(
      `${API_URL}/join-requests`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create join request' };
  }
};

export const getStudentJoinRequests = async (status?: string) => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get(
      `${API_URL}/join-requests/student`,
      { 
        headers: getAuthHeader(),
        params
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch join requests' };
  }
};

export const deleteJoinRequest = async (requestId: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/join-requests/${requestId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete join request' };
  }
};

export const studentSignContract = async (requestId: string, signature: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/join-requests/${requestId}/sign-student`,
      { signature },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to sign contract' };
  }
};

// Landlord APIs
export const getLandlordJoinRequests = async (status?: string) => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get(
      `${API_URL}/join-requests/landlord`,
      { 
        headers: getAuthHeader(),
        params
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch join requests' };
  }
};

export const checkLandlordProfile = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/join-requests/landlord/check-profile`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to check landlord profile' };
  }
};

export const acceptJoinRequest = async (requestId: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/join-requests/${requestId}/accept`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to accept join request' };
  }
};

export const rejectJoinRequest = async (requestId: string, reason: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/join-requests/${requestId}/reject`,
      { reason },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to reject join request' };
  }
};

export const landlordSignContract = async (requestId: string, signature: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/join-requests/${requestId}/sign-landlord`,
      { signature },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Landlord sign contract error:', error);
    console.error('Error response:', error.response);
    throw error.response?.data || { error: 'Failed to sign contract' };
  }
};

// Get landlord's tenants
export const getLandlordTenants = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/join-requests/landlord/tenants`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch tenants' };
  }
};
