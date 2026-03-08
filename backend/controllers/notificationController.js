const Notification = require('../models/notificationModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const Investor = require('../models/investorModel');

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
      const landlord = await Landlord.findOne({ user: userId });
      if (!landlord) {
        return res.status(404).json({
          success: false,
          message: 'Landlord profile not found'
        });
      }
      recipientId = landlord._id;
      recipientModel = 'Landlord';
    } else if (userRole === 'investor') {
      const investor = await Investor.findOne({ user: userId });
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor profile not found'
        });
      }
      recipientId = investor._id;
      recipientModel = 'Investor';
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
      const landlord = await Landlord.findOne({ user: userId });
      if (!landlord) {
        return res.status(404).json({
          success: false,
          message: 'Landlord profile not found'
        });
      }
      recipientId = landlord._id;
      recipientModel = 'Landlord';
    } else if (userRole === 'investor') {
      const investor = await Investor.findOne({ user: userId });
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor profile not found'
        });
      }
      recipientId = investor._id;
      recipientModel = 'Investor';
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
      const landlord = await Landlord.findOne({ user: userId });
      if (!landlord) {
        return res.status(404).json({
          success: false,
          message: 'Landlord profile not found'
        });
      }
      recipientId = landlord._id;
      recipientModel = 'Landlord';
    } else if (userRole === 'investor') {
      const investor = await Investor.findOne({ user: userId });
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor profile not found'
        });
      }
      recipientId = investor._id;
      recipientModel = 'Investor';
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

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the recipient ID based on role
    let recipientId;
    if (userRole === 'student') {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }
      recipientId = student._id;
    } else if (userRole === 'landlord') {
      const landlord = await Landlord.findOne({ user: userId });
      if (!landlord) {
        return res.status(404).json({
          success: false,
          message: 'Landlord profile not found'
        });
      }
      recipientId = landlord._id;
    } else if (userRole === 'investor') {
      const investor = await Investor.findOne({ user: userId });
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor profile not found'
        });
      }
      recipientId = investor._id;
    }

    // Find and verify ownership before deleting
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Ensure the notification belongs to the requesting user
    if (notification.recipient.toString() !== recipientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Get notification preferences
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/userModel');
    
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      preferences: user.notificationPreferences || {}
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
};

// Update notification preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;
    const User = require('../models/userModel');

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences data'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  getPreferences,
  updatePreferences
};
