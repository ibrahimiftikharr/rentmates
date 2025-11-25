const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticateToken = require('../middleware/authenticateToken');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for current user
router.get('/conversations', messageController.getConversations);

// Get messages for a specific conversation
router.get('/messages/:recipientId', messageController.getMessages);

// Send a message
router.post('/send', messageController.sendMessage);

// Mark messages as read
router.put('/read/:conversationId', messageController.markAsRead);

// Upload media (image)
router.post('/upload', upload.single('media'), messageController.uploadMedia);

// Search users
router.get('/search', messageController.searchUsers);

module.exports = router;
