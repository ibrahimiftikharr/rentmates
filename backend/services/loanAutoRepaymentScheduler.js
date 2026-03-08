const cron = require('node-cron');
const Loan = require('../models/loanModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Transaction = require('../models/transactionModel');
const { sendEmail } = require('./emailService');

/**
 * Process auto-repayment for a loan installment
 * Called 1 day before due date
 */
async function processAutoRepayment(loan, io) {
  try {
    console.log(`\n=== Processing Auto-Repayment for Loan ${loan._id} ===`);
    
    const installmentInfo = loan.getCurrentInstallment();
    
    // Check if current installment is already paid
    if (!installmentInfo || installmentInfo.status === 'paid') {
      console.log('✓ Installment already paid, skipping auto-repayment');
      return { success: true, skipped: true, reason: 'already_paid' };
    }

    const installmentAmount = installmentInfo.amount;
    
    // Get student with user info
    const student = await Student.findById(loan.borrower).populate('user', 'name email offChainBalance');
    
    if (!student || !student.user) {
      console.error('✗ Student or user not found');
      return { success: false, reason: 'user_not_found' };
    }

    const user = student.user;

    // Check if student has sufficient balance
    if (user.offChainBalance < installmentAmount) {
      console.log(`✗ Insufficient balance: ${user.offChainBalance} < ${installmentAmount}`);
      
      // Update loan auto-repayment status
      loan.autoRepaymentLastAttempt = new Date();
      loan.autoRepaymentLastStatus = 'insufficient_funds';
      await loan.save();
      
      // Send notifications
      await sendInsufficientBalanceNotifications(loan, student, user, installmentAmount, installmentInfo, io);
      
      return { 
        success: false, 
        reason: 'insufficient_funds',
        balance: user.offChainBalance,
        required: installmentAmount
      };
    }

    // Process payment
    user.offChainBalance -= installmentAmount;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: 'loan_repayment',
      amount: installmentAmount,
      status: 'completed',
      balanceAfter: user.offChainBalance,
      description: `Auto-payment: Loan installment ${installmentInfo.installmentNumber} for ${loan.poolName}`
    });

    // Add to loan payment history
    loan.payments.push({
      amount: installmentAmount,
      paidAt: new Date(),
      installmentNumber: installmentInfo.installmentNumber,
      balanceAfter: loan.remainingBalance - installmentAmount,
      notes: 'Auto-payment'
    });

    // Mark installment as paid and move to next
    loan.markInstallmentPaidAndMoveNext();
    
    // Update auto-repayment status
    loan.autoRepaymentLastAttempt = new Date();
    loan.autoRepaymentLastStatus = 'success';
    
    await loan.save();

    console.log(`✓ Auto-repayment successful: $${installmentAmount} from ${user.email}`);

    // Send success notifications
    await sendSuccessNotifications(loan, student, user, installmentAmount, installmentInfo, transaction, io);

    return { 
      success: true, 
      amount: installmentAmount,
      balance: user.offChainBalance,
      loanStatus: loan.status
    };
  } catch (error) {
    console.error('Auto-repayment processing error:', error);
    
    // Update error status
    loan.autoRepaymentLastAttempt = new Date();
    loan.autoRepaymentLastStatus = 'error';
    await loan.save();
    
    return { success: false, reason: 'error', error: error.message };
  }
}

/**
 * Send notifications when balance is insufficient
 */
async function sendInsufficientBalanceNotifications(loan, student, user, installmentAmount, installmentInfo, io) {
  const dueDate = new Date(installmentInfo.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Send email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Loan Auto-Repayment Failed - Insufficient Balance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Loan Auto-Repayment Failed</h2>
          <p>Dear ${user.name},</p>
          <p>We attempted to automatically process your loan installment payment but your balance is insufficient.</p>
          
          <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="margin-top: 0; color: #991B1B;">Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Pool:</strong> ${loan.poolName}</p>
            <p style="margin: 10px 0;"><strong>Installment:</strong> ${installmentInfo.installmentNumber} of ${loan.duration}</p>
            <p style="margin: 10px 0;"><strong>Due Date:</strong> ${dueDate}</p>
            <p style="margin: 10px 0;"><strong>Amount Required:</strong> $${installmentAmount.toFixed(2)} USDT</p>
            <p style="margin: 10px 0;"><strong>Your Current Balance:</strong> $${user.offChainBalance.toFixed(2)} USDT</p>
            <p style="margin: 10px 0;"><strong>Shortfall:</strong> $${(installmentAmount - user.offChainBalance).toFixed(2)} USDT</p>
          </div>

          <p><strong>Action Required:</strong></p>
          <p>Please deposit funds to your wallet and pay the installment manually before the due date to avoid defaulting on your loan.</p>

          <div style="background-color: #FEF9C3; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EAB308;">
            <p style="margin: 0; color: #713F12;">⚠️ <strong>Warning:</strong> Missing loan payments may result in penalties and could affect your collateral.</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
          </div>
        </div>
      `
    });
    console.log('✓ Insufficient balance email sent to student');
  } catch (emailError) {
    console.error('Error sending insufficient balance email:', emailError);
  }

  // Send in-app notification via Socket.IO
  if (io) {
    io.to(`student_${user._id}`).emit('new_notification', {
      type: 'loan_auto_payment_failed',
      title: 'Loan Auto-Repayment Failed',
      message: `Insufficient balance for loan installment. Required: $${installmentAmount.toFixed(2)} USDT, Available: $${user.offChainBalance.toFixed(2)} USDT`,
      loanId: loan._id,
      amount: installmentAmount,
      priority: 'high'
    });
    console.log('✓ Insufficient balance in-app notification sent');
  }
}

/**
 * Send success notifications after auto-repayment
 */
async function sendSuccessNotifications(loan, student, user, installmentAmount, installmentInfo, transaction, io) {
  const isFullyRepaid = loan.status === 'completed';
  
  // Send email to student
  try {
    await sendEmail({
      to: user.email,
      subject: 'Loan Auto-Repayment Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Loan Payment Successful</h2>
          <p>Dear ${user.name},</p>
          <p>Your loan installment has been automatically paid.</p>
          
          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #065F46;">Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Pool:</strong> ${loan.poolName}</p>
            <p style="margin: 10px 0;"><strong>Installment:</strong> ${installmentInfo.installmentNumber} of ${loan.duration}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> $${installmentAmount.toFixed(2)} USDT</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style="margin: 10px 0;"><strong>Remaining Balance:</strong> $${loan.remainingBalance.toFixed(2)} USDT</p>
            <p style="margin: 10px 0;"><strong>Payments Completed:</strong> ${loan.paymentsCompleted} of ${loan.duration}</p>
            <p style="margin: 10px 0;"><strong>New Wallet Balance:</strong> $${user.offChainBalance.toFixed(2)} USDT</p>
          </div>

          ${isFullyRepaid ? `
          <div style="background-color: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">🎉 Congratulations! Loan Fully Repaid!</h3>
            <p style="margin: 10px 0;">You have successfully repaid your entire loan.</p>
            <p style="margin: 10px 0;">Your collateral of ${loan.requiredCollateral} PAXG will be released shortly.</p>
          </div>
          ` : ''}

          <p>Thank you for using auto-repayment!</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
          </div>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending auto-repayment success email:', emailError);
  }

  // Send in-app notification via Socket.IO
  if (io) {
    io.to(`student_${user._id}`).emit('loan_repayment_updated', {
      amountRepaid: loan.amountRepaid,
      remainingBalance: loan.remainingBalance,
      paymentsCompleted: loan.paymentsCompleted,
      status: loan.status
    });

    io.to(`student_${user._id}`).emit('new_notification', {
      type: 'loan_auto_payment_success',
      title: 'Loan Auto-Repayment Successful',
      message: `Loan installment ${installmentInfo.installmentNumber} of $${installmentAmount.toFixed(2)} USDT paid automatically`,
      loanId: loan._id,
      amount: installmentAmount,
      transactionId: transaction._id,
      isFullyRepaid
    });
  }
}

/**
 * Check and process all auto-repayments for loans due tomorrow
 */
async function checkAndProcessAutoRepayments(io) {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log('\n=== Loan Auto-Repayment Scheduler Running ===');
    console.log('Current time:', now.toISOString());
    console.log('Checking for loans due tomorrow:', tomorrow.toLocaleDateString());

    // Find all active loans with auto-repayment enabled where installment is due tomorrow
    const loans = await Loan.find({
      status: { $in: ['active', 'repaying'] },
      autoRepaymentEnabled: true,
      'repaymentSchedule': {
        $elemMatch: {
          dueDate: {
            $gte: tomorrow,
            $lt: dayAfterTomorrow
          },
          status: 'pending'
        }
      }
    });

    console.log(`Found ${loans.length} loan(s) with auto-repayment enabled due tomorrow`);

    const results = {
      total: loans.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const loan of loans) {
      console.log(`\nProcessing loan ${loan._id}...`);
      const result = await processAutoRepayment(loan, io);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.successful++;
        }
      } else {
        results.failed++;
        results.errors.push({
          loanId: loan._id,
          reason: result.reason,
          error: result.error
        });
      }
    }

    console.log('\n=== Loan Auto-Repayment Scheduler Summary ===');
    console.log(`Total processed: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.errors.length > 0) {
      console.log('Errors:', JSON.stringify(results.errors, null, 2));
    }

    return results;
  } catch (error) {
    console.error('Loan auto-repayment scheduler error:', error);
    return { error: error.message };
  }
}

/**
 * Initialize loan auto-repayment scheduler
 * Runs daily at 9:00 AM to check for loans due tomorrow
 */
function initializeLoanAutoRepaymentScheduler(io) {
  console.log('🔄 Initializing Loan Auto-Repayment Scheduler...');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ Loan Auto-Repayment Cron Job Triggered');
    await checkAndProcessAutoRepayments(io);
  });

  console.log('✓ Loan Auto-Repayment Scheduler initialized (runs daily at 9:00 AM)');
}

module.exports = {
  initializeLoanAutoRepaymentScheduler,
  checkAndProcessAutoRepayments,
  processAutoRepayment
};
