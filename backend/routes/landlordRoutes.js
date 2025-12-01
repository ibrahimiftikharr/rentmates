const express = require('express');
const landlordRouter = express.Router();
const landlordController = require('../controllers/landlordController');
const landlordDashboardController = require('../controllers/landlordDashboardController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadProfile, uploadDocument } = require('../config/cloudinary');

// All routes require authentication
landlordRouter.use(authenticateToken);

// ========================================
// DASHBOARD ROUTES
// ========================================

// Get dashboard metrics
landlordRouter.get('/dashboard/metrics', landlordDashboardController.getDashboardMetrics);

// Get upcoming payments
landlordRouter.get('/dashboard/upcoming-payments', landlordDashboardController.getUpcomingPayments);

// Get recent notifications for dashboard
landlordRouter.get('/dashboard/notifications', landlordDashboardController.getRecentNotifications);

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

// ========================================
// SETTINGS ROUTES
// ========================================

// Update password
landlordRouter.put('/settings/password', landlordController.updatePassword);

// Update notification preferences
landlordRouter.put('/settings/notifications', landlordController.updateNotificationPreferences);

// Update privacy settings
landlordRouter.put('/settings/privacy', landlordController.updatePrivacySettings);

module.exports = landlordRouter;
