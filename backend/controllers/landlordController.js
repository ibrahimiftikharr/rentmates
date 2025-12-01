const Landlord = require('../models/landlordModel');
const User = require('../models/userModel');
const { cloudinary } = require('../config/cloudinary');
const { emitDashboardUpdate } = require('../utils/socketHelpers');

// ========================================
// GET LANDLORD PROFILE
// ========================================
const getProfile = async (req, res) => {
  try {
    console.log('========================================');
    console.log('GET LANDLORD PROFILE CALLED');
    console.log('User ID from token:', req.user?.id);
    console.log('========================================');
    
    const userId = req.user.id; // From authenticateToken middleware

    // Find landlord by user ID and populate user data
    let landlord = await Landlord.findOne({ user: userId }).populate('user', 'name email');

    // If landlord doesn't exist, create a new one
    if (!landlord) {
      landlord = new Landlord({
        user: userId,
        isProfileComplete: false,
        reputationScore: 20 // Start with 20 pts for email verification
      });
      await landlord.save();
      await landlord.populate('user', 'name email');
      console.log('✓ New landlord profile created with reputation score:', landlord.reputationScore);
    } else {
      // Fix existing landlords with 0 score - they should have at least 20 for email verification
      if (landlord.reputationScore === 0) {
        landlord.reputationScore = 20;
        await landlord.save();
        console.log('✓ Fixed reputation score for existing landlord:', landlord.reputationScore);
      }
      
      // Check basic profile completion to ensure isProfileComplete is up to date
      const wasComplete = landlord.isProfileComplete;
      landlord.checkBasicProfileCompletion();
      if (wasComplete !== landlord.isProfileComplete) {
        await landlord.save();
        console.log('✓ Updated profile completion status:', landlord.isProfileComplete);
      }
    }

    res.status(200).json({
      success: true,
      landlord: {
        id: landlord._id,
        name: landlord.user.name,
        email: landlord.user.email,
        phone: landlord.phone || '',
        nationality: landlord.nationality || '',
        address: landlord.address || '',
        governmentId: landlord.governmentId || '',
        profileImage: landlord.profileImage || '',
        govIdDocument: landlord.govIdDocument || '',
        reputationScore: landlord.reputationScore || 0,
        isProfileComplete: landlord.isProfileComplete || false,
        properties: landlord.properties || []
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ========================================
// UPDATE LANDLORD PROFILE
// ========================================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      phone,
      nationality,
      address,
      city,
      country,
      postalCode,
      governmentId
    } = req.body;

    // Find or create landlord
    let landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      landlord = new Landlord({ user: userId });
    }

    // Update fields
    if (phone) landlord.phone = phone;
    if (nationality) landlord.nationality = nationality;
    if (address) landlord.address = address;
    if (city) landlord.city = city;
    if (country) landlord.country = country;
    if (postalCode) landlord.postalCode = postalCode;
    if (governmentId) landlord.governmentId = governmentId;

    // Check basic profile completion (for adding properties)
    landlord.checkBasicProfileCompletion();
    
    // Recalculate reputation score
    await landlord.calculateReputationScore();
    
    landlord.updatedAt = Date.now();

    await landlord.save();
    await landlord.populate('user', 'name email');

    console.log('✓ Landlord profile updated:', landlord.user.email);
    console.log('✓ New reputation score:', landlord.reputationScore);

    // Emit Socket.IO event for real-time reputation update
    const io = req.app.get('io');
    if (io) {
      io.to(`landlord_${userId}`).emit('reputation_updated', {
        reputationScore: landlord.reputationScore,
        isProfileComplete: landlord.isProfileComplete
      });
      console.log(`✓ Emitted reputation_updated to landlord_${userId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      landlord: {
        id: landlord._id,
        name: landlord.user.name,
        email: landlord.user.email,
        phone: landlord.phone,
        nationality: landlord.nationality,
        address: landlord.address,
        city: landlord.city,
        country: landlord.country,
        postalCode: landlord.postalCode,
        governmentId: landlord.governmentId,
        profileImage: landlord.profileImage,
        govIdDocument: landlord.govIdDocument,
        reputationScore: landlord.reputationScore,
        totalReviews: landlord.totalReviews,
        isProfileComplete: landlord.isProfileComplete
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
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

    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    // Delete old image from Cloudinary if exists
    if (landlord.profileImage) {
      try {
        const publicId = landlord.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`rentmates/profiles/${publicId}`);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    // Save new image URL
    landlord.profileImage = req.file.path;
    
    // Check basic profile completion (for adding properties)
    landlord.checkBasicProfileCompletion();
    
    // Recalculate reputation score
    await landlord.calculateReputationScore();
    
    landlord.updatedAt = Date.now();
    await landlord.save();

    console.log('✓ Profile image uploaded:', req.file.path);
    console.log('✓ Profile complete status:', landlord.isProfileComplete);
    console.log('✓ New reputation score:', landlord.reputationScore);

    // Emit Socket.IO event for real-time reputation update
    const io = req.app.get('io');
    if (io) {
      io.to(`landlord_${userId}`).emit('reputation_updated', {
        reputationScore: landlord.reputationScore,
        profileImage: landlord.profileImage,
        isProfileComplete: landlord.isProfileComplete
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: req.file.path,
      reputationScore: landlord.reputationScore
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

    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    // Delete old document from Cloudinary if exists
    if (landlord.govIdDocument) {
      try {
        const publicId = landlord.govIdDocument.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`rentmates/documents/${publicId}`);
      } catch (err) {
        console.error('Error deleting old document:', err);
      }
    }

    // Save new document URL
    landlord.govIdDocument = req.file.path;
    
    // Recalculate reputation score
    await landlord.calculateReputationScore();
    
    landlord.updatedAt = Date.now();
    await landlord.save();

    console.log('✓ Government ID document uploaded:', req.file.path);
    console.log('✓ New reputation score:', landlord.reputationScore);

    // Emit Socket.IO event for real-time reputation update
    const io = req.app.get('io');
    if (io) {
      io.to(`landlord_${userId}`).emit('reputation_updated', {
        reputationScore: landlord.reputationScore,
        govIdDocument: landlord.govIdDocument
      });
    }

    res.status(200).json({
      success: true,
      message: 'Government ID document uploaded successfully',
      documentUrl: req.file.path,
      reputationScore: landlord.reputationScore
    });
  } catch (error) {
    console.error('Upload gov ID document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// ========================================
// UPDATE REPUTATION SCORE
// ========================================
const updateReputationScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scoreChange } = req.body;

    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    // Update reputation score (capped at 0-100)
    landlord.reputationScore = Math.max(0, Math.min(100, landlord.reputationScore + (scoreChange || 0)));

    landlord.updatedAt = Date.now();
    await landlord.save();

    console.log('✓ Reputation score updated:', landlord.reputationScore);

    res.status(200).json({
      success: true,
      message: 'Reputation score updated',
      reputationScore: landlord.reputationScore
    });
  } catch (error) {
    console.error('Update reputation score error:', error);
    res.status(500).json({ success: false, message: 'Failed to update reputation score' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadGovIdDocument,
  updateReputationScore
};
