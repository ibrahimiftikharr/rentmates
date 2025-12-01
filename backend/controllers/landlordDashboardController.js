const Property = require('../models/propertyModel');
const Rental = require('../models/rentalModel');
const JoinRequest = require('../models/joinRequestModel');
const Transaction = require('../models/transactionModel');
const Notification = require('../models/notificationModel');
const Landlord = require('../models/landlordModel');

/**
 * Get landlord dashboard metrics
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get landlord document
    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    // Get total properties count
    const totalProperties = await Property.countDocuments({ 
      landlord: landlord._id,
      status: { $ne: 'deleted' }
    });

    // Get active tenants count (rentals with status 'active' or 'registered')
    const activeTenants = await Rental.countDocuments({
      landlord: landlord._id,
      status: { $in: ['registered', 'active'] }
    });

    // Get pending join requests count
    const pendingRequests = await JoinRequest.countDocuments({
      landlord: landlord._id,
      status: 'pending'
    });

    // Get total earnings (sum of all rent payments received)
    const earningsData = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'rent_received',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' }
        }
      }
    ]);

    const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;

    // Calculate this month's stats for comparison
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    // This month's requests
    const thisMonthRequests = await JoinRequest.countDocuments({
      landlord: landlord._id,
      createdAt: { $gte: startOfMonth }
    });

    // Last month's requests for comparison
    const lastMonthRequests = await JoinRequest.countDocuments({
      landlord: landlord._id,
      createdAt: { 
        $gte: startOfLastMonth,
        $lt: startOfMonth
      }
    });

    // This month's earnings
    const thisMonthEarnings = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'rent_received',
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Last month's earnings for comparison
    const lastMonthEarnings = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'rent_received',
          status: 'completed',
          createdAt: { 
            $gte: startOfLastMonth,
            $lt: startOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const thisMonthEarningsValue = thisMonthEarnings.length > 0 ? thisMonthEarnings[0].total : 0;
    const lastMonthEarningsValue = lastMonthEarnings.length > 0 ? lastMonthEarnings[0].total : 0;

    // Calculate percentage changes
    const requestsChange = lastMonthRequests > 0 
      ? ((thisMonthRequests - lastMonthRequests) / lastMonthRequests * 100).toFixed(0)
      : thisMonthRequests > 0 ? 100 : 0;

    const earningsChange = lastMonthEarningsValue > 0
      ? ((thisMonthEarningsValue - lastMonthEarningsValue) / lastMonthEarningsValue * 100).toFixed(0)
      : thisMonthEarningsValue > 0 ? 100 : 0;

    // Total deposits held (default to 0 as per requirements)
    const totalDepositsHeld = 0;

    res.json({
      success: true,
      metrics: {
        totalProperties,
        activeTenants,
        pendingRequests,
        totalEarnings,
        totalDepositsHeld,
        thisMonthRequests,
        requestsChange: `${requestsChange >= 0 ? '+' : ''}${requestsChange}%`,
        earningsChange: `${earningsChange >= 0 ? '+' : ''}${earningsChange}%`,
        isRequestsPositive: requestsChange >= 0,
        isEarningsPositive: earningsChange >= 0
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};

/**
 * Get upcoming rental payments for landlord
 */
exports.getUpcomingPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get landlord document
    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    // Find all active rentals for this landlord
    const rentals = await Rental.find({
      landlord: landlord._id,
      status: { $in: ['registered', 'active'] }
    })
    .populate('student', 'name')
    .populate('property', 'title')
    .sort({ 'currentRentCycle.dueDate': 1 })
    .limit(10);

    const upcomingPayments = rentals.map(rental => {
      const cycleInfo = rental.getCurrentRentCycle();
      
      return {
        rentalId: rental._id,
        property: rental.propertyInfo.title,
        tenant: rental.studentInfo.name,
        amount: rental.monthlyRentAmount,
        dueDate: cycleInfo.dueDate,
        isPaid: cycleInfo.isPaid,
        autoPaymentEnabled: rental.autoPaymentEnabled || false,
        forMonth: cycleInfo.forMonth,
        forYear: cycleInfo.forYear
      };
    });

    res.json({
      success: true,
      payments: upcomingPayments
    });
  } catch (error) {
    console.error('Get upcoming payments error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming payments' });
  }
};

/**
 * Get recent notifications for landlord (for dashboard display)
 */
exports.getRecentNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get landlord document
    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    // Get latest 3 notifications
    const notifications = await Notification.find({ 
      recipient: landlord._id,
      recipientModel: 'Landlord'
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('relatedId');

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: landlord._id,
      recipientModel: 'Landlord',
      read: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get recent notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
