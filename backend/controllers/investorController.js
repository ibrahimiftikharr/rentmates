const Investor = require('../models/investorModel');
const User = require('../models/userModel');
const { cloudinary } = require('../config/cloudinary');
const { getDashboardMetrics, getPoolRiskMetrics } = require('../services/investorDashboardService');
const { 
  getRiskPoolAllocation, 
  getPoolUtilizationAnalytics, 
  getInvestmentOpportunities,
  getCompleteAnalytics 
} = require('../services/investorAnalyticsService');

// ========================================
// GET INVESTOR PROFILE
// ========================================
const getProfile = async (req, res) => {
  try {
    console.log('========================================');
    console.log('GET INVESTOR PROFILE CALLED');
    console.log('User ID from token:', req.user?.id);
    console.log('========================================');
    
    const userId = req.user.id; // From authenticateToken middleware

    // Find investor by user ID and populate user data
    let investor = await Investor.findOne({ user: userId }).populate('user', 'name email');

    // If investor doesn't exist, create a new one
    if (!investor) {
      investor = new Investor({
        user: userId,
        isVerified: false,
        reputationScore: 20 // Start with 20 pts for email verification
      });
      await investor.save();
      await investor.populate('user', 'name email');
      console.log('✓ New investor profile created with reputation score:', investor.reputationScore);
    }

    res.status(200).json({
      success: true,
      investor: {
        id: investor._id,
        name: investor.user.name,
        email: investor.user.email,
        phone: investor.phone || '',
        profileImage: investor.profileImage || '',
        govIdDocument: investor.govIdDocument || '',
        isVerified: investor.isVerified || false,
        reputationScore: investor.reputationScore || 20
      }
    });
  } catch (error) {
    console.error('Get investor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ========================================
// UPDATE INVESTOR PROFILE
// ========================================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    // Find or create investor
    let investor = await Investor.findOne({ user: userId });
    if (!investor) {
      investor = new Investor({ user: userId });
    }

    // Update fields
    if (phone !== undefined) investor.phone = phone;

    investor.updatedAt = Date.now();
    await investor.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      investor: {
        id: investor._id,
        phone: investor.phone,
        profileImage: investor.profileImage,
        govIdDocument: investor.govIdDocument,
        isVerified: investor.isVerified,
        reputationScore: investor.reputationScore
      }
    });
  } catch (error) {
    console.error('Update investor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ========================================
// UPLOAD PROFILE IMAGE
// ========================================
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const investor = await Investor.findOne({ user: userId });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' });
    }

    // Delete old image from Cloudinary if exists
    if (investor.profileImage) {
      try {
        const publicId = investor.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`rentmates/profiles/${publicId}`);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    // Save new image URL
    investor.profileImage = req.file.path;
    investor.updatedAt = Date.now();
    await investor.save();

    console.log('✓ Profile image uploaded:', req.file.path);

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: req.file.path
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
};

// ========================================
// UPLOAD GOVERNMENT ID DOCUMENT
// ========================================
const uploadGovIdDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const investor = await Investor.findOne({ user: userId });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' });
    }

    // Delete old document from Cloudinary if exists
    if (investor.govIdDocument) {
      try {
        const publicId = investor.govIdDocument.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`rentmates/documents/${publicId}`);
      } catch (err) {
        console.error('Error deleting old document:', err);
      }
    }

    // Save new document URL
    investor.govIdDocument = req.file.path;
    
    // Update verification status
    investor.updateVerificationStatus();
    
    investor.updatedAt = Date.now();
    await investor.save();

    console.log('✓ Government ID document uploaded:', req.file.path);
    console.log('✓ Verification status:', investor.isVerified);

    res.status(200).json({
      success: true,
      message: 'Government ID document uploaded successfully',
      documentUrl: req.file.path,
      isVerified: investor.isVerified
    });
  } catch (error) {
    console.error('Upload gov ID document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// ========================================
// DELETE PROFILE IMAGE
// ========================================
const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    const investor = await Investor.findOne({ user: userId });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' });
    }

    if (!investor.profileImage) {
      return res.status(400).json({ success: false, message: 'No profile image to delete' });
    }

    // Delete image from Cloudinary
    try {
      const publicId = investor.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`rentmates/profiles/${publicId}`);
    } catch (err) {
      console.error('Error deleting image from Cloudinary:', err);
    }

    // Clear image URL
    investor.profileImage = '';
    investor.updatedAt = Date.now();
    await investor.save();

    console.log('✓ Profile image deleted');

    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};

// ========================================
// DELETE GOVERNMENT ID DOCUMENT
// ========================================
const deleteGovIdDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    const investor = await Investor.findOne({ user: userId });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' });
    }

    if (!investor.govIdDocument) {
      return res.status(400).json({ success: false, message: 'No government ID document to delete' });
    }

    // Delete document from Cloudinary
    try {
      const publicId = investor.govIdDocument.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`rentmates/documents/${publicId}`);
    } catch (err) {
      console.error('Error deleting document from Cloudinary:', err);
    }

    // Clear document URL and update verification status
    investor.govIdDocument = '';
    investor.updateVerificationStatus();
    investor.updatedAt = Date.now();
    await investor.save();

    console.log('✓ Government ID document deleted');
    console.log('✓ Verification status:', investor.isVerified);

    res.status(200).json({
      success: true,
      message: 'Government ID document deleted successfully',
      isVerified: investor.isVerified
    });
  } catch (error) {
    console.error('Delete gov ID document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

// ========================================
// GET DASHBOARD METRICS
// ========================================
const getDashboard = async (req, res) => {
  try {
    const investorId = req.user.id;
    
    // Get dashboard metrics
    const metrics = await getDashboardMetrics(investorId);
    
    // Get pool risk metrics
    const riskMetrics = await getPoolRiskMetrics();
    
    res.json({
      success: true,
      metrics: metrics,
      poolRisks: riskMetrics
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard metrics' 
    });
  }
};

// ========================================
// GET POOL RISK ANALYTICS
// ========================================
const getPoolRiskAnalytics = async (req, res) => {
  try {
    const riskMetrics = await getPoolRiskMetrics();
    
    res.json({
      success: true,
      poolRisks: riskMetrics
    });
  } catch (error) {
    console.error('Get pool risk analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch risk analytics' 
    });
  }
};

// ========================================
// GET ANALYTICS - RISK POOL ALLOCATION
// ========================================
const getAnalyticsRiskAllocation = async (req, res) => {
  try {
    const investorId = req.user.id;
    const data = await getRiskPoolAllocation(investorId);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get risk allocation analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch risk allocation analytics' 
    });
  }
};

// ========================================
// GET ANALYTICS - POOL UTILIZATION
// ========================================
const getAnalyticsPoolUtilization = async (req, res) => {
  try {
    const data = await getPoolUtilizationAnalytics();
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get pool utilization analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pool utilization analytics' 
    });
  }
};

// ========================================
// GET ANALYTICS - INVESTMENT OPPORTUNITIES
// ========================================
const getAnalyticsOpportunities = async (req, res) => {
  try {
    const data = await getInvestmentOpportunities();
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get investment opportunities analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch investment opportunities' 
    });
  }
};

// ========================================
// GET COMPLETE ANALYTICS
// ========================================
const getAnalyticsComplete = async (req, res) => {
  try {
    const investorId = req.user.id;
    const data = await getCompleteAnalytics(investorId);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get complete analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch complete analytics' 
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadGovIdDocument,
  deleteProfileImage,
  deleteGovIdDocument,
  getDashboard,
  getPoolRiskAnalytics,
  getAnalyticsRiskAllocation,
  getAnalyticsPoolUtilization,
  getAnalyticsOpportunities,
  getAnalyticsComplete
};
