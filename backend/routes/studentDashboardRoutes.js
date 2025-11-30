const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboardController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// Dashboard metrics
router.get('/metrics', studentDashboardController.getDashboardMetrics);

// Recent activity
router.get('/activity', studentDashboardController.getRecentActivity);

// Latest notifications (for dashboard preview)
router.get('/notifications/latest', studentDashboardController.getLatestNotifications);

module.exports = router;
