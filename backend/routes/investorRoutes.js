const express = require('express');
const investorRouter = express.Router();
const investorController = require('../controllers/investorController');
const portfolioController = require('../controllers/investorPortfolioController');
const investmentController = require('../controllers/investmentController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadProfile, uploadDocument } = require('../config/cloudinary');

// All routes require authentication
investorRouter.use(authenticateToken);

// ========================================
// DASHBOARD ROUTES
// ========================================

// Get dashboard metrics and analytics
investorRouter.get('/dashboard/metrics', investorController.getDashboard);

// Get pool risk analytics
investorRouter.get('/dashboard/risk-analytics', investorController.getPoolRiskAnalytics);

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

// ========================================
// PORTFOLIO & INVESTMENT ROUTES
// ========================================

// Get all active investments with performance data
investorRouter.get('/portfolio/investments', portfolioController.getActiveInvestments);

// Get detailed information for a specific investment
investorRouter.get('/portfolio/investments/:investmentId', portfolioController.getInvestmentDetails);

// Get repayment schedule for loans in a specific pool
investorRouter.get('/portfolio/pools/:poolId/schedule', portfolioController.getPoolRepaymentSchedule);

// Get portfolio-wide performance graph data
investorRouter.get('/portfolio/performance', portfolioController.getPortfolioPerformance);

// ========================================
// INVESTMENT ACTIONS
// ========================================

// Withdraw from investment pool (sell shares)
investorRouter.post('/portfolio/withdraw', investmentController.withdrawFromPool);

module.exports = investorRouter;
