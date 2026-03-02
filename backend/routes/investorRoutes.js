const express = require('express');
const investorRouter = express.Router();
const investorController = require('../controllers/investorController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadProfile, uploadDocument } = require('../config/cloudinary');

// All routes require authentication
investorRouter.use(authenticateToken);

// ========================================
// PROFILE ROUTES
// ========================================

// Get investor profile
investorRouter.get('/profile', investorController.getProfile);

// Update investor profile
investorRouter.put('/profile', investorController.updateProfile);

// Upload profile image
investorRouter.post('/profile/upload-image', uploadProfile.single('profileImage'), investorController.uploadProfileImage);

// Upload government ID document
investorRouter.post('/profile/upload-document', uploadDocument.single('govIdDocument'), investorController.uploadGovIdDocument);

// Delete profile image
investorRouter.delete('/profile/image', investorController.deleteProfileImage);

// Delete government ID document
investorRouter.delete('/profile/document', investorController.deleteGovIdDocument);

module.exports = investorRouter;
