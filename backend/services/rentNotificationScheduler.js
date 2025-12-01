const cron = require('node-cron');
const Rental = require('../models/rentalModel');
const User = require('../models/userModel');
const { sendEmail } = require('./emailService');

/**
 * Check for upcoming rent payments and send notifications
 * Runs every day at 9:00 AM
 */
const checkUpcomingRentPayments = async (io) => {
  try {
    console.log('🔍 Checking for upcoming rent payments...');

    // Find all active rentals
    const rentals = await Rental.find({ 
      status: { $in: ['registered', 'active'] }
    })
    .populate('student', 'name email')
    .populate('landlord', 'name email')
    .populate('property', 'title address');

    let notificationCount = 0;

    for (const rental of rentals) {
      // Check if rent is due within 3 days
      if (rental.isRentDueWithinDays(3)) {
        const nextDueDate = rental.getNextRentDueDate();
        const daysUntilDue = Math.ceil((nextDueDate - new Date()) / (1000 * 60 * 60 * 24));

        console.log(`📧 Sending rent reminder to ${rental.student.email} - Due in ${daysUntilDue} days`);

        // Send email notification
        try {
          await sendEmail(
            rental.student.email,
            'Upcoming Rent Payment Reminder',
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #8C57FF;">Rent Payment Reminder</h2>
                <p>Dear ${rental.student.name},</p>
                <p>This is a friendly reminder that your rent payment is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">Payment Details:</h3>
                  <p style="margin: 10px 0;"><strong>Property:</strong> ${rental.propertyInfo.title}</p>
                  <p style="margin: 10px 0;"><strong>Address:</strong> ${rental.propertyInfo.address}</p>
                  <p style="margin: 10px 0;"><strong>Amount Due:</strong> $${rental.monthlyRentAmount} USDT</p>
                  <p style="margin: 10px 0;"><strong>Due Date:</strong> ${nextDueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p style="margin: 10px 0;"><strong>Landlord:</strong> ${rental.landlord.name}</p>
                </div>

                <p>Please make sure you have sufficient balance in your wallet to complete the payment on time.</p>
                <p>You can pay your rent directly from your <strong>Wallet page</strong> in the student dashboard.</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #666; font-size: 12px;">This is an automated reminder from RentMates. Please do not reply to this email.</p>
                </div>
              </div>
            `
          );
        } catch (emailError) {
          console.error('Error sending rent reminder email:', emailError);
        }

        // Send in-app notification via Socket.IO
        if (io) {
          io.to(`student_${rental.student._id}`).emit('new_notification', {
            type: 'rent_reminder',
            title: 'Rent Payment Due Soon',
            message: `Your rent of $${rental.monthlyRentAmount} USDT is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
            rentalId: rental._id,
            dueDate: nextDueDate,
            amount: rental.monthlyRentAmount
          });
        }

        notificationCount++;
      }
    }

    console.log(`✅ Sent ${notificationCount} rent reminder${notificationCount !== 1 ? 's' : ''}`);
  } catch (error) {
    console.error('Error in rent payment notification scheduler:', error);
  }
};

/**
 * Initialize the rent notification scheduler
 * Runs every day at 9:00 AM
 */
const initRentNotificationScheduler = (io) => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkUpcomingRentPayments(io);
  });

  console.log('✅ Rent notification scheduler initialized (runs daily at 9:00 AM)');

  // Optional: Run immediately on startup for testing (comment out in production)
  // checkUpcomingRentPayments(io);
};

module.exports = {
  initRentNotificationScheduler,
  checkUpcomingRentPayments
};
