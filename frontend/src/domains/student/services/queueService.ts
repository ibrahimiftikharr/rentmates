const API_URL = 'http://localhost:5000/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string => {
  const token = localStorage.getItem('token');
  return token || '';
};

/**
 * Queue a loan request when no matching pools available
 */
export const queueLoanRequest = async (
  loanAmount: number,
  duration: number,
  purpose: string,
  maxAcceptableAPR?: number,
  preferredRiskLevel?: string,
  attemptedPools?: any[]
) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/loans/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        loanAmount,
        duration,
        purpose,
        maxAcceptableAPR,
        preferredRiskLevel,
        attemptedPools
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to queue loan request');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Queue loan request error:', error);
    throw error;
  }
};

/**
 * Get student's queued loan requests
 */
export const getMyQueuedRequests = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/loans/queue/my-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch queued requests');
    }

    const data = await response.json();
    return data.queuedRequests;
  } catch (error: any) {
    console.error('Get queued requests error:', error);
    throw error;
  }
};

/**
 * Cancel a queued loan request
 */
export const cancelQueuedRequest = async (requestId: string) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/loans/queue/${requestId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel queued request');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Cancel queued request error:', error);
    throw error;
  }
};

export interface QueuedLoanRequest {
  _id: string;
  requestedAmount: number;
  duration: number;
  purpose: string;
  status: 'queued' | 'matched' | 'expired' | 'cancelled';
  requestedAt: Date;
  expiresAt: Date;
  priorityScore: number;
}
