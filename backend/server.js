const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/authRoutes.js');
const landlordRouter = require('./routes/landlordRoutes.js');
const propertyRouter = require('./routes/propertyRoutes.js');
const studentRouter = require('./routes/studentRoutes.js');
const publicStudentRouter = require('./routes/publicStudentRoutes.js');

// Load environment variables
dotenv.config();

// Global error handlers — log uncaught exceptions and unhandled rejections for visibility
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ibrahimiftikhar0864_db_user:iUKh7mLZxiEUYjbQ@rentmates.a4rija4.mongodb.net/?appName=RentMates';

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// ========================================
// DATABASE CONNECTION
// ========================================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch((err) => console.error('✗ MongoDB connection error:', err));

// ========================================
// ROUTES
// ========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes (signup, login, OTP, etc.)
app.use('/api/auth', authRouter);

// Landlord routes (profile, documents, reputation)
app.use('/api/landlord', landlordRouter);

// Property routes (CRUD operations)
app.use('/api/properties', propertyRouter);

// Student routes (profile, documents, housing preferences)
app.use('/api/student', studentRouter);

// Public student routes (search students, view public profiles)
app.use('/api/public', publicStudentRouter);

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`✓ Server is now running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});

