const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const securityDepositController = require('../controllers/securityDepositController');

// Student routes
router.get('/status', authenticateToken, securityDepositController.getSecurityDepositStatus);
router.post('/pay', authenticateToken, securityDepositController.paySecurityDeposit);
router.post('/request-refund', authenticateToken, securityDepositController.requestRefundByStudent);

// Landlord routes
router.post('/refund', authenticateToken, securityDepositController.refundSecurityDeposit);
router.get('/landlord/:rentalId', authenticateToken, securityDepositController.getLandlordRentalSecurityDeposit);

module.exports = router;
