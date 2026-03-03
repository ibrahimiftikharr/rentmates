import axios from 'axios';

const API_URL = 'http://localhost:5000/api/loans';

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
 * Get active loan details for repayment page
 */
export const getActiveLoan = async () => {
  try {
    const response = await axios.get(`${API_URL}/repayment/active`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error('Get active loan error:', error);
    throw error.response?.data || { error: 'Failed to fetch active loan' };
  }
};

/**
 * Pay loan installment manually
 * @param devBypassPaymentWindow - DEV ONLY: Bypass payment window restriction for testing
 */
export const payLoanInstallment = async (devBypassPaymentWindow = false) => {
  try {
    const response = await axios.post(
      `${API_URL}/repayment/pay`, 
      { devBypassPaymentWindow }, 
      getAuthHeader()
    );
    return response.data;
  } catch (error: any) {
    console.error('Pay loan installment error:', error);
    throw error.response?.data || { error: 'Failed to process loan payment' };
  }
};

/**
 * Toggle auto-repayment for active loan
 */
export const toggleAutoRepayment = async (enabled: boolean) => {
  try {
    const response = await axios.post(
      `${API_URL}/repayment/toggle-auto`,
      { enabled },
      getAuthHeader()
    );
    return response.data;
  } catch (error: any) {
    console.error('Toggle auto-repayment error:', error);
    throw error.response?.data || { error: 'Failed to toggle auto-repayment' };
  }
};

/**
 * Get loan repayment history and schedule
 */
export const getRepaymentHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/repayment/history`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    console.error('Get repayment history error:', error);
    throw error.response?.data || { error: 'Failed to fetch repayment history' };
  }
};
