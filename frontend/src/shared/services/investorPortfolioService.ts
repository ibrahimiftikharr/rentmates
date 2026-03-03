import axios from 'axios';

const API_URL = 'http://localhost:5000/api/investor';

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Get all active investments with performance data
 */
export const getActiveInvestments = async () => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/investments`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error('Get active investments error:', error);
    throw error.response?.data || { error: 'Failed to fetch active investments' };
  }
};

/**
 * Get detailed information for a specific investment
 */
export const getInvestmentDetails = async (investmentId: string) => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/investments/${investmentId}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error('Get investment details error:', error);
    throw error.response?.data || { error: 'Failed to fetch investment details' };
  }
};

/**
 * Get repayment schedule for loans in a specific pool
 */
export const getPoolRepaymentSchedule = async (poolId: string) => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/pools/${poolId}/schedule`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error('Get pool repayment schedule error:', error);
    throw error.response?.data || { error: 'Failed to fetch repayment schedule' };
  }
};

/**
 * Get portfolio-wide performance graph data
 */
export const getPortfolioPerformance = async (timeRange: string = '6m') => {
  try {
    const response = await axios.get(`${API_URL}/portfolio/performance?timeRange=${timeRange}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error('Get portfolio performance error:', error);
    throw error.response?.data || { error: 'Failed to fetch portfolio performance' };
  }
};
