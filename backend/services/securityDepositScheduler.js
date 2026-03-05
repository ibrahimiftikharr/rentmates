const cron = require('node-cron');
const Rental = require('../models/rentalModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const Notification = require('../models/notificationModel');
const emailService = require('./emailService');

/**
 * Check for security deposits that need reminders or automatic termination
 * Runs every hour
 */
const checkSecurityDepositDeadlines = async () => {
  try {
    console.log('=== Running Security Deposit Deadline Check ===');
    const now = new Date();

    // Find all rentals with pending security deposits
    const rentals = await Rental.find({
      status: 'registered',
      securityDepositStatus: 'pending'
    })
      .populate('student')
      .populate('landlord');

    console.log(`Found ${rentals.length} rentals with pending security deposits`);

    for (const rental of rentals) {
      const dueDate = new Date(rental.securityDepositDueDate);
      const timeDiff = dueDate - now;
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      console.log(`Rental ${rental._id}: ${daysRemaining} days remaining`);

      // Check if payment deadline has passed (auto-terminate)
      if (daysRemaining < 0) {
        await terminateRentalForNonPayment(rental);
        continue;
      }

      // Send reminders based on days remaining
      if (daysRemaining === 4) {
        // 3-day reminder (4 days remaining = send on day 3)
        await sendSecurityDepositReminder(rental, '3-day', daysRemaining - 1);
      } else if (daysRemaining >= 1 && daysRemaining <= 3) {
        // Daily reminders (Day 4-7)
        await sendSecurityDepositReminder(rental, 'daily', daysRemaining);
      }
    }

    console.log('=== Security Deposit Check Complete ===');
  } catch (error) {
    console.error('Error checking security deposit deadlines:', error);
  }
};

/**
 * Send security deposit reminder notification and email
 */
const sendSecurityDepositReminder = async (rental, reminderType, daysRemaining) => {
  try {
    // Check if we already sent this reminder today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alreadySent = rental.securityDepositReminders.some(reminder => {
      const sentDate = new Date(reminder.sentAt);
      sentDate.setHours(0, 0, 0, 0);
      return sentDate.getTime() === today.getTime() && reminder.daysRemaining === daysRemaining;
    });

    if (alreadySent) {
      console.log(`Reminder already sent today for rental ${rental._id}`);
      return;
    }

    const studentUser = await User.findById(rental.student);
    const studentDoc = await Student.findOne({ user: rental.student });
    const landlordUser = await User.findById(rental.landlord);

    if (!studentUser || !studentDoc) {
      console.error(`Student not found for rental ${rental._id}`);
      return;
    }

    // Create notification for student
    const notificationTitle = daysRemaining === 1 
      ? '⚠️ URGENT: Security Deposit Due Tomorrow!'
      : `Security Deposit Payment Reminder - ${daysRemaining} Days Left`;
    
    const notificationMessage = daysRemaining === 1
      ? `Your security deposit of $${rental.securityDepositAmount} for ${rental.propertyInfo.title} is due tomorrow (${rental.securityDepositDueDate.toLocaleDateString()}). If not paid, your contract will be automatically terminated.`
      : `Reminder: Your security deposit of $${rental.securityDepositAmount} for ${rental.propertyInfo.title} is due in ${daysRemaining} days (${rental.securityDepositDueDate.toLocaleDateString()}). Please pay before the deadline to avoid automatic contract termination.`;

    const notification = new Notification({
      recipient: studentDoc._id,
      recipientModel: 'Student',
      type: 'security_deposit_reminder',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await notification.save();

    // Send email to student
    const emailSubject = daysRemaining === 1
      ? 'URGENT: Security Deposit Due Tomorrow - RentMates'
      : `Security Deposit Reminder - ${daysRemaining} Days Left`;

    const emailText = `Dear ${studentUser.name},

This is a reminder that your security deposit for "${rental.propertyInfo.title}" is due.

Details:
- Amount: $${rental.securityDepositAmount}
- Due Date: ${rental.securityDepositDueDate.toLocaleDateString()}
- Days Remaining: ${daysRemaining}

⚠️ IMPORTANT: If the security deposit is not paid by the deadline, your rental contract will be automatically terminated.

Please log in to your RentMates account to complete the payment.

Best regards,
The RentMates Team`;

    await emailService.sendEmail({
      to: studentUser.email,
      subject: emailSubject,
      text: emailText
    });

    // Track that we sent this reminder
    rental.securityDepositReminders.push({
      sentAt: new Date(),
      reminderType: reminderType,
      daysRemaining: daysRemaining
    });
    await rental.save();

    console.log(`✓ Sent ${reminderType} reminder for rental ${rental._id} (${daysRemaining} days remaining)`);
  } catch (error) {
    console.error(`Error sending reminder for rental ${rental._id}:`, error);
  }
};

/**
 * Terminate rental contract for non-payment of security deposit
 */
const terminateRentalForNonPayment = async (rental) => {
  try {
    console.log(`Terminating rental ${rental._id} for non-payment of security deposit`);

    const studentUser = await User.findById(rental.student);
    const studentDoc = await Student.findOne({ user: rental.student });
    const landlordUser = await User.findById(rental.landlord);
    const landlordDoc = await Landlord.findOne({ user: rental.landlord });

    // Update rental status
    rental.status = 'terminated';
    rental.terminationReason = 'Security deposit not paid within 7 days';
    rental.terminatedAt = new Date();
    rental.securityDepositStatus = 'overdue';
    rental.actionHistory.push({
      action: 'Contract Terminated',
      date: new Date(),
      notes: 'Automatically terminated due to non-payment of security deposit'
    });
    await rental.save();

    // Create notification for student
    const studentNotification = new Notification({
      recipient: studentDoc._id,
      recipientModel: 'Student',
      type: 'contract_terminated',
      title: 'Rental Contract Terminated',
      message: `Your rental contract for ${rental.propertyInfo.title} has been automatically terminated because the security deposit of $${rental.securityDepositAmount} was not paid within 7 days. The contract is no longer active.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await studentNotification.save();

    // Create notification for landlord
    const landlordNotification = new Notification({
      recipient: landlordDoc._id,
      recipientModel: 'Landlord',
      type: 'contract_terminated',
      title: 'Rental Contract Terminated',
      message: `The rental contract for ${rental.propertyInfo.title} with ${rental.studentInfo.name} has been automatically terminated due to non-payment of security deposit within 7 days.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await landlordNotification.save();

    // Send email to student
    await emailService.sendEmail({
      to: studentUser.email,
      subject: 'Rental Contract Terminated - RentMates',
      text: `Dear ${studentUser.name},

Your rental contract for "${rental.propertyInfo.title}" has been automatically terminated.

Reason: Security deposit of $${rental.securityDepositAmount} was not paid within the required 7-day period.

The contract is no longer active, and all rental-related obligations have been removed from your account.

If you have any questions, please contact support.

Best regards,
The RentMates Team`
    });

    // Send email to landlord
    await emailService.sendEmail({
      to: landlordUser.email,
      subject: 'Rental Contract Terminated - RentMates',
      text: `Dear ${landlordUser.name},

The rental contract for "${rental.propertyInfo.title}" with ${rental.studentInfo.name} has been automatically terminated.

Reason: The student did not pay the security deposit of $${rental.securityDepositAmount} within the required 7-day period.

The property is now available for other rental requests.

Best regards,
The RentMates Team`
    });

    console.log(`✓ Successfully terminated rental ${rental._id}`);
  } catch (error) {
    console.error(`Error terminating rental ${rental._id}:`, error);
  }
};

/**
 * Initialize all scheduled jobs
 */
const initializeScheduledJobs = () => {
  console.log('=== Initializing Security Deposit Scheduled Jobs ===');

  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('Running hourly security deposit check...');
    checkSecurityDepositDeadlines();
  });

  // Also run immediately on startup (after a 10 second delay)
  setTimeout(() => {
    console.log('Running initial security deposit check...');
    checkSecurityDepositDeadlines();
  }, 10000);

  console.log('✓ Security deposit scheduled jobs initialized');
  console.log('- Hourly check: Every hour at minute 0');
  console.log('- Initial check: 10 seconds after startup');
};

module.exports = {
  initializeScheduledJobs,
  checkSecurityDepositDeadlines,
  sendSecurityDepositReminder,
  terminateRentalForNonPayment
};
