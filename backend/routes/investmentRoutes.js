const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// GET /api/investment/pools - Get all investment pools with dynamic calculations
router.get('/pools', investmentController.getAllPools);

// GET /api/investment/my-investments - Get user's investments
router.get('/my-investments', investmentController.getUserInvestments);

// POST /api/investment/invest - Make an investment in a pool
router.post('/invest', investmentController.investInPool);

// GET /api/investment/stats - Get investment statistics for dashboard
router.get('/stats', investmentController.getInvestmentStats);

module.exports = router;
