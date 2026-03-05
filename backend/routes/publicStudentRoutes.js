const express = require('express');
const router = express.Router();
const publicStudentController = require('../controllers/publicStudentController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication (both students and landlords can view)
router.get('/students', authenticateToken, publicStudentController.getPublicStudents);
router.get('/students/:studentId', authenticateToken, publicStudentController.getPublicStudentProfile);

// Get students with compatibility scores (for Student Dashboard) - LEGACY
router.get('/students-compatibility', authenticateToken, publicStudentController.getStudentsWithCompatibility);

// Progressive loading endpoints (NEW - recommended)
router.get('/students-fast', authenticateToken, publicStudentController.getStudentsFast);
router.post('/calculate-compatibility', authenticateToken, publicStudentController.calculateCompatibilityScores);

module.exports = router;
