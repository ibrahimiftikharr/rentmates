const { generateOTP, sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Get JWT secret from environment or use default (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const signup = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!['student', 'landlord'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password before storing (never store plain text passwords)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user document
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: true // OTP has already been verified at this point
    });

    // Save user to MongoDB
    await user.save();
    console.log('✓ User saved to MongoDB:', email);

    // Create Student or Landlord profile based on role
    let profileId = null;
    if (role === 'student') {
      const student = new Student({
        user: user._id,
        reputationScore: 0
      });
      await student.save();
      profileId = student._id.toString();
      console.log('✓ Student profile created:', profileId);
    } else if (role === 'landlord') {
      const landlord = new Landlord({
        user: user._id,
        reputationScore: 0
      });
      await landlord.save();
      profileId = landlord._id.toString();
      console.log('✓ Landlord profile created:', profileId);
    }

    // Generate JWT token for automatic login after signup
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success with token and user data
    const response = {
      message: 'User created successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    // Add studentId or landlordId to response
    if (role === 'student' && profileId) {
      response.user.studentId = profileId;
    } else if (role === 'landlord' && profileId) {
      response.user.landlordId = profileId;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
}

// ========================================
// LOGIN - Authenticate existing user
// ========================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user in database by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password against hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get student or landlord ID based on role
    let profileId = null;
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      profileId = student ? student._id.toString() : null;
    } else if (user.role === 'landlord') {
      const landlord = await Landlord.findOne({ user: user._id });
      profileId = landlord ? landlord._id.toString() : null;
    }

    // Generate JWT token for authenticated session
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success with token and user data
    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    // Add studentId or landlordId based on role
    if (user.role === 'student' && profileId) {
      response.user.studentId = profileId;
    } else if (user.role === 'landlord' && profileId) {
      response.user.landlordId = profileId;
    }

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}

// ========================================
// GET CURRENT USER - Fetch authenticated user's profile
// ========================================
const getCurrentUser = async (req, res) => {
  try {
    // Find user by ID from JWT token (set by authenticateToken middleware)
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user profile (password excluded)
    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// ========================================
// OTP STORAGE (In-Memory Map)
// In production, use Redis or a database with TTL
// ========================================
const otpStore = new Map();

// ========================================
// SEND OTP - Generate and email verification code
// ========================================
const sendOTP = async (req, res) => {
    try {
      const { email, resend } = req.body;
      
      // Validate email
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const storedData = otpStore.get(email);

      // If OTP already sent and not expired, don't send again (unless resend requested)
      if (storedData && (Date.now() - storedData.timestamp <= 10 * 60 * 1000) && !resend) {
        return res.status(200).json({ message: 'OTP already sent', email });
      }

      // Throttle resend requests: require at least 60s between resends
      if (resend && storedData && (Date.now() - storedData.timestamp < 60 * 1000)) {
        return res.status(429).json({ error: 'Please wait before requesting a new OTP' });
      }

      // Generate 6-digit OTP
      const otp = generateOTP();
      
      // Store OTP in memory with timestamp (expires in 10 minutes)
      otpStore.set(email, {
        otp,
        timestamp: Date.now(),
        attempts: 0 // Track verification attempts (max 3)
      });

      // Send OTP via email
      await sendOTPEmail(email, otp);
      console.log('✓ OTP sent to:', email);

      res.status(200).json({ 
        message: 'OTP sent successfully',
        email 
      });
    } catch (error) {
      console.error('Error in sendOTP:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

  // ========================================
  // VERIFY OTP - Validate user-entered OTP
  // ========================================
  const verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      // Validate required fields
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      const storedData = otpStore.get(email);
      
      // Check if OTP exists for this email
      if (!storedData) {
        return res.status(400).json({ error: 'OTP expired or not found' });
      }

      // Check if OTP has expired (10 minutes)
      if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired' });
      }

      // Check if too many failed attempts
      if (storedData.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'Too many attempts. Please request a new OTP' });
      }

      // Verify OTP matches
      if (storedData.otp !== otp) {
        storedData.attempts++;
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      // OTP verified successfully - clear it from storage
      otpStore.delete(email);
      console.log('✓ OTP verified for:', email);

      res.status(200).json({
        message: 'OTP verified successfully',
        email 
      });
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }

// ========================================
// DEBUG ENDPOINT (Development Only)
// Get stored OTP for testing - DO NOT USE IN PRODUCTION
// ========================================
const getOTP = async (req, res) => {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }

    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email query param is required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(404).json({ error: 'No OTP found for this email' });
    }

    return res.json({ 
      email, 
      otp: storedData.otp, 
      timestamp: storedData.timestamp 
    });
  } catch (error) {
    console.error('Error in getOTP:', error);
    res.status(500).json({ error: 'Failed to get OTP' });
  }
};

// ========================================
// FORGOT PASSWORD - Send reset token via email
// ========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists for security
      return res.status(200).json({ message: 'If the email exists, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store hashed token and expiry in database (1 hour from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset token
    await sendPasswordResetEmail(email, resetToken);

    console.log('✓ Password reset email sent to:', email);
    res.status(200).json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// ========================================
// RESET PASSWORD - Verify token and update password
// ========================================
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✓ Password reset successfully for:', user.email);
    res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// ========================================
// EXPORT ALL FUNCTIONS
// ========================================
module.exports = {
  sendOTP,
  verifyOTP,
  signup,
  login,
  getCurrentUser,
  getOTP,  // Dev-only debug endpoint
  forgotPassword,
  resetPassword
};