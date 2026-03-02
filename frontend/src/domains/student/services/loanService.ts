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

// Loan Pool Interface (from backend response)
export interface LoanPool {
  _id: string;
  name: string;
  description?: string;
  ltv: number;
  durationMonths: number;
  apr: number;
  availableCapital: number;
  currentPoolSize: number;
  remainingCapacity: number;
  maxCapital: number;
  monthlyRepayment: number;
  requiredCollateralUSDT: number;
  requiredCollateral: number;
  totalRepayment: number;
  isEligible: boolean;
  buttonText: string;
  disableReason: string | null;
  hasEnoughCapital: boolean;
  durationMatches: boolean;
}

export interface LoanAvailabilityResponse {
  success: boolean;
  requestedAmount: number;
  requestedDuration: number;
  purpose: string;
  pools: LoanPool[];
}

export interface LoanApplication {
  _id: string;
  loanAmount: number;
  poolName: string;
  duration: number;
  apr: number;
  monthlyRepayment: number;
  totalRepayment: number;
  requiredCollateral: number;
  status: string;
  expiryTime: number;
}

export interface LoanApplicationResponse {
  success: boolean;
  message: string;
  loan: LoanApplication;
}

/**
 * Check loan availability across all pools
 */
export const checkLoanAvailability = async (
  loanAmount: number,
  duration: number,
  purpose?: string
): Promise<LoanAvailabilityResponse> => {
  try {
    const params: any = {
      loanAmount,
      duration
    };

    if (purpose) {
      params.purpose = purpose;
    }

    const response = await axios.get(
      `${API_URL}/api/loans/check-availability`,
      {
        params,
        ...getAuthHeaders()
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Check loan availability error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to check loan availability'
    );
  }
};

/**
 * Submit loan application
 */
export const applyForLoan = async (
  poolId: string,
  loanAmount: number,
  duration: number,
  purpose: string
): Promise<LoanApplicationResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/loans/apply`,
      {
        poolId,
        loanAmount,
        duration,
        purpose
      },
      getAuthHeaders()
    );

    return response.data;
  } catch (error: any) {
    console.error('Apply for loan error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to submit loan application'
    );
  }
};

/**
 * Get all loans for the authenticated student
 */
export const getMyLoans = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/loans/my-loans`,
      getAuthHeaders()
    );

    return response.data;
  } catch (error: any) {
    console.error('Get my loans error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch loans'
    );
  }
};

/**
 * Get specific loan details
 */
export const getLoanById = async (loanId: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/loans/${loanId}`,
      getAuthHeaders()
    );

    return response.data;
  } catch (error: any) {
    console.error('Get loan by ID error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch loan details'
    );
  }
};

/**
 * Cancel loan application
 */
export const cancelLoan = async (loanId: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/loans/${loanId}/cancel`,
      getAuthHeaders()
    );

    return response.data;
  } catch (error: any) {
    console.error('Cancel loan error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to cancel loan'
    );
  }
};

/**
 * Get current PAXG/USDT price for real-time collateral conversion
 */
export interface PAXGPriceResponse {
  success: boolean;
  paxgPrice: number;
  timestamp: number;
  currency: string;
}

export const getPAXGPrice = async (): Promise<PAXGPriceResponse> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/loans/paxg-price`,
      getAuthHeaders()
    );

    return response.data;
  } catch (error: any) {
    console.error('Get PAXG price error:', error);
    // Return fallback price if API fails
    return {
      success: false,
      paxgPrice: 2000,
      timestamp: Date.now(),
      currency: 'USDT'
    };
  }
};
