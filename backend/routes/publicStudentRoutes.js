const express = require('express');
const router = express.Router();
const publicStudentController = require('../controllers/publicStudentController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication (both students and landlords can view)
router.get('/students', authenticateToken, publicStudentController.getPublicStudents);
router.get('/students/:studentId', authenticateToken, publicStudentController.getPublicStudentProfile);

// Get students with compatibility scores (for Student Dashboard)
router.get('/students-compatibility', authenticateToken, publicStudentController.getStudentsWithCompatibility);

module.exports = router;
