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
  maxCapital: number;
  expectedROI: number;
  poolSize: number;
  investorCount: number;
  poolFilledPercentage: number;
  remainingCapacity: number;
  isFull: boolean;
  canInvest: boolean;
  
  // ✅ SHARE-BASED: Pool share info
  totalShares: number;
  currentSharePrice: number;
  
  // ✅ SHARE-BASED: User's position
  userTotalShares: number;
  userInvestmentAmount: number;
  userCurrentValue: number;
  userSharePercentage: number;
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
  
  // ✅ SHARE-BASED: Share info
  shares: number;
  entrySharePrice: number;
  currentSharePrice: number;
  
  // Investment amounts
  amountInvested: number;
  currentValue: number;
  totalEarnings: number;
  actualROI: number;
  
  // Dates (investment date still relevant, no maturity date)
  investmentDate: string;
  
  status: 'active' | 'withdrawn';
}

export interface InvestmentStats {
  totalInvested: number;
  totalCurrentValue: number;
  totalEarnings: number;
  portfolioROI: number;
  totalShares: number;
  activePools: number;
  totalInvestments: number;
}

export interface InvestmentResponse {
  message: string;
  investment: PoolInvestment;
  newBalance: number;
}

export interface PoolsResponse {
  pools: InvestmentPool[];
  userBalance: number;
}

// Get all investment pools with dynamic calculations
export const getAllPools = async (): Promise<PoolsResponse> => {
  try {
    const response = await axios.get(`${API_URL}/api/investment/pools`, getAuthHeaders());
    return {
      pools: response.data.pools,
      userBalance: response.data.userBalance
    };
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
    const response = await axios.post(
      `${API_URL}/api/investment/invest`,
      { poolId, amount },
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Error investing in pool:', error);
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

// Withdraw from investment pool
export const withdrawFromPool = async (
  poolId: string,
  amount: number
): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/investor/portfolio/withdraw`,
      { poolId, amount },
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Error withdrawing from pool:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to withdraw from pool';
    throw new Error(errorMessage);
  }
};

export default {
  getAllPools,
  getUserInvestments,
  investInPool,
  getInvestmentStats,
  withdrawFromPool
};
