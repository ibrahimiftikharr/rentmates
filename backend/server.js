const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/authRoutes.js');
const landlordRouter = require('./routes/landlordRoutes.js');
const propertyRouter = require('./routes/propertyRoutes.js');
const studentRouter = require('./routes/studentRoutes.js');
const publicStudentRouter = require('./routes/publicStudentRoutes.js');
const visitRequestRouter = require('./routes/visitRequestRoutes.js');
const notificationRouter = require('./routes/notificationRoutes.js');
const messageRouter = require('./routes/messageRoutes.js');

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
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to route handlers
app.set('io', io);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ibrahimiftikhar0864_db_user:iUKh7mLZxiEUYjbQ@rentmates.a4rija4.mongodb.net/?appName=RentMates';

// ========================================
// SOCKET.IO CONNECTION
// ========================================
io.on('connection', (socket) => {
  console.log('✓ Client connected:', socket.id);

  // Join user-specific room
  socket.on('join_room', (data) => {
    const { userId, role } = data;
    const roomName = `${role}_${userId}`;
    socket.join(roomName);
    socket.join(`user_${userId}`); // Also join generic user room for messaging
    console.log(`User joined rooms: ${roomName}, user_${userId}`);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    io.to(`user_${recipientId}`).emit('user_typing', {
      userId: data.userId,
      isTyping
    });
  });

  // Online status
  socket.on('user_online', (userId) => {
    socket.broadcast.emit('user_status_change', {
      userId,
      isOnline: true
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

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

// Visit request routes
app.use('/api/visit-requests', visitRequestRouter);

// Notification routes
app.use('/api/notifications', notificationRouter);

// Message routes
app.use('/api/messages', messageRouter);

// Log all registered routes for debugging
console.log('\n📋 Registered routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`  ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
  } else if (r.name === 'router') {
    r.handle.stack.forEach((handler) => {
      if (handler.route) {
        const route = handler.route;
        const method = Object.keys(route.methods)[0].toUpperCase();
        console.log(`  ${method} ${r.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '')}${route.path}`);
      }
    });
  }
});
console.log('');

// ========================================
// START SERVER
// ========================================
server.listen(PORT, () => {
  console.log(`✓ Server is now running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`✓ Socket.IO is ready for real-time connections`);
});

