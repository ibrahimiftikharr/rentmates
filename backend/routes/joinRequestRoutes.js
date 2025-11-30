const express = require('express');
const router = express.Router();
const joinRequestController = require('../controllers/joinRequestController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.get('/check-profile', joinRequestController.checkStudentProfileCompletion);
router.get('/check-visit/:propertyId', joinRequestController.checkPropertyVisit);
router.post('/check-bids/:propertyId', joinRequestController.checkHigherBids);
router.post('/', joinRequestController.createJoinRequest);
router.get('/student', joinRequestController.getStudentJoinRequests);
router.delete('/:requestId', joinRequestController.deleteJoinRequest);
router.post('/:requestId/sign-student', joinRequestController.studentSignContract);

// Landlord routes
router.get('/landlord', joinRequestController.getLandlordJoinRequests);
router.get('/landlord/check-profile', joinRequestController.checkLandlordProfileCompletion);
router.get('/landlord/tenants', joinRequestController.getLandlordTenants);
router.post('/:requestId/accept', joinRequestController.acceptJoinRequest);
router.post('/:requestId/reject', joinRequestController.rejectJoinRequest);
router.post('/:requestId/sign-landlord', joinRequestController.landlordSignContract);

module.exports = router;
