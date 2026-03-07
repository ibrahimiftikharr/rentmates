const { ethers } = require('ethers');
const mongoose = require('mongoose');
const Loan = require('../models/loanModel');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
const Investor = require('../models/investorModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Notification = require('../models/notificationModel');
const Transaction = require('../models/transactionModel');
const { notifyCollateralLiquidated, notifyPoolCollateralLiquidated, notifyLoanDefaultInPool } = require('./notificationService');
const { getPAXGPrice } = require('./coinMarketCapService');
const { sendEmail } = require('./emailService');
const blockchainService = require('./blockchainService');

/**
 * Calculate the USDT value of PAXG collateral
 * @param {number} paxgAmount - Amount of PAXG tokens
 * @returns {Promise<number>} USDT value
 */
async function calculateCollateralValue(paxgAmount) {
  const paxgPrice = await getPAXGPrice();
  return paxgAmount * paxgPrice;
}

/**
 * Check if an installment is overdue and calculate days overdue
 * @param {Object} installment - Loan installment object
 * @returns {Object} { isOverdue, daysOverdue }
 */
function checkOverdueStatus(installment) {
  const now = new Date();
  const dueDate = new Date(installment.dueDate);
  
  if (installment.status === 'paid') {
    return { isOverdue: false, daysOverdue: 0 };
  }
  
  if (now <= dueDate) {
    return { isOverdue: false, daysOverdue: 0 };
  }
  
  const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
  return { isOverdue: true, daysOverdue };
}

/**
 * Liquidate collateral for a defaulted loan
 * @param {Object} loan - Loan document
 * @param {Object} io - Socket.IO instance for real-time notifications
 * @returns {Promise<Object>} Liquidation result
 */
async function liquidateCollateral(loan, io) {
  try {
    console.log(`🔥 Starting collateral liquidation for loan ${loan._id}`);
    
    // Get collateral value in USDT
    const collateralValueUSDT = await calculateCollateralValue(loan.requiredCollateral);
    console.log(`Collateral: ${loan.requiredCollateral} PAXG = ${collateralValueUSDT.toFixed(2)} USDT`);
    
    // Calculate total amount owed (remaining balance includes principal + interest)
    const totalOwed = loan.remainingBalance || 0;
    const principalOwed = loan.loanAmount - loan.amountRepaid;
    
    // Get overdue installments to calculate accrued interest owed
    const overdueInstallments = loan.repaymentSchedule.filter(
      inst => inst.status === 'overdue' || inst.status === 'pending'
    );
    
    let interestOwed = 0;
    let principalFromOverdue = 0;
    
    overdueInstallments.forEach(inst => {
      principalFromOverdue += inst.principalAmount || 0;
      interestOwed += inst.interestAmount || 0;
    });
    
    console.log(`Amount owed - Principal: ${principalFromOverdue.toFixed(2)}, Interest: ${interestOwed.toFixed(2)}, Total: ${totalOwed.toFixed(2)}`);
    
    // Distribute collateral proceeds
    let remainingCollateral = collateralValueUSDT;
    let principalRecovered = 0;
    let interestRecovered = 0;
    let excessReturned = 0;
    
    // Priority 1: Recover principal first
    if (remainingCollateral > 0 && principalFromOverdue > 0) {
      principalRecovered = Math.min(remainingCollateral, principalFromOverdue);
      remainingCollateral -= principalRecovered;
    }
    
    // Priority 2: Recover interest
    if (remainingCollateral > 0 && interestOwed > 0) {
      interestRecovered = Math.min(remainingCollateral, interestOwed);
      remainingCollateral -= interestRecovered;
    }
    
    // Priority 3: Return excess to borrower
    if (remainingCollateral > 0) {
      excessReturned = remainingCollateral;
    }
    
    console.log(`Liquidation distribution - Principal: ${principalRecovered.toFixed(2)}, Interest: ${interestRecovered.toFixed(2)}, Excess returned: ${excessReturned.toFixed(2)}`);
    
    // Add recovered amounts to investment pool
    const pool = await InvestmentPool.findById(loan.pool);
    if (!pool) {
      throw new Error('Investment pool not found');
    }
    
    const totalRecovered = principalRecovered + interestRecovered;
    
    // Update pool balances
    pool.availableBalance += totalRecovered;
    pool.disbursedLoans -= principalRecovered; // Reduce outstanding principal
    pool.accruedInterest += interestRecovered; // Add recovered interest
    await pool.save();
    
    console.log(`✓ Pool ${pool.name} updated - Added ${totalRecovered.toFixed(2)} USDT (Principal: ${principalRecovered.toFixed(2)}, Interest: ${interestRecovered.toFixed(2)})`);
    
    // Update loan status
    loan.status = 'defaulted';
    loan.collateralStatus = 'liquidated';
    
    // Mark all unpaid installments as defaulted
    loan.repaymentSchedule.forEach(inst => {
      if (inst.status === 'pending' || inst.status === 'overdue') {
        inst.status = 'defaulted';
      }
    });
    
    loan.notes = (loan.notes || '') + `\n[${new Date().toISOString()}] Collateral liquidated: ${loan.requiredCollateral} PAXG (${collateralValueUSDT.toFixed(2)} USDT). Principal recovered: ${principalRecovered.toFixed(2)}, Interest recovered: ${interestRecovered.toFixed(2)}, Excess returned to borrower: ${excessReturned.toFixed(2)}`;
    
    await loan.save();
    
    // Get student and user info
    const student = await Student.findById(loan.borrower).populate('user');
    const borrowerUser = student.user;
    
    // Return excess collateral to borrower if any
    if (excessReturned > 0) {
      borrowerUser.offChainBalance += excessReturned;
      await borrowerUser.save();
      
      // Create transaction record for excess return
      await Transaction.create({
        user: borrowerUser._id,
        type: 'collateral_return',
        amount: excessReturned,
        status: 'completed',
        balanceAfter: borrowerUser.offChainBalance,
        description: `Excess collateral returned after liquidation for loan ${loan._id}`
      });
      
      console.log(`✓ Returned ${excessReturned.toFixed(2)} USDT excess collateral to borrower`);
    }
    
    // Notify the borrower/student using notificationService
    await notifyCollateralLiquidated(student._id, loan._id, collateralValueUSDT);
    
    // Send email notification to student
    try {
      await sendEmail({
        to: borrowerUser.email,
        subject: 'Loan Default - Collateral Liquidated',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #DC2626;">Loan Default Notice</h2>
            <p>Dear ${borrowerUser.name},</p>
            <p>Your loan collateral has been liquidated due to payment default after the 7-day grace period.</p>
            
            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #DC2626;">Liquidation Details</h3>
              <p><strong>Collateral Amount:</strong> ${loan.requiredCollateral.toFixed(4)} PAXG</p>
              <p><strong>Collateral Value:</strong> ${collateralValueUSDT.toFixed(2)} USDT</p>
              <p><strong>Principal Recovered:</strong> ${principalRecovered.toFixed(2)} USDT</p>
              <p><strong>Interest Recovered:</strong> ${interestRecovered.toFixed(2)} USDT</p>
              ${excessReturned > 0 ? `<p><strong>Excess Returned to You:</strong> ${excessReturned.toFixed(2)} USDT</p>` : ''}
            </div>
            
            <p>Your loan is now marked as defaulted. This may affect your ability to apply for future loans.</p>
            
            <p>If you have any questions or concerns, please contact our support team.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">Best regards,<br>The RentMates Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending liquidation email to student:', emailError);
    }
    
    // Notify all investors in the pool
    try {
      const investments = await PoolInvestment.find({ pool: pool._id, status: 'active' })
        .populate('investor');
      
      // Deduplicate investors - get unique investor user IDs
      const uniqueInvestorIds = [...new Set(investments.map(inv => inv.investor.toString()))];
      
      console.log(`📨 Notifying ${uniqueInvestorIds.length} unique investors about collateral liquidation`);
      
      for (const investorUserId of uniqueInvestorIds) {
        const investorUser = await User.findById(investorUserId);
        if (!investorUser) continue;
        
        // Get investor profile
        const investorProfile = await Investor.findOne({ user: investorUser._id });
        if (!investorProfile) continue;
        
        try {
          // Create in-app notifications using notificationService
          await notifyPoolCollateralLiquidated(investorProfile._id, pool._id, totalRecovered);
          await notifyLoanDefaultInPool(investorProfile._id, pool._id, loan.loanAmount, totalOwed);
          console.log(`   ✓ Notified investor ${investorProfile._id}`);
          
          // Emit socket event
          if (io) {
            io.to(`user_${investorUser._id}`).emit('new_notification', {
              type: 'collateral_liquidated',
              message: `Loan default in pool "${pool.name}" - Collateral liquidated`,
              timestamp: new Date()
            });
            console.log(`   ✓ Socket.IO notification sent to investor ${investorUserId}`);
          }
          
          // Send email notification
          try {
            await sendEmail({
              to: investorUser.email,
              subject: `Loan Default Notification - ${pool.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #DC2626;">Loan Default Notification</h2>
                  <p>Dear ${investorUser.name},</p>
                  <p>A loan in your investment pool <strong>"${pool.name}"</strong> has defaulted.</p>
                  
                  <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Recovery Details</h3>
                    <p><strong>Total Recovered:</strong> ${totalRecovered.toFixed(2)} USDT</p>
                    <p><strong>Principal Recovered:</strong> ${principalRecovered.toFixed(2)} USDT</p>
                    <p><strong>Interest Recovered:</strong> ${interestRecovered.toFixed(2)} USDT</p>
                  </div>
                  
                  <p>The recovered amount has been added back to the pool's available balance. Your shares in the pool remain unchanged.</p>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">Best regards,<br>The RentMates Team</p>
                  </div>
                </div>
              `
            });
          } catch (emailError) {
            console.error(`Error sending liquidation email to investor ${investorUser.email}:`, emailError);
          }
        } catch (notifError) {
          console.error(`   ⚠️  Failed to notify investor:`, notifError.message);
        }
      }
      
      console.log(`✓ Notified ${uniqueInvestorIds.length} unique investors in pool "${pool.name}"`);
    } catch (notifyError) {
      console.error('Error notifying investors:', notifyError);
    }
    
    console.log(`✅ Collateral liquidation completed for loan ${loan._id}`);
    
    return {
      success: true,
      collateralValueUSDT,
      principalRecovered,
      interestRecovered,
      excessReturned,
      totalRecovered
    };
    
  } catch (error) {
    console.error('Collateral liquidation error:', error);
    throw error;
  }
}

/**
 * Return collateral to borrower after successful loan completion
 * @param {Object|String} loanOrId - Completed loan document or loan ID
 * @param {Object} io - Socket.IO instance
 * @returns {Promise<boolean>} Success status
 */
async function returnCollateral(loanOrId, io) {
  try {
    // If loanOrId is a string (loan ID), fetch the loan
    let loan;
    if (typeof loanOrId === 'string' || loanOrId instanceof mongoose.Types.ObjectId) {
      loan = await Loan.findById(loanOrId);
      if (!loan) {
        throw new Error('Loan not found');
      }
    } else {
      loan = loanOrId;
    }
    
    console.log(`💎 Returning collateral for completed loan ${loan._id}`);
    
    // Verify loan is completed
    if (loan.status !== 'completed') {
      throw new Error('Loan is not completed yet');
    }
    
    if (loan.collateralStatus === 'returned') {
      throw new Error('Collateral already returned');
    }
    
    // Mark collateral as available for withdrawal
    loan.collateralStatus = 'returned';
    loan.notes = (loan.notes || '') + `\n[${new Date().toISOString()}] Collateral (${loan.requiredCollateral} PAXG) marked as available for withdrawal after successful loan completion.`;
    await loan.save();
    
    // Get student info
    const student = await Student.findById(loan.borrower).populate('user');
    const borrowerUser = student.user;
    
    // Notify the borrower
    await Notification.create({
      recipient: student._id,
      recipientModel: 'Student',
      type: 'collateral_available_withdrawal',
      title: 'Collateral Available for Withdrawal',
      message: `Congratulations! You have successfully completed your loan. Your collateral (${loan.requiredCollateral.toFixed(4)} PAXG) is now available for withdrawal. Visit the Loan Center to withdraw your collateral.`,
      relatedId: loan._id,
      relatedModel: 'Loan',
      metadata: {
        loanId: loan._id,
        collateralAmount: loan.requiredCollateral
      }
    });
    
    // Emit socket event
    if (io) {
      io.to(`user_${borrowerUser._id}`).emit('collateral_available', {
        loanId: loan._id,
        collateralAmount: loan.requiredCollateral,
        timestamp: new Date()
      });
    }
    
    // Send email notification
    try {
      await sendEmail({
        to: borrowerUser.email,
        subject: 'Loan Completed - Collateral Ready for Withdrawal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">🎉 Loan Successfully Completed!</h2>
            <p>Dear ${borrowerUser.name},</p>
            <p>Congratulations! You have successfully completed your loan and made all scheduled payments.</p>
            
            <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #059669;">Collateral Ready for Withdrawal</h3>
              <p><strong>Collateral Amount:</strong> ${loan.requiredCollateral.toFixed(4)} PAXG</p>
              <p>Your collateral is now available for withdrawal from the platform.</p>
            </div>
            
            <p>To withdraw your collateral:</p>
            <ol>
              <li>Go to your Loan Center</li>
              <li>Click the "Withdraw Collateral" button</li>
              <li>Your PAXG will be transferred back to your wallet</li>
            </ol>
            
            <p>Thank you for being a responsible borrower!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">Best regards,<br>The RentMates Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending completion email:', emailError);
    }
    
    console.log(`✅ Collateral return notification sent for loan ${loan._id}`);
    return true;
    
  } catch (error) {
    console.error('Return collateral error:', error);
    throw error;
  }
}

/**
 * Send payment reminder notifications
 * @param {Object} loan - Loan document
 * @param {Object} installment - Overdue installment
 * @param {number} daysOverdue - Number of days overdue
 * @param {Object} io - Socket.IO instance
 */
async function sendPaymentReminder(loan, installment, daysOverdue, io) {
  try {
    console.log(`📧 Sending payment reminder for loan ${loan._id}, ${daysOverdue} days overdue`);
    
    const student = await Student.findById(loan.borrower).populate('user');
    const borrowerUser = student.user;
    
    const severity = daysOverdue <= 3 ? 'medium' : 'high';
    const title = daysOverdue <= 3 
      ? 'Loan Payment Reminder' 
      : 'Urgent: Loan Payment Overdue';
    
    const daysRemaining = 7 - daysOverdue;
    
    const message = daysRemaining > 0
      ? `Your loan installment #${installment.installmentNumber} is ${daysOverdue} day(s) overdue. Please make the payment within ${daysRemaining} day(s) to avoid collateral liquidation.`
      : `FINAL NOTICE: Your loan installment is ${daysOverdue} day(s) overdue. Your collateral will be liquidated immediately.`;
    
    // Create notification
    const notification = await Notification.create({
      recipient: student._id,
      recipientModel: 'Student',
      type: daysOverdue <= 3 ? 'loan_payment_reminder' : 'loan_payment_overdue',
      title,
      message,
      relatedId: loan._id,
      relatedModel: 'Loan',
      metadata: {
        loanId: loan._id,
        installmentNumber: installment.installmentNumber,
        daysOverdue,
        daysRemaining,
        amountDue: installment.amount
      }
    });
    
    // Emit socket event
    if (io) {
      io.to(`user_${borrowerUser._id}`).emit('payment_reminder', {
        loanId: loan._id,
        daysOverdue,
        daysRemaining,
        severity,
        timestamp: new Date()
      });
      
      io.to(`user_${borrowerUser._id}`).emit('new_notification', {
        type: notification.type,
        message: notification.message,
        timestamp: new Date()
      });
    }
    
    // Send email
    try {
      const emailColor = severity === 'high' ? '#DC2626' : '#F59E0B';
      const emailBgColor = severity === 'high' ? '#FEF2F2' : '#FFFBEB';
      
      await sendEmail({
        to: borrowerUser.email,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${emailColor};">${title}</h2>
            <p>Dear ${borrowerUser.name},</p>
            <p>This is${daysOverdue > 3 ? ' an urgent' : ' a'} reminder that your loan payment is overdue.</p>
            
            <div style="background-color: ${emailBgColor}; border-left: 4px solid ${emailColor}; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: ${emailColor};">Payment Details</h3>
              <p><strong>Installment Number:</strong> ${installment.installmentNumber}</p>
              <p><strong>Amount Due:</strong> ${installment.amount.toFixed(2)} USDT</p>
              <p><strong>Original Due Date:</strong> ${new Date(installment.dueDate).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
              ${daysRemaining > 0 ? `<p style="color: ${emailColor};"><strong>Days Remaining Before Liquidation:</strong> ${daysRemaining}</p>` : ''}
            </div>
            
            ${daysRemaining > 0 ? `
              <p><strong>Action Required:</strong> Please make your payment within the next ${daysRemaining} day(s) to avoid collateral liquidation.</p>
            ` : `
              <p style="color: #DC2626;"><strong>FINAL NOTICE:</strong> Your collateral will be liquidated immediately to recover the outstanding amount.</p>
            `}
            
            <p>To make a payment, please visit your Loan Center in the RentMates platform.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">Best regards,<br>The RentMates Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending payment reminder email:', emailError);
    }
    
    console.log(`✓ Payment reminder sent for loan ${loan._id}`);
    
  } catch (error) {
    console.error('Send payment reminder error:', error);
    throw error;
  }
}

module.exports = {
  calculateCollateralValue,
  checkOverdueStatus,
  liquidateCollateral,
  returnCollateral,
  sendPaymentReminder
};
