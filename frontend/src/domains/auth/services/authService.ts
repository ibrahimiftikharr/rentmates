import axios, { AxiosError } from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract error message from axios error responses
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    return axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message;
  }
  return 'An unexpected error occurred';
};

// ========================================
// TypeScript Interfaces
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'landlord';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'landlord';
  otp: string;
}

export interface OTPVerificationData {
  email: string;
  otp: string;
}

// ========================================
// Authentication Service
// ========================================

export const authService = {
  /**
   * LOGIN FLOW
   * 1. Send email + password to /auth/login
   * 2. Backend validates credentials and returns JWT token + user data
   * 3. Store token and user in localStorage for future authenticated requests
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const { data } = await api.post<{ user: User; token: string }>('/auth/login', credentials);

      // Store auth data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * SEND OTP FLOW
   * 1. Request OTP for a given email address
   * 2. Backend generates 6-digit OTP, stores it temporarily (10min expiry), and emails it
   * 3. If resend=true, allows sending a new OTP (throttled to 60s between resends)
   * 
   * @param email - User's email address
   * @param resend - Set to true when user clicks "Resend code" (default: false)
   */
  async sendOTP(email: string, resend: boolean = false): Promise<void> {
    try {
      await api.post('/auth/send-otp', { email, resend });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * VERIFY OTP FLOW
   * 1. User enters the 6-digit OTP they received via email
   * 2. Backend checks if OTP matches and hasn't expired
   * 3. On success, OTP is cleared from backend store (can only be used once)
   * 4. User can then proceed to complete signup
   * 
   * @param data - Contains email and the 6-digit OTP string
   */
  async verifyOTP(data: OTPVerificationData): Promise<void> {
    try {
      await api.post('/auth/verify-otp', data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * SIGNUP FLOW (Complete Registration)
   * 1. After OTP is verified, call this with user details + verified OTP
   * 2. Backend creates user account with hashed password
   * 3. Returns JWT token + user data
   * 4. Store token and user in localStorage (auto-login after signup)
   * 
   * FULL SIGNUP PROCESS:
   * Step 1: User fills signup form → sendOTP(email)
   * Step 2: User enters OTP from email → verifyOTP(email, otp)
   * Step 3: Call signup(name, email, password, role, otp) → account created
   * 
   * @param data - User registration data including verified OTP
   */
  async signup(data: SignupData): Promise<{ user: User; token: string }> {
    try {
      const { data: result } = await api.post<{ user: User; token: string }>('/auth/signup', data);
      
      // Store auth data in localStorage (user is now logged in)
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      return result;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * LOGOUT
   * Clear auth data from localStorage (client-side logout)
   */
  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get currently logged-in user from localStorage
   * Returns null if not authenticated
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Get stored JWT token
   * Returns null if not authenticated
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated (has valid token in localStorage)
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * FORGOT PASSWORD - Request password reset email
   * Sends an email with a password reset link to the user's email address
   * 
   * @param email - User's email address
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * RESET PASSWORD - Set new password using reset token
   * Validates the token and updates the user's password
   * 
   * @param token - Reset token from email link
   * @param newPassword - New password to set
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/reset-password', { token, newPassword });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

