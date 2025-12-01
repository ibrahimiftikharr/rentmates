const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// POST /api/wallet/connect - Connect MetaMask wallet
router.post('/connect', walletController.connectWallet);

// GET /api/wallet/balance - Get user's wallet balances
router.get('/balance', walletController.getBalance);

// POST /api/wallet/deposit - Record a deposit (after user deposits via MetaMask)
router.post('/deposit', walletController.recordDeposit);

// POST /api/wallet/withdraw - Withdraw USDT from vault to user's wallet
router.post('/withdraw', walletController.withdraw);

// POST /api/wallet/pay-rent - Pay rent (off-chain transfer from student to landlord)
router.post('/pay-rent', walletController.payRent);

// GET /api/wallet/transactions - Get transaction history with filtering
router.get('/transactions', walletController.getTransactionHistory);

// GET /api/wallet/rental-info - Get student's active rental information
router.get('/rental-info', walletController.getStudentRentalInfo);

// GET /api/wallet/vault-info - Get vault contract information
router.get('/vault-info', walletController.getVaultInfo);

module.exports = router;
