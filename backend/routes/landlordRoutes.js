const express = require('express');
const landlordRouter = express.Router();
const landlordController = require('../controllers/landlordController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadProfile, uploadDocument } = require('../config/cloudinary');

// All routes require authentication
landlordRouter.use(authenticateToken);

// ========================================
// PROFILE ROUTES
// ========================================

// Get landlord profile
landlordRouter.get('/profile', landlordController.getProfile);

// Update landlord profile
landlordRouter.put('/profile', landlordController.updateProfile);

// Upload profile image
landlordRouter.post('/profile/upload-image', uploadProfile.single('profileImage'), landlordController.uploadProfileImage);

// Upload government ID document
landlordRouter.post('/profile/upload-document', uploadDocument.single('govIdDocument'), landlordController.uploadGovIdDocument);

// Update reputation score
landlordRouter.put('/reputation', landlordController.updateReputationScore);

module.exports = landlordRouter;
