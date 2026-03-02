const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const loanController = require('../controllers/loanController');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/loans/check-availability
 * Check loan availability across all pools
 * Query params: loanAmount, duration, purpose (optional)
 */
router.get('/check-availability', loanController.checkLoanAvailability);

/**
 * GET /api/loans/paxg-price
 * Get current PAXG/USDT price for collateral conversion
 * Used by frontend for real-time price updates
 */
router.get('/paxg-price', loanController.getPAXGPrice);

/**
 * POST /api/loans/apply
 * Submit a loan application
 * Body: { poolId, loanAmount, duration, purpose }
 */
router.post('/apply', loanController.applyForLoan);

/**
 * GET /api/loans/my-loans
 * Get all loans for the authenticated student
 */
router.get('/my-loans', loanController.getMyLoans);

/**
 * GET /api/loans/:loanId
 * Get specific loan details
 */
router.get('/:loanId', loanController.getLoanById);

/**
 * DELETE /api/loans/:loanId/cancel
 * Cancel a loan application (only if collateral not deposited)
 */
router.delete('/:loanId/cancel', loanController.cancelLoan);

module.exports = router;
