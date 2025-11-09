const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authenticateToken');

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// Send OTP to email for verification
authRouter.post('/send-otp', authController.sendOTP);

// Verify OTP entered by user
authRouter.post('/verify-otp', authController.verifyOTP);

// Create new user account (after OTP verification)
authRouter.post('/signup', authController.signup);

// Login existing user
authRouter.post('/login', authController.login);

// Forgot password - send reset email
authRouter.post('/forgot-password', authController.forgotPassword);

// Reset password with token
authRouter.post('/reset-password', authController.resetPassword);

// ========================================
// PROTECTED ROUTES (Require authentication token)
// ========================================

// Get current authenticated user profile
authRouter.get('/me', authenticateToken, authController.getCurrentUser);

// ========================================
// DEBUG ENDPOINT (Development Only)
// ========================================

// Get stored OTP for testing (dev-only, blocked in production)
authRouter.get('/debug-otp', authController.getOTP);

module.exports = authRouter;
