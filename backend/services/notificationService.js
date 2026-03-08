const Notification = require('../models/notificationModel');

/**
 * Map notification types to preference categories
 */
const notificationTypeToPreference = {
  // Loan notifications
  'loan_application_submitted': 'loanActivity',
  'loan_disbursed': 'loanActivity',
  'loan_queue_approved': 'loanActivity',
  'loan_queue_expired': 'loanActivity',
  'loan_completed': 'loanActivity',
  
  // Repayment notifications
  'loan_payment_reminder': 'repayments',
  'loan_payment_overdue': 'repayments',
  'loan_repayment_received': 'repayments',
  
  // Default notifications
  'loan_defaulted': 'defaults',
  'loan_default_warning': 'defaults',
  'collateral_liquidated': 'defaults',
  'pool_collateral_liquidated': 'defaults',
  'loan_default_in_pool': 'defaults',
  
  // Profit notifications
  'investor_profit_earned': 'profits',
  'loan_issued_from_pool': 'loanActivity',
  
  // Property notifications
  'property_available': 'propertyUpdates',
  'property_approved': 'propertyUpdates',
  'property_rejected': 'propertyUpdates',
  'visit_confirmed': 'visitRequests',
  'visit_rejected': 'visitRequests',
  'visit_rescheduled': 'visitRequests',
  'join_request_received': 'joinRequests',
  'join_request_accepted': 'joinRequests',
  'join_request_rejected': 'joinRequests',
  
  // Pool notifications
  'pool_available': 'poolUpdates',
  'pool_updated': 'poolUpdates',
  
  // System alerts
  'system_alert': 'systemAlerts',
  'account_verified': 'systemAlerts',
  'collateral_available_withdrawal': 'systemAlerts'
};

/**
 * Check if user has enabled this notification type
 * @param {String} recipientId - Recipient ID (Student/Landlord/Investor _id)
 * @param {String} recipientModel - 'Student', 'Landlord', or 'Investor'
 * @param {String} notificationType - Notification type
 * @returns {Promise<Boolean>} Whether notification should be sent
 */
const checkNotificationPreference = async (recipientId, recipientModel, notificationType) => {
  try {
    const User = require('../models/userModel');
    const Student = require('../models/studentModel');
    const Landlord = require('../models/landlordModel');
    const Investor = require('../models/investorModel');
    
    console.log(`      [PREF CHECK] Checking preferences for ${recipientModel} ${recipientId}`);
    
    // Get user ID from recipient profile
    let userId;
    if (recipientModel === 'Student') {
      const student = await Student.findById(recipientId).select('user');
      userId = student?.user;
    } else if (recipientModel === 'Landlord') {
      const landlord = await Landlord.findById(recipientId).select('user');
      userId = landlord?.user;
    } else if (recipientModel === 'Investor') {
      const investor = await Investor.findById(recipientId).select('user');
      userId = investor?.user;
      console.log(`      [PREF CHECK] Found User ID: ${userId}`);
    }
    
    if (!userId) {
      console.warn(`      [PREF CHECK] ⚠️  User not found for recipient: ${recipientId} - defaulting to SEND`);
      return true; // Default to sending if user not found
    }
    
    // Get user preferences
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user || !user.notificationPreferences) {
      console.log(`      [PREF CHECK] No preferences set - defaulting to SEND`);
      return true; // Default to sending if preferences not set
    }
    
    // Get preference category for this notification type
    const preferenceKey = notificationTypeToPreference[notificationType];
    if (!preferenceKey) {
      console.log(`      [PREF CHECK] Type '${notificationType}' not mapped - defaulting to SEND`);
      return true; // Default to sending if type not mapped
    }
    
    // Check if preference is enabled
    const isEnabled = user.notificationPreferences[preferenceKey];
    console.log(`      [PREF CHECK] Preference '${preferenceKey}' = ${isEnabled}`);
    const result = isEnabled !== false;
    console.log(`      [PREF CHECK] Decision: ${result ? 'SEND' : 'SKIP'}`);
    return result; // Default to true if not explicitly false
  } catch (error) {
    console.error(`      [PREF CHECK] ❌ Error checking preference:`, error.message);
    return true; // Default to sending on error
  }
};

/**
 * Create and send notification to a user
 * @param {Object} notificationData 
 * @param {String} notificationData.recipient - Recipient ID (Student/Landlord/Investor _id)
 * @param {String} notificationData.recipientModel - 'Student', 'Landlord', or 'Investor'
 * @param {String} notificationData.type - Notification type (from enum)
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {String} [notificationData.relatedId] - Related document ID (optional)
 * @param {String} [notificationData.relatedModel] - Related model name (optional)
 * @param {Object} [notificationData.metadata] - Additional data (optional)
 */
const createNotification = async (notificationData) => {
  try {
    const {
      recipient,
      recipientModel,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      metadata
    } = notificationData;

    console.log('\n📨 [NOTIFICATION SERVICE] Creating notification:');
    console.log(`   Type: ${type}`);
    console.log(`   Recipient Model: ${recipientModel}`);
    console.log(`   Recipient ID: ${recipient}`);
    console.log(`   Title: ${title}`);
    console.log(`   Message: ${message}`);

    // Validate required fields
    if (!recipient || !recipientModel || !type || !title || !message) {
      console.error('❌ [NOTIFICATION SERVICE] Missing required fields:', {
        hasRecipient: !!recipient,
        hasRecipientModel: !!recipientModel,
        hasType: !!type,
        hasTitle: !!title,
        hasMessage: !!message
      });
      return null;
    }

    // Check user preferences before creating notification
    console.log(`   🔍 Checking user preferences for ${type}...`);
    const shouldSend = await checkNotificationPreference(recipient, recipientModel, type);
    if (!shouldSend) {
      console.log(`   ⏭️  Notification SKIPPED (user preference disabled)`);
      console.log(`   Type: ${type} | Recipient: ${recipientModel} ${recipient}`);
      return null;
    }
    console.log(`   ✅ Preference check passed`);

    // Create notification in database
    const notification = await Notification.create({
      recipient,
      recipientModel,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      metadata
    });

    console.log(`   ✅ [NOTIFICATION SERVICE] Notification saved to database`);
    console.log(`   Notification ID: ${notification._id}`);
    console.log(`   Created at: ${notification.createdAt}`);
    console.log(`   Read status: ${notification.read}`);

    // Note: Real-time socket.io events are handled directly in controllers
    // No need for socket emission here as notifications are pulled by frontend

    return notification;
  } catch (error) {
    console.error('\n❌ [NOTIFICATION SERVICE] Error creating notification:');
    console.error(`   Type: ${notificationData?.type}`);
    console.error(`   Recipient: ${notificationData?.recipientModel} ${notificationData?.recipient}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    return null;
  }
};

/**
 * Create multiple notifications at once
 */
const createBulkNotifications = async (notificationsArray) => {
  try {
    const results = await Promise.allSettled(
      notificationsArray.map(data => createNotification(data))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ Created ${successful}/${notificationsArray.length} notifications`);

    return results;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
  }
};

/**
 * Helper function to get user/recipient details by role
 */
const getRecipientByRole = async (userId, role) => {
  try {
    let recipientDoc;
    let recipientModel;

    if (role === 'student') {
      const Student = require('../models/studentModel');
      recipientDoc = await Student.findOne({ user: userId });
      recipientModel = 'Student';
    } else if (role === 'landlord') {
      const Landlord = require('../models/landlordModel');
      recipientDoc = await Landlord.findOne({ user: userId });
      recipientModel = 'Landlord';
    } else if (role === 'investor') {
      const Investor = require('../models/investorModel');
      recipientDoc = await Investor.findOne({ user: userId });
      recipientModel = 'Investor';
    }

    if (!recipientDoc) {
      return null;
    }

    return {
      recipientId: recipientDoc._id,
      recipientModel
    };
  } catch (error) {
    console.error('Error getting recipient by role:', error);
    return null;
  }
};

/**
 * LOAN-SPECIFIC NOTIFICATION HELPERS
 */

// Student loan notifications
const notifyLoanApplicationSubmitted = async (studentId, loanAmount, poolName) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_application_submitted',
    title: 'Loan Application Submitted',
    message: `Your loan application for $${loanAmount} from ${poolName} has been submitted successfully.`,
    relatedModel: 'Loan'
  });
};

const notifyLoanDisbursed = async (studentId, loanId, loanAmount) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_disbursed',
    title: 'Loan Disbursed',
    message: `Your loan of $${loanAmount} has been disbursed to your wallet.`,
    relatedId: loanId,
    relatedModel: 'Loan'
  });
};

const notifyLoanPaymentReminder = async (studentId, loanId, amount, dueDate) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_payment_reminder',
    title: 'Loan Payment Reminder',
    message: `Your loan payment of $${amount} is due on ${dueDate}. Please ensure sufficient funds.`,
    relatedId: loanId,
    relatedModel: 'Loan',
    metadata: { amount, dueDate }
  });
};

const notifyLoanPaymentOverdue = async (studentId, loanId, amount, daysOverdue) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_payment_overdue',
    title: 'Loan Payment Overdue',
    message: `Your loan payment of $${amount} is ${daysOverdue} days overdue. Please make payment immediately to avoid penalties.`,
    relatedId: loanId,
    relatedModel: 'Loan',
    metadata: { amount, daysOverdue }
  });
};

const notifyLoanDefaultWarning = async (studentId, loanId, gracePeriodEnd) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_default_warning',
    title: 'Loan Default Warning',
    message: `⚠️ Your loan is at risk of default. Grace period ends on ${gracePeriodEnd}. Your collateral will be liquidated if payment is not made.`,
    relatedId: loanId,
    relatedModel: 'Loan',
    metadata: { gracePeriodEnd }
  });
};

const notifyLoanDefaulted = async (studentId, loanId, amount) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_defaulted',
    title: 'Loan Defaulted',
    message: `Your loan has been marked as defaulted. Outstanding amount: $${amount}.`,
    relatedId: loanId,
    relatedModel: 'Loan'
  });
};

const notifyCollateralLiquidated = async (studentId, loanId, collateralValue) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'collateral_liquidated',
    title: 'Collateral Liquidated',
    message: `Your PAXG collateral worth $${collateralValue} has been liquidated to cover the defaulted loan.`,
    relatedId: loanId,
    relatedModel: 'Loan',
    metadata: { collateralValue }
  });
};

const notifyLoanCompleted = async (studentId, loanId) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_completed',
    title: 'Loan Completed',
    message: '🎉 Congratulations! Your loan has been fully repaid. Your collateral is now available for withdrawal.',
    relatedId: loanId,
    relatedModel: 'Loan'
  });
};

const notifyLoanPaymentSuccess = async (studentId, loanId, amount, remainingBalance) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_payment_success',
    title: 'Payment Successful',
    message: `Payment of $${amount} received. Remaining balance: $${remainingBalance}.`,
    relatedId: loanId,
    relatedModel: 'Loan',
    metadata: { amount, remainingBalance }
  });
};

const notifyLoanQueueApproved = async (studentId, queueId, loanAmount) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_queue_approved',
    title: 'Queued Loan Approved',
    message: `🎉 Your queued loan request for $${loanAmount} has been approved! Funds are now available.`,
    relatedId: queueId,
    relatedModel: 'QueuedLoanRequest',
    metadata: { loanAmount }
  });
};

const notifyLoanQueueExpired = async (studentId, queueId) => {
  return createNotification({
    recipient: studentId,
    recipientModel: 'Student',
    type: 'loan_queue_expired',
    title: 'Queued Loan Expired',
    message: 'Your queued loan request has expired. You can submit a new application.',
    relatedId: queueId,
    relatedModel: 'QueuedLoanRequest'
  });
};

// Investor loan notifications
const notifyLoanIssuedFromPool = async (investorId, poolId, loanAmount, studentName) => {
  return createNotification({
    recipient: investorId,
    recipientModel: 'Investor',
    type: 'loan_issued_from_pool',
    title: 'Loan Issued from Your Pool',
    message: `A loan of $${loanAmount} has been issued to ${studentName} from your investment pool.`,
    relatedId: poolId,
    relatedModel: 'InvestmentPool',
    metadata: { loanAmount, studentName }
  });
};

const notifyLoanRepaymentReceived = async (investorId, poolId, repaymentAmount, loanId) => {
  return createNotification({
    recipient: investorId,
    recipientModel: 'Investor',
    type: 'loan_repayment_received',
    title: 'Loan Repayment Received',
    message: `A repayment of $${repaymentAmount} has been received in your investment pool.`,
    relatedId: poolId,
    relatedModel: 'InvestmentPool',
    metadata: { repaymentAmount, loanId }
  });
};

const notifyInvestorProfitEarned = async (investorId, poolId, profitAmount, totalEarnings) => {
  return createNotification({
    recipient: investorId,
    recipientModel: 'Investor',
    type: 'investor_profit_earned',
    title: 'Profit Earned',
    message: `💰 You've earned $${profitAmount} in interest! Total earnings: $${totalEarnings}.`,
    relatedId: poolId,
    relatedModel: 'InvestmentPool',
    metadata: { profitAmount, totalEarnings }
  });
};

const notifyPoolCollateralLiquidated = async (investorId, poolId, collateralValue) => {
  return createNotification({
    recipient: investorId,
    recipientModel: 'Investor',
    type: 'pool_collateral_liquidated',
    title: 'Collateral Liquidated',
    message: `Collateral worth $${collateralValue} has been liquidated and added to your pool due to loan default.`,
    relatedId: poolId,
    relatedModel: 'InvestmentPool',
    metadata: { collateralValue }
  });
};

const notifyLoanDefaultInPool = async (investorId, poolId, loanAmount, defaultAmount) => {
  return createNotification({
    recipient: investorId,
    recipientModel: 'Investor',
    type: 'loan_default_in_pool',
    title: 'Loan Default Alert',
    message: `⚠️ A loan of $${loanAmount} in your pool has defaulted. Collateral liquidation in progress.`,
    relatedId: poolId,
    relatedModel: 'InvestmentPool',
    metadata: { loanAmount, defaultAmount }
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getRecipientByRole,
  // Student notifications
  notifyLoanApplicationSubmitted,
  notifyLoanDisbursed,
  notifyLoanPaymentReminder,
  notifyLoanPaymentOverdue,
  notifyLoanDefaultWarning,
  notifyLoanDefaulted,
  notifyCollateralLiquidated,
  notifyLoanCompleted,
  notifyLoanPaymentSuccess,
  notifyLoanQueueApproved,
  notifyLoanQueueExpired,
  // Investor notifications
  notifyLoanIssuedFromPool,
  notifyLoanRepaymentReceived,
  notifyInvestorProfitEarned,
  notifyPoolCollateralLiquidated,
  notifyLoanDefaultInPool
};
