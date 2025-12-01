const Student = require('../models/studentModel');
  const VisitRequest = require('../models/visitRequestModel');
const JoinRequest = require('../models/joinRequestModel');
const Rental = require('../models/rentalModel');
const Notification = require('../models/notificationModel');

/**
 * Get comprehensive dashboard metrics for student
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching dashboard metrics for user:', userId);
    console.log('User object from JWT:', req.user);

    // Find student document
    let student = await Student.findOne({ user: userId });
    console.log('Student found:', student ? student._id : 'null');
    
    // If student profile doesn't exist, create it
    if (!student) {
      console.log('Student profile not found, creating one for user:', userId);
      student = new Student({
        user: userId,
        reputationScore: 0,
        wishlist: []
      });
      await student.save();
      console.log('Student profile created successfully:', student._id);
    }

    // Run all queries in parallel for better performance
    const [
      wishlistCount,
      visitRequestsCount,
      joinRequestsCount,
      approvedJoinRequestsCount,
      activeContractsCount,
      unreadNotificationsCount
    ] = await Promise.all([
      // Count wishlisted properties (stored in student.wishlist array)
      Promise.resolve(student.wishlist ? student.wishlist.length : 0),
      
      // Count all visit requests
      VisitRequest.countDocuments({ student: student._id }),
      
      // Count all join requests
      JoinRequest.countDocuments({ student: userId }),
      
      // Count approved join requests
      JoinRequest.countDocuments({ 
        student: userId, 
        status: { $in: ['approved', 'waiting_completion'] }
      }),
      
      // Count active rental contracts
      Rental.countDocuments({ 
        student: userId, 
        status: { $in: ['registered', 'active'] }
      }),
      
      // Count unread notifications
      Notification.countDocuments({ 
        recipient: student._id, 
        recipientModel: 'Student',
        read: false 
      })
    ]);

    console.log('Dashboard metrics calculated:', {
      wishlistCount,
      visitRequestsCount,
      joinRequestsCount,
      approvedJoinRequestsCount,
      activeContractsCount,
      unreadNotificationsCount
    });

    res.json({
      success: true,
      metrics: {
        wishlistedProperties: wishlistCount,
        visitRequests: visitRequestsCount,
        joinRequests: joinRequestsCount,
        approvedRentalRequests: approvedJoinRequestsCount,
        activeContracts: activeContractsCount,
        unreadNotifications: unreadNotificationsCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard metrics' 
    });
  }
};

/**
 * Get recent activity for student
 */
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    console.log('Fetching recent activity for user:', userId);

    // Find student document
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student profile not found' 
      });
    }

    const activities = [];

    // Fetch recent join requests
    const recentJoinRequests = await JoinRequest.find({ student: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('property', 'title')
      .lean();

    // Add join request activities
    recentJoinRequests.forEach(req => {
      let action = '';
      let status = 'pending';
      
      switch(req.status) {
        case 'pending':
          action = `Join request submitted for ${req.property?.title || 'property'}`;
          status = 'pending';
          break;
        case 'approved':
          action = `Join request approved for ${req.property?.title || 'property'}`;
          status = 'success';
          break;
        case 'waiting_completion':
          action = `Contract awaiting signature for ${req.property?.title || 'property'}`;
          status = 'pending';
          break;
        case 'completed':
          action = `Contract signed for ${req.property?.title || 'property'}`;
          status = 'success';
          break;
        case 'rejected':
          action = `Join request declined for ${req.property?.title || 'property'}`;
          status = 'failed';
          break;
        default:
          action = `Join request updated for ${req.property?.title || 'property'}`;
      }

      activities.push({
        type: 'join_request',
        action,
        description: `Bid amount: $${req.bidAmount}`,
        timestamp: req.updatedAt || req.createdAt,
        status,
        metadata: {
          requestId: req._id,
          propertyTitle: req.property?.title,
          bidAmount: req.bidAmount
        }
      });
    });

    // Fetch recent visit requests
    const recentVisitRequests = await VisitRequest.find({ student: student._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('property', 'title')
      .lean();

    // Add visit request activities
    recentVisitRequests.forEach(req => {
      let action = '';
      let status = 'pending';

      switch(req.status) {
        case 'pending':
          action = `Visit request submitted for ${req.property?.title || 'property'}`;
          status = 'pending';
          break;
        case 'confirmed':
          action = `Visit confirmed for ${req.property?.title || 'property'}`;
          status = 'success';
          break;
        case 'completed':
          action = `Visit completed for ${req.property?.title || 'property'}`;
          status = 'success';
          break;
        case 'rejected':
          action = `Visit request declined for ${req.property?.title || 'property'}`;
          status = 'failed';
          break;
        case 'rescheduled':
          action = `Visit rescheduled for ${req.property?.title || 'property'}`;
          status = 'pending';
          break;
        default:
          action = `Visit request updated for ${req.property?.title || 'property'}`;
      }

      activities.push({
        type: 'visit_request',
        action,
        description: req.preferredDate ? `Preferred: ${new Date(req.preferredDate).toLocaleDateString()}` : '',
        timestamp: req.updatedAt || req.createdAt,
        status,
        metadata: {
          requestId: req._id,
          propertyTitle: req.property?.title,
          preferredDate: req.preferredDate
        }
      });
    });

    // Fetch recent rental activities
    const recentRentals = await Rental.find({ student: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('property', 'title')
      .lean();

    // Add rental activities
    recentRentals.forEach(rental => {
      activities.push({
        type: 'contract',
        action: `Rental contract signed for ${rental.propertyInfo?.title || 'property'}`,
        description: `Monthly rent: $${rental.monthlyRentAmount}`,
        timestamp: rental.contractSignedDate || rental.createdAt,
        status: 'success',
        metadata: {
          rentalId: rental._id,
          propertyTitle: rental.propertyInfo?.title,
          monthlyRent: rental.monthlyRentAmount
        }
      });

      // Add rent payment activities from actionHistory
      if (rental.actionHistory && rental.actionHistory.length > 0) {
        rental.actionHistory.slice(0, 2).forEach(action => {
          activities.push({
            type: 'rent_payment',
            action: action.action,
            description: action.notes || '',
            timestamp: action.date,
            status: 'success',
            metadata: {
              amount: action.amount,
              gasFee: action.gasFee
            }
          });
        });
      }
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit);

    console.log(`Found ${activities.length} activities, returning ${limitedActivities.length}`);

    res.json({
      success: true,
      activities: limitedActivities,
      total: activities.length
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent activity' 
    });
  }
};

/**
 * Get latest notifications for dashboard (last 3-4)
 */
exports.getLatestNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 3;
    console.log('Fetching latest notifications for user:', userId);

    // Find student document
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student profile not found' 
      });
    }

    // Fetch latest notifications
    const notifications = await Notification.find({ 
      recipient: student._id,
      recipientModel: 'Student'
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ 
      recipient: student._id,
      recipientModel: 'Student',
      read: false 
    });

    console.log(`Found ${notifications.length} latest notifications, ${unreadCount} unread`);

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching latest notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
};

module.exports = exports;
