const express = require('express');
const router = express.Router();
const visitRequestController = require('../controllers/visitRequestController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// Get available time slots (Student)
router.get('/available-slots', visitRequestController.getAvailableTimeSlots);

// Student routes
router.post('/', visitRequestController.createVisitRequest);
router.get('/student', visitRequestController.getStudentVisitRequests);

// Landlord routes
router.get('/landlord', visitRequestController.getLandlordVisitRequests);
router.put('/:visitRequestId/confirm', visitRequestController.confirmVisitRequest);
router.put('/:visitRequestId/reschedule', visitRequestController.rescheduleVisitRequest);
router.put('/:visitRequestId/reject', visitRequestController.rejectVisitRequest);
router.put('/:visitRequestId/complete', visitRequestController.completeVisitRequest);

module.exports = router;
