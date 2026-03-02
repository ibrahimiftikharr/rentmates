const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const collateralController = require('../controllers/collateralController');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/collateral/contracts
 * Get smart contract addresses for frontend integration
 */
router.get('/contracts', collateralController.getContractAddresses);

/**
 * GET /api/collateral/balances
 * Get wallet PAXG balance and deposited collateral
 * Query params: walletAddress
 */
router.get('/balances', collateralController.getWalletBalances);

/**
 * GET /api/collateral/pending-loan/:loanId
 * Get pending loan details for collateral deposit
 */
router.get('/pending-loan/:loanId', collateralController.getPendingLoan);

/**
 * POST /api/collateral/confirm-deposit
 * Verify and confirm collateral deposit transaction
 * Body: { loanId, txHash, walletAddress }
 */
router.post('/confirm-deposit', collateralController.confirmCollateralDeposit);

/**
 * GET /api/collateral/my-collateral
 * Get all user's collateral deposits
 */
router.get('/my-collateral', collateralController.getMyCollateral);

module.exports = router;
