import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Get axios instance with auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Investment Pool Interfaces
export interface InvestmentPool {
  _id: string;
  name: string;
  ltv: number;
  durationMonths: number;
  baseRate: number;
  riskMultiplier: number;
  timePremiumRate: number;
  minInvestment: number;
  maxInvestment: number;
  maxInvestors: number;
  expectedROI: number;
  poolSize: number;
  investorCount: number;
  poolFilledPercentage: number;
  remainingCapacity: number;
  userContributionShare: number;
  isFull: boolean;
  canInvest: boolean;
  userInvestmentAmount?: number;
}

export interface PoolInvestment {
  _id: string;
  investor: string;
  pool: {
    _id: string;
    name: string;
    durationMonths: number;
    expectedROI: number;
  };
  amountInvested: number;
  lockedROI: number;
  maturityDate: string;
  status: 'active' | 'completed' | 'withdrawn';
  expectedEarnings: number;
  createdAt: string;
}

export interface InvestmentStats {
  totalInvested: number;
  totalExpectedEarnings: number;
  averageROI: number;
  activePools: number;
}

export interface InvestmentResponse {
  message: string;
  investment: PoolInvestment;
  newBalance: number;
}

// Get all investment pools with dynamic calculations
export const getAllPools = async (): Promise<InvestmentPool[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/investment/pools`, getAuthHeaders());
    return response.data.pools;
  } catch (error: any) {
    console.error('Error fetching investment pools:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch investment pools');
  }
};

// Get user's investments
export const getUserInvestments = async (): Promise<PoolInvestment[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/investment/my-investments`, getAuthHeaders());
    return response.data.investments;
  } catch (error: any) {
    console.error('Error fetching user investments:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch investments');
  }
};

// Invest in a pool
export const investInPool = async (
  poolId: string,
  amount: number
): Promise<InvestmentResponse> => {
  try {
    console.log('Sending investment request:', { poolId, amount });
    const response = await axios.post(
      `${API_URL}/api/investment/invest`,
      { poolId, amount },
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Error investing in pool:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to invest in pool';
    throw new Error(errorMessage);
  }
};

// Get investment statistics
export const getInvestmentStats = async (): Promise<InvestmentStats> => {
  try {
    const response = await axios.get(`${API_URL}/api/investment/stats`, getAuthHeaders());
    return response.data.stats;
  } catch (error: any) {
    console.error('Error fetching investment stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch investment statistics');
  }
};

export default {
  getAllPools,
  getUserInvestments,
  investInPool,
  getInvestmentStats
};
