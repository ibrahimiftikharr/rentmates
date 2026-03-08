import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Student APIs
export const getSecurityDepositStatus = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/security-deposit/status`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to get security deposit status' };
  }
};

export const paySecurityDeposit = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/security-deposit/pay`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to pay security deposit' };
  }
};

// Landlord APIs
export const getLandlordRentalSecurityDeposit = async (rentalId: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/security-deposit/landlord/${rentalId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to get rental security deposit info' };
  }
};

export const refundSecurityDeposit = async (rentalId: string, reason: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/security-deposit/refund`,
      { rentalId, reason },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Failed to refund security deposit' };
  }
};

export default {
  getSecurityDepositStatus,
  paySecurityDeposit,
  getLandlordRentalSecurityDeposit,
  refundSecurityDeposit
};
