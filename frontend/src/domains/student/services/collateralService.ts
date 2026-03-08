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

export interface ContractAddresses {
  paxgToken: string;
  collateralHolder: string;
  network: string;
  chainId: number;
}

export interface WalletBalances {
  walletAddress: string;
  paxgBalance: string;
  depositedCollateral: string;
  totalBalance: string;
}

export interface PendingLoan {
  _id: string;
  loanAmount: number;
  poolName: string;
  duration: number;
  apr: number;
  monthlyRepayment: number;
  totalRepayment: number;
  requiredCollateral: number;
  applicationDate: Date;
  expiryTime: number;
}

export interface CollateralDeposit {
  loanId: string;
  loanAmount: number;
  poolName: string;
  requiredCollateral: number;
  collateralStatus: string;
  collateralTxHash: string;
  depositedAt: Date;
  walletAddress: string;
  loanStatus: string;
}

/**
 * Get smart contract addresses
 */
export const getContractAddresses = async (): Promise<ContractAddresses> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/collateral/contracts`,
      getAuthHeaders()
    );
    return response.data.contracts;
  } catch (error: any) {
    console.error('Get contract addresses error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch contract addresses'
    );
  }
};

/**
 * Get wallet balances (PAXG in wallet + deposited collateral)
 */
export const getWalletBalances = async (walletAddress: string): Promise<WalletBalances> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/collateral/balances`,
      {
        params: { walletAddress },
        ...getAuthHeaders()
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Get wallet balances error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch wallet balances'
    );
  }
};

/**
 * Get pending loan details
 */
export const getPendingLoan = async (loanId: string): Promise<PendingLoan> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/collateral/pending-loan/${loanId}`,
      getAuthHeaders()
    );
    return response.data.loan;
  } catch (error: any) {
    console.error('Get pending loan error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch pending loan'
    );
  }
};

/**
 * Confirm collateral deposit with transaction hash
 */
export const confirmCollateralDeposit = async (
  loanId: string,
  txHash: string,
  walletAddress: string
) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/collateral/confirm-deposit`,
      {
        loanId,
        txHash,
        walletAddress
      },
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Confirm collateral deposit error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to confirm collateral deposit'
    );
  }
};

/**
 * Get all user's collateral deposits
 */
export const getMyCollateral = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/collateral/my-collateral`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Get my collateral error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch collateral deposits'
    );
  }
};

/**
 * Withdraw collateral for a completed loan
 */
export const withdrawCollateral = async (loanId: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/collateral/withdraw`,
      { loanId },
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Withdraw collateral error:', error);
    throw new Error(
      error.response?.data?.error || error.response?.data?.message || 'Failed to withdraw collateral'
    );
  }
};

/**
 * Get collateral status for a specific loan
 */
export const getCollateralStatus = async (loanId: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/collateral/status/${loanId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error('Get collateral status error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch collateral status'
    );
  }
};
