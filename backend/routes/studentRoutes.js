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

// ========================================
// WISHLIST ROUTES
// ========================================

// Get wishlist
studentRouter.get('/wishlist', studentController.getWishlist);

// Add to wishlist
studentRouter.post('/wishlist', studentController.addToWishlist);

// Remove from wishlist
studentRouter.delete('/wishlist/:propertyId', studentController.removeFromWishlist);

module.exports = studentRouter;
