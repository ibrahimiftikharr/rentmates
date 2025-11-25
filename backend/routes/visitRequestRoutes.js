const express = require('express');
const router = express.Router();
const visitRequestController = require('../controllers/visitRequestController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.post('/', visitRequestController.createVisitRequest);
router.get('/student', visitRequestController.getStudentVisitRequests);

// Landlord routes
router.get('/landlord', visitRequestController.getLandlordVisitRequests);
router.put('/:visitRequestId/confirm', visitRequestController.confirmVisitRequest);
router.put('/:visitRequestId/reschedule', visitRequestController.rescheduleVisitRequest);
router.put('/:visitRequestId/reject', visitRequestController.rejectVisitRequest);

module.exports = router;
