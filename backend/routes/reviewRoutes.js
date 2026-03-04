const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authenticateToken = require('../middleware/authenticateToken');

// All routes require authentication
router.use(authenticateToken);

// Create a new review
router.post('/', reviewController.createReview);

// Get all reviews for a property
router.get('/property/:propertyId', reviewController.getPropertyReviews);

// Check if user has reviewed a property
router.get('/check/:propertyId', reviewController.checkReviewStatus);

// Update a review
router.put('/:reviewId', reviewController.updateReview);

// Delete a review
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
