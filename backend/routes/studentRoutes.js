const express = require('express');
const studentRouter = express.Router();
const studentController = require('../controllers/studentController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadDocument } = require('../config/cloudinary');

// All routes require authentication
studentRouter.use(authenticateToken);

// ========================================
// STUDENT PROFILE ROUTES
// ========================================

// Get student profile
studentRouter.get('/profile', studentController.getStudentProfile);

// Update student profile
studentRouter.put('/profile', studentController.updateStudentProfile);

// Upload document
studentRouter.post('/profile/upload-document', uploadDocument.single('document'), studentController.uploadDocument);

// Delete document
studentRouter.delete('/profile/document/:documentType', studentController.deleteDocument);

module.exports = studentRouter;
