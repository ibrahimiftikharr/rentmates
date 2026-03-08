const API_URL = 'http://localhost:5000/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string => {
  const token = localStorage.getItem('token');
  return token || '';
};

/**
 * Get risk pool allocation analytics
 */
export const getRiskPoolAllocation = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/investor/analytics/risk-allocation`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch risk allocation data');
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Get risk allocation error:', error);
    throw error;
  }
};

/**
 * Get pool utilization analytics
 */
export const getPoolUtilizationAnalytics = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/investor/analytics/pool-utilization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch pool utilization data');
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Get pool utilization error:', error);
    throw error;
  }
};

/**
 * Get investment opportunities analytics
 */
export const getInvestmentOpportunities = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/investor/analytics/opportunities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch investment opportunities');
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Get investment opportunities error:', error);
    throw error;
  }
};

/**
 * Get complete analytics (all sections)
 */
export const getCompleteAnalytics = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/investor/analytics/complete`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch complete analytics');
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Get complete analytics error:', error);
    throw error;
  }
};

// TypeScript interfaces
export interface RiskAllocation {
  name: string;
  value: number;
  amount: number;
  color: string;
}

export interface RiskAllocationData {
  totalInvested: number;
  allocations: RiskAllocation[];
}

export interface PoolUtilization {
  poolId: string;
  poolName: string;
  utilization: number;
  liquidity: number;
  utilizationAmount: number;
  liquidityAmount: number;
  maxCapacity: number;
  ltv: number;
  apr: number;
}

export interface UtilizationInsights {
  highUtilization: {
    count: number;
    pools: string[];
    message: string;
  };
  underutilized: {
    count: number;
    pools: string[];
    message: string;
  };
}

export interface PoolUtilizationData {
  pools: PoolUtilization[];
  insights: UtilizationInsights;
}

export interface InvestmentOpportunity {
  poolId: string;
  poolName: string;
  utilization: number;
  availableLiquidity: number;
  queuedRequests: number;
  studentDemand: string;
  totalRequested: number;
  riskLevel: string;
  ltv: number;
  apr: number;
  potentialMonthlyReturn: number;
}

export interface OpportunitiesSummary {
  totalQueuedRequests: number;
  totalQueuedAmount: number;
  avgRequestAmount: number;
  opportunityCount: number;
}

export interface InvestmentOpportunitiesData {
  opportunities: InvestmentOpportunity[];
  summary: OpportunitiesSummary;
}

export interface CompleteAnalyticsData {
  riskAllocation: RiskAllocationData;
  poolUtilization: PoolUtilizationData;
  opportunities: InvestmentOpportunitiesData;
  lastUpdated: Date;
}
