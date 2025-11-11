const express = require('express');
const propertyRouter = express.Router();
const propertyController = require('../controllers/propertyController');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadProperty } = require('../config/cloudinary');

// All routes require authentication
propertyRouter.use(authenticateToken);

// ========================================
// PROPERTY ROUTES
// ========================================

// Get all active properties (for students)
propertyRouter.get('/all', propertyController.getAllProperties);

// Create new property
propertyRouter.post('/', uploadProperty.array('images', 10), propertyController.createProperty);

// Get all properties for logged-in landlord
propertyRouter.get('/my-properties', propertyController.getMyProperties);

// Get single property
propertyRouter.get('/:id', propertyController.getProperty);

// Update property
propertyRouter.put('/:id', propertyController.updateProperty);

// Delete property
propertyRouter.delete('/:id', propertyController.deleteProperty);

module.exports = propertyRouter;
