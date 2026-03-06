const cron = require('node-cron');
const Loan = require('../models/loanModel');
const { 
  checkOverdueStatus, 
  sendPaymentReminder, 
  liquidateCollateral,
  returnCollateral 
} = require('../services/collateralLiquidationService');

/**
 * Track which loans have received reminders on which days
 * Format: { loanId: [1, 2, 3, ...] } - array of day numbers when reminders were sent
 */
const reminderTracker = {};

/**
 * Check all active loans for overdue payments and handle grace period
 * @param {Object} io - Socket.IO instance
 */
async function checkOverduePayments(io) {
  try {
    console.log('\n=== Running Overdue Payment Check ===');
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Find all active/repaying loans
    const activeLoans = await Loan.find({
      status: { $in: ['active', 'repaying'] },
      collateralDeposited: true
    }).populate('pool');
    
    console.log(`Found ${activeLoans.length} active loan(s) to check`);
    
    for (const loan of activeLoans) {
      try {
        // Get current unpaid installment
        const currentInstallment = loan.repaymentSchedule.find(
          inst => inst.status === 'pending' || inst.status === 'overdue'
        );
        
        if (!currentInstallment) {
          // All installments paid - check if loan should be completed
          if (loan.status !== 'completed' && loan.paymentsCompleted === loan.repaymentSchedule.length) {
            loan.status = 'completed';
            await loan.save();
            
            // Mark collateral as available for return
            await returnCollateral(loan, io);
            console.log(`✅ Loan ${loan._id} marked as completed and collateral available for withdrawal`);
          }
          continue;
        }
        
        // Check overdue status
        const { isOverdue, daysOverdue } = checkOverdueStatus(currentInstallment);
        
        if (!isOverdue) {
          continue; // Payment not overdue yet
        }
        
        // Update installment status
        if (currentInstallment.status !== 'overdue') {
          currentInstallment.status = 'overdue';
          await loan.save();
        }
        
        console.log(`⚠️ Loan ${loan._id} - Installment #${currentInstallment.installmentNumber} is ${daysOverdue} day(s) overdue`);
        
        // Check if we're within the 7-day grace period
        if (daysOverdue <= 7) {
          // Initialize reminder tracker for this loan if not exists
          if (!reminderTracker[loan._id]) {
            reminderTracker[loan._id] = [];
          }
          
          // Send reminder if not already sent for this day
          if (!reminderTracker[loan._id].includes(daysOverdue)) {
            await sendPaymentReminder(loan, currentInstallment, daysOverdue, io);
            reminderTracker[loan._id].push(daysOverdue);
            console.log(`📧 Reminder sent for day ${daysOverdue}`);
          } else {
            console.log(`⏭️ Reminder already sent for day ${daysOverdue}`);
          }
        } else {
          // Grace period exceeded - liquidate collateral
          console.log(`🔥 Grace period exceeded (${daysOverdue} days) - Liquidating collateral for loan ${loan._id}`);
          
          await liquidateCollateral(loan, io);
          
          // Clear reminder tracker for this loan
          delete reminderTracker[loan._id];
          
          console.log(`✅ Collateral liquidated for loan ${loan._id}`);
        }
        
      } catch (loanError) {
        console.error(`Error processing loan ${loan._id}:`, loanError);
        // Continue with next loan
      }
    }
    
    console.log('=== Overdue Payment Check Completed ===\n');
    
  } catch (error) {
    console.error('Error in checkOverduePayments:', error);
  }
}

/**
 * Initialize scheduled jobs
 * @param {Object} io - Socket.IO instance
 */
function initializeScheduledJobs(io) {
  console.log('📅 Initializing scheduled jobs for collateral management...');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Daily overdue payment check triggered');
    checkOverduePayments(io);
  }, {
    timezone: 'Asia/Kuala_Lumpur' // Adjust to your timezone
  });
  
  // FOR TESTING: Run every hour
  // Uncomment the line below for testing purposes
  // cron.schedule('0 * * * *', () => {
  //   console.log('⏰ Hourly overdue payment check triggered (TEST MODE)');
  //   checkOverduePayments(io);
  // });
  
  // FOR TESTING: Run every 5 minutes
  // Uncomment the line below for intensive testing
  // cron.schedule('*/5 * * * *', () => {
  //   console.log('⏰ 5-minute overdue payment check triggered (TEST MODE)');
  //   checkOverduePayments(io);
  // });
  
  console.log('✅ Scheduled jobs initialized');
  console.log('   - Daily overdue check: 9:00 AM');
  
  // Run once on startup (optional)
  console.log('🚀 Running initial overdue payment check...');
  setTimeout(() => {
    checkOverduePayments(io);
  }, 5000); // Wait 5 seconds after startup
}

/**
 * Manual trigger for testing (can be called from API)
 * @param {Object} io - Socket.IO instance
 */
async function manualOverdueCheck(io) {
  console.log('🔧 Manual overdue payment check triggered');
  await checkOverduePayments(io);
  return { success: true, message: 'Overdue payment check completed' };
}

module.exports = {
  initializeScheduledJobs,
  checkOverduePayments,
  manualOverdueCheck
};
