const cron = require('node-cron');
const Rental = require('../models/rentalModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const Transaction = require('../models/transactionModel');
const { sendEmail } = require('./emailService');

/**
 * Process auto-payment for a rental
 * Called 1 day before due date
 */
async function processAutoPayment(rental, io) {
  try {
    console.log(`\n=== Processing Auto-Payment for Rental ${rental._id} ===`);
    
    const cycleInfo = rental.getCurrentRentCycle();
    
    // Check if already paid
    if (cycleInfo.isPaid) {
      console.log('✓ Rent already paid for current cycle, skipping auto-payment');
      return { success: true, skipped: true, reason: 'already_paid' };
    }

    const rentAmount = rental.monthlyRentAmount;
    
    // Get student and landlord with user info
    const student = await Student.findById(rental.student).populate('user', 'name email offChainBalance');
    const landlord = await Landlord.findById(rental.landlord).populate('user', 'name email offChainBalance');
    
    if (!student || !landlord) {
      console.error('✗ Student or landlord not found');
      return { success: false, reason: 'user_not_found' };
    }

    const studentUser = student.user;
    const landlordUser = landlord.user;

    // Check if student has sufficient balance
    if (studentUser.offChainBalance < rentAmount) {
      console.log(`✗ Insufficient balance: ${studentUser.offChainBalance} < ${rentAmount}`);
      
      // Update rental auto-payment status
      rental.autoPaymentLastAttempt = new Date();
      rental.autoPaymentLastStatus = 'insufficient_funds';
      await rental.save();
      
      // Send notifications
      await sendInsufficientBalanceNotifications(rental, student, studentUser, rentAmount, io);
      
      return { 
        success: false, 
        reason: 'insufficient_funds',
        balance: studentUser.offChainBalance,
        required: rentAmount
      };
    }

    // Process payment
    studentUser.offChainBalance -= rentAmount;
    landlordUser.offChainBalance += rentAmount;

    await studentUser.save();
    await landlordUser.save();

    // Create transaction records
    const monthName = new Date(cycleInfo.forYear, cycleInfo.forMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const studentTransaction = await Transaction.create({
      user: studentUser._id,
      type: 'rent_payment',
      amount: rentAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: landlordUser._id,
      balanceAfter: studentUser.offChainBalance,
      description: `Auto-payment: Rent for ${rental.propertyInfo.title} - ${monthName}`
    });

    await Transaction.create({
      user: landlordUser._id,
      type: 'rent_received',
      amount: rentAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: studentUser._id,
      balanceAfter: landlordUser.offChainBalance,
      description: `Rent received from ${studentUser.name} for ${rental.propertyInfo.title} - ${monthName}`
    });

    // Add to rental payment history
    rental.payments.push({
      amount: rentAmount,
      type: 'rent',
      paidAt: new Date(),
      status: 'paid',
      forMonth: cycleInfo.forMonth,
      forYear: cycleInfo.forYear
    });

    // Add to action history
    rental.actionHistory.push({
      action: 'Auto-Payment Processed',
      amount: `$${rentAmount}`,
      date: new Date(),
      notes: `Automatic rent payment for ${monthName}`
    });

    // Mark cycle as paid and move to next
    rental.markCycleAsPaidAndMoveNext();
    
    // Update auto-payment status
    rental.autoPaymentLastAttempt = new Date();
    rental.autoPaymentLastStatus = 'success';
    
    await rental.save();

    console.log(`✓ Auto-payment successful: $${rentAmount} from ${studentUser.email} to ${landlordUser.email}`);

    // Send success notifications
    await sendSuccessNotifications(rental, student, studentUser, landlord, landlordUser, rentAmount, monthName, studentTransaction, io);

    return { 
      success: true, 
      amount: rentAmount,
      studentBalance: studentUser.offChainBalance,
      landlordBalance: landlordUser.offChainBalance
    };
  } catch (error) {
    console.error('Auto-payment processing error:', error);
    
    // Update error status
    rental.autoPaymentLastAttempt = new Date();
    rental.autoPaymentLastStatus = 'error';
    await rental.save();
    
    return { success: false, reason: 'error', error: error.message };
  }
}

/**
 * Send notifications when balance is insufficient
 */
async function sendInsufficientBalanceNotifications(rental, student, studentUser, rentAmount, io) {
  const cycleInfo = rental.getCurrentRentCycle();
  const monthName = new Date(cycleInfo.forYear, cycleInfo.forMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dueDate = new Date(cycleInfo.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Send email
  try {
    await sendEmail(
      studentUser.email,
      'Auto-Payment Failed - Insufficient Balance',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Auto-Payment Failed</h2>
          <p>Dear ${studentUser.name},</p>
          <p>We attempted to automatically process your rent payment but your balance is insufficient.</p>
          
          <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="margin-top: 0; color: #991B1B;">Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Property:</strong> ${rental.propertyInfo.title}</p>
            <p style="margin: 10px 0;"><strong>Period:</strong> ${monthName}</p>
            <p style="margin: 10px 0;"><strong>Due Date:</strong> ${dueDate}</p>
            <p style="margin: 10px 0;"><strong>Amount Required:</strong> $${rentAmount} USDT</p>
            <p style="margin: 10px 0;"><strong>Your Current Balance:</strong> $${studentUser.offChainBalance} USDT</p>
            <p style="margin: 10px 0;"><strong>Shortfall:</strong> $${(rentAmount - studentUser.offChainBalance).toFixed(2)} USDT</p>
          </div>

          <p><strong>Action Required:</strong></p>
          <p>Please deposit funds to your wallet and pay the rent manually before the due date to avoid late fees.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
          </div>
        </div>
      `
    );
    console.log('✓ Insufficient balance email sent to student');
  } catch (emailError) {
    console.error('Error sending insufficient balance email:', emailError);
  }

  // Send in-app notification via Socket.IO
  if (io) {
    io.to(`student_${studentUser._id}`).emit('new_notification', {
      type: 'auto_payment_failed',
      title: 'Auto-Payment Failed',
      message: `Insufficient balance for rent payment. Required: $${rentAmount} USDT, Available: $${studentUser.offChainBalance} USDT`,
      rentalId: rental._id,
      amount: rentAmount,
      priority: 'high'
    });
    console.log('✓ Insufficient balance in-app notification sent');
  }
}

/**
 * Send success notifications after auto-payment
 */
async function sendSuccessNotifications(rental, student, studentUser, landlord, landlordUser, rentAmount, monthName, studentTransaction, io) {
  // Send email to student
  try {
    await sendEmail(
      studentUser.email,
      'Rent Auto-Payment Successful',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Rent Payment Successful</h2>
          <p>Dear ${studentUser.name},</p>
          <p>Your rent has been automatically paid.</p>
          
          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #065F46;">Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Property:</strong> ${rental.propertyInfo.title}</p>
            <p style="margin: 10px 0;"><strong>Period:</strong> ${monthName}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> $${rentAmount} USDT</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style="margin: 10px 0;"><strong>New Balance:</strong> $${studentUser.offChainBalance} USDT</p>
          </div>

          <p>Thank you for using auto-payment!</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
          </div>
        </div>
      `
    );
  } catch (emailError) {
    console.error('Error sending auto-payment success email to student:', emailError);
  }

  // Send email to landlord
  try {
    await sendEmail(
      landlordUser.email,
      'Rent Payment Received (Auto-Payment)',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8C57FF;">Rent Payment Received</h2>
          <p>Dear ${landlordUser.name},</p>
          <p>You have received an automatic rent payment from your tenant.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Tenant:</strong> ${studentUser.name}</p>
            <p style="margin: 10px 0;"><strong>Property:</strong> ${rental.propertyInfo.title}</p>
            <p style="margin: 10px 0;"><strong>Period:</strong> ${monthName}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> $${rentAmount} USDT</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style="margin: 10px 0;"><strong>New Balance:</strong> $${landlordUser.offChainBalance} USDT</p>
          </div>

          <p>The payment has been credited to your wallet balance.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
          </div>
        </div>
      `
    );
  } catch (emailError) {
    console.error('Error sending auto-payment email to landlord:', emailError);
  }

  // Send in-app notifications via Socket.IO
  if (io) {
    // Notify student
    io.to(`student_${studentUser._id}`).emit('rent_cycle_updated', {
      currentCycle: rental.currentRentCycle,
      canPayNow: false,
      isPaid: false
    });

    io.to(`student_${studentUser._id}`).emit('new_notification', {
      type: 'auto_payment_success',
      title: 'Rent Auto-Payment Successful',
      message: `Rent of $${rentAmount} USDT paid automatically for ${monthName}`,
      rentalId: rental._id,
      amount: rentAmount,
      transactionId: studentTransaction._id
    });

    // Notify landlord
    io.to(`landlord_${landlordUser._id}`).emit('new_notification', {
      type: 'rent_received',
      title: 'Rent Payment Received (Auto-Payment)',
      message: `${studentUser.name} paid rent of $${rentAmount} USDT for ${rental.propertyInfo.title} (${monthName})`,
      rentalId: rental._id,
      amount: rentAmount,
      transactionId: studentTransaction._id
    });
  }
}

/**
 * Check and process all auto-payments for rentals due tomorrow
 */
async function checkAndProcessAutoPayments(io) {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log('\n=== Auto-Payment Scheduler Running ===');
    console.log('Current time:', now.toISOString());
    console.log('Checking for rentals due tomorrow:', tomorrow.toLocaleDateString());

    // Find all active rentals with auto-payment enabled where due date is tomorrow
    const rentals = await Rental.find({
      status: { $in: ['registered', 'active'] },
      autoPaymentEnabled: true,
      'currentRentCycle.dueDate': {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      'currentRentCycle.isPaid': false
    });

    console.log(`Found ${rentals.length} rental(s) with auto-payment enabled due tomorrow`);

    const results = {
      total: rentals.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const rental of rentals) {
      console.log(`\nProcessing rental ${rental._id}...`);
      const result = await processAutoPayment(rental, io);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.successful++;
        }
      } else {
        results.failed++;
        results.errors.push({
          rentalId: rental._id,
          reason: result.reason,
          error: result.error
        });
      }
    }

    console.log('\n=== Auto-Payment Scheduler Summary ===');
    console.log(`Total processed: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.errors.length > 0) {
      console.log('Errors:', JSON.stringify(results.errors, null, 2));
    }

    return results;
  } catch (error) {
    console.error('Auto-payment scheduler error:', error);
    return { error: error.message };
  }
}

/**
 * Initialize auto-payment scheduler
 * Runs daily at 9:00 AM to check for rentals due tomorrow
 */
function initializeAutoPaymentScheduler(io) {
  console.log('🔄 Initializing Auto-Payment Scheduler...');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ Auto-Payment Scheduler triggered at', new Date().toISOString());
    await checkAndProcessAutoPayments(io);
  });

  console.log('✓ Auto-Payment Scheduler initialized (runs daily at 9:00 AM)');
  
  // Optional: Run immediately for testing
  // Uncomment the line below to test immediately on server start
  // setTimeout(() => checkAndProcessAutoPayments(io), 5000);
}

module.exports = {
  initializeAutoPaymentScheduler,
  checkAndProcessAutoPayments,
  processAutoPayment
};
