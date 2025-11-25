const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { cloudinary } = require('../config/cloudinary');

// ========================================
// GET ALL CONVERSATIONS FOR CURRENT USER
// ========================================
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user's profile ID
    let profileId;
    if (userRole === 'student') {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      profileId = student._id;
    } else {
      const landlord = await Landlord.findOne({ user: userId });
      if (!landlord) {
        return res.status(404).json({ success: false, message: 'Landlord profile not found' });
      }
      profileId = landlord._id;
    }

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
    .sort({ 'lastMessage.timestamp': -1 })
    .lean();

    // Populate participant details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          p => p.userId.toString() !== userId.toString()
        );

        if (!otherParticipant) return null;

        // Get other user details
        const otherUser = await User.findById(otherParticipant.userId).select('name email');
        
        // Get profile image based on role
        let profileImage = '';
        if (otherParticipant.userModel === 'Student') {
          const student = await Student.findById(otherParticipant.profileId);
          profileImage = student?.documents?.profileImage || '';
        } else {
          const landlord = await Landlord.findById(otherParticipant.profileId);
          profileImage = landlord?.profileImage || '';
        }

        // Get unread count for current user
        const unreadCount = conv.unreadCount?.get(userId.toString()) || 0;

        return {
          conversationId: conv._id,
          recipientId: otherParticipant.userId,
          recipientName: otherUser?.name || 'Unknown User',
          recipientRole: otherParticipant.userModel,
          recipientProfileImage: profileImage,
          lastMessage: conv.lastMessage?.content || '',
          lastMessageTimestamp: conv.lastMessage?.timestamp || conv.createdAt,
          unreadCount,
          createdAt: conv.createdAt
        };
      })
    );

    // Filter out null values
    const validConversations = populatedConversations.filter(c => c !== null);

    res.status(200).json({
      success: true,
      conversations: validConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// ========================================
// GET MESSAGES FOR A CONVERSATION
// ========================================
const getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.id;

    // Generate conversation ID
    const conversationId = Conversation.generateConversationId(userId, recipientId);

    // Get messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name')
      .lean();

    // Mark messages as delivered if they were sent to current user
    await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        status: 'sent'
      },
      { status: 'delivered' }
    );

    // Emit socket event for delivery status update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${recipientId}`).emit('messages_delivered', {
        conversationId,
        deliveredBy: userId
      });
    }

    res.status(200).json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        messageType: msg.messageType,
        mediaUrl: msg.mediaUrl,
        senderId: msg.sender._id,
        senderName: msg.sender.name,
        recipientId: msg.recipient,
        status: msg.status,
        timestamp: msg.createdAt,
        readAt: msg.readAt
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// ========================================
// SEND MESSAGE
// ========================================
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text', mediaUrl = null } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: 'Recipient and content are required' });
    }

    // Get recipient info
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const recipientRole = recipientUser.role;

    // Generate conversation ID
    const conversationId = Conversation.generateConversationId(userId, recipientId);

    // Get sender and recipient profile IDs
    let senderProfileId, recipientProfileId;
    
    if (userRole === 'student') {
      const student = await Student.findOne({ user: userId });
      senderProfileId = student._id;
    } else {
      const landlord = await Landlord.findOne({ user: userId });
      senderProfileId = landlord._id;
    }

    if (recipientRole === 'student') {
      const student = await Student.findOne({ user: recipientId });
      recipientProfileId = student._id;
    } else {
      const landlord = await Landlord.findOne({ user: recipientId });
      recipientProfileId = landlord._id;
    }

    // Create message
    const message = new Message({
      sender: userId,
      senderModel: userRole === 'student' ? 'Student' : 'Landlord',
      recipient: recipientId,
      recipientModel: recipientRole === 'student' ? 'Student' : 'Landlord',
      conversationId,
      content,
      messageType,
      mediaUrl,
      status: 'sent'
    });

    await message.save();
    await message.populate('sender', 'name');

    // Update or create conversation
    let conversation = await Conversation.findOne({
      $and: [
        { 'participants.userId': userId },
        { 'participants.userId': recipientId }
      ]
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId, userModel: userRole === 'student' ? 'Student' : 'Landlord', profileId: senderProfileId },
          { userId: recipientId, userModel: recipientRole === 'student' ? 'Student' : 'Landlord', profileId: recipientProfileId }
        ],
        lastMessage: {
          content,
          sender: userId,
          timestamp: new Date()
        },
        unreadCount: new Map([[recipientId.toString(), 1]])
      });
    } else {
      conversation.lastMessage = {
        content,
        sender: userId,
        timestamp: new Date()
      };
      
      const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
      conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
    }

    await conversation.save();

    // Create notification for recipient
    const senderUser = await User.findById(userId);
    await Notification.create({
      recipient: recipientProfileId,
      recipientModel: recipientRole === 'student' ? 'Student' : 'Landlord',
      type: 'message',
      title: `New message from ${senderUser.name}`,
      message: content.length > 50 ? content.substring(0, 50) + '...' : content,
      relatedId: message._id,
      relatedModel: 'Message',
      read: false
    });

    // Emit real-time socket events
    const io = req.app.get('io');
    if (io) {
      // Send message to recipient
      io.to(`user_${recipientId}`).emit('new_message', {
        conversationId,
        message: {
          id: message._id,
          content: message.content,
          messageType: message.messageType,
          mediaUrl: message.mediaUrl,
          senderId: message.sender._id,
          senderName: message.sender.name,
          recipientId: message.recipient,
          status: message.status,
          timestamp: message.createdAt
        }
      });

      // Send notification
      const recipientRoomId = recipientRole === 'student' ? `student_${recipientId}` : `landlord_${recipientId}`;
      io.to(recipientRoomId).emit('new_notification', {
        type: 'message',
        title: `New message from ${senderUser.name}`,
        message: content.length > 50 ? content.substring(0, 50) + '...' : content
      });
    }

    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        senderId: message.sender._id,
        senderName: message.sender.name,
        recipientId: message.recipient,
        status: message.status,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// ========================================
// MARK MESSAGES AS READ
// ========================================
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Update message status
    const result = await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    // Update conversation unread count
    await Conversation.updateOne(
      {
        _id: conversationId,
        'participants.userId': userId
      },
      {
        [`unreadCount.${userId}`]: 0
      }
    );

    // Emit socket event for read status
    const io = req.app.get('io');
    if (io) {
      const conversation = await Conversation.findById(conversationId);
      const otherParticipant = conversation.participants.find(
        p => p.userId.toString() !== userId.toString()
      );

      if (otherParticipant) {
        io.to(`user_${otherParticipant.userId}`).emit('messages_read', {
          conversationId,
          readBy: userId
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
};

// ========================================
// UPLOAD MESSAGE MEDIA
// ========================================
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'rentmates/messages',
      resource_type: 'auto'
    });

    res.status(200).json({
      success: true,
      mediaUrl: result.secure_url,
      mediaType: result.resource_type
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media' });
  }
};

// ========================================
// SEARCH USERS
// ========================================
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    // Search in users
    const users = await User.find({
      _id: { $ne: currentUserId },
      name: { $regex: query, $options: 'i' }
    })
    .select('name email role')
    .limit(10);

    // Get profile images
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        let profileImage = '';
        
        if (user.role === 'student') {
          const student = await Student.findOne({ user: user._id });
          profileImage = student?.documents?.profileImage || '';
        } else {
          const landlord = await Landlord.findOne({ user: user._id });
          profileImage = landlord?.profileImage || '';
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithProfiles
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  uploadMedia,
  searchUsers
};
