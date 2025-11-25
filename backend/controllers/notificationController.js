const Notification = require('../models/notificationModel');
const Student = require('../models/studentModel');

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let recipientId;
    let recipientModel;

    if (userRole === 'student') {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }
      recipientId = student._id;
      recipientModel = 'Student';
    } else if (userRole === 'landlord') {
      recipientId = userId;
      recipientModel = 'Landlord';
    }

    const notifications = await Notification.find({
      recipient: recipientId,
      recipientModel
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      recipientModel,
      read: false
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let recipientId;
    let recipientModel;

    if (userRole === 'student') {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }
      recipientId = student._id;
      recipientModel = 'Student';
    } else if (userRole === 'landlord') {
      recipientId = userId;
      recipientModel = 'Landlord';
    }

    await Notification.updateMany(
      { recipient: recipientId, recipientModel, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let recipientId;
    let recipientModel;

    if (userRole === 'student') {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }
      recipientId = student._id;
      recipientModel = 'Student';
    } else if (userRole === 'landlord') {
      recipientId = userId;
      recipientModel = 'Landlord';
    }

    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      recipientModel,
      read: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
