const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const loanController = require('../controllers/loanController');
const loanRepaymentController = require('../controllers/loanRepaymentController');

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

// ===== LOAN REPAYMENT ROUTES =====

/**
 * GET /api/loans/repayment/active
 * Get active loan details for repayment page
 */
router.get('/repayment/active', loanRepaymentController.getActiveLoan);

/**
 * POST /api/loans/repayment/pay
 * Pay loan installment manually
 */
router.post('/repayment/pay', loanRepaymentController.payInstallment);

/**
 * POST /api/loans/repayment/toggle-auto
 * Toggle auto-repayment for active loan
 * Body: { enabled: boolean }
 */
router.post('/repayment/toggle-auto', loanRepaymentController.toggleAutoRepayment);

/**
 * GET /api/loans/repayment/history
 * Get loan repayment history and schedule
 */
router.get('/repayment/history', loanRepaymentController.getRepaymentHistory);

module.exports = router;
