const API_URL = 'http://localhost:5000/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string => {
  const token = localStorage.getItem('token');
  return token || '';
};

/**
 * Get dashboard metrics for investor
 */
export const getDashboardMetrics = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/investor/dashboard/metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard metrics');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get dashboard metrics error:', error);
    throw error;
  }
};

/**
 * Get pool risk analytics
 */
export const getPoolRiskAnalytics = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/investor/dashboard/risk-analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch risk analytics');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get pool risk analytics error:', error);
    throw error;
  }
};

export interface DashboardMetrics {
  totalInvested: number;
  earningsGenerated: number;
  currentValue: number;
  annualROI: number;
  poolUtilizationRate: number;
  activePools: number;
  walletBalance: number;
  walletAddress: string | null;
}

export interface PoolRiskMetric {
  poolId: string;
  poolName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'stable';
  ltv: number;
  totalPoolValue: number;
  disbursedLoans: number;
  availableBalance: number;
}
