const PoolInvestment = require('../models/poolInvestmentModel');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const Investor = require('../models/investorModel');
const { sendEmail } = require('./emailService');

/**
 * Distribute loan repayment to all investors in the pool proportionally
 * @param {Object} loan - The loan document
 * @param {Number} installmentNumber - The installment number being paid
 * @param {Number} principalAmount - Principal portion of the installment
 * @param {Number} interestAmount - Interest portion of the installment
 * @param {Object} io - Socket.IO instance for real-time notifications
 */
async function distributeRepaymentToInvestors(loan, installmentNumber, principalAmount, interestAmount, io) {
  try {
    console.log('\n💰 REPAYMENT DISTRIBUTION STARTED');
    console.log('========================================');
    console.log('Loan ID:', loan._id);
    console.log('Pool ID:', loan.pool);
    console.log('Installment:', installmentNumber);
    console.log('Principal:', principalAmount);
    console.log('Interest:', interestAmount);
    console.log('Total Payment:', principalAmount + interestAmount);

    // Find all active investments in this pool
    const investments = await PoolInvestment.find({
      pool: loan.pool,
      status: 'active'
    }).populate('investor', 'email firstName lastName');

    if (investments.length === 0) {
      console.log('⚠️  No active investments found in pool');
      return;
    }

    console.log(`\n📊 Found ${investments.length} active investors in pool`);

    // Calculate total invested amount in the pool
    const totalPoolInvestment = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
    console.log('Total Pool Investment:', totalPoolInvestment);

    // Track all distribution results
    const distributionResults = [];

    // Distribute to each investor proportionally
    for (const investment of investments) {
      try {
        // Calculate investor's share percentage
        const sharePercentage = investment.amountInvested / totalPoolInvestment;
        
        // Calculate distributed amounts
        const investorPrincipal = principalAmount * sharePercentage;
        const investorInterest = interestAmount * sharePercentage;

        console.log(`\n👤 Processing investor: ${investment.investor.email}`);
        console.log('   Share:', (sharePercentage * 100).toFixed(2) + '%');
        console.log('   Principal:', investorPrincipal.toFixed(2));
        console.log('   Interest:', investorInterest.toFixed(2));

        // Get investor's user account
        const investorUser = await User.findById(investment.investor._id);
        
        if (!investorUser) {
          console.log('   ❌ User not found');
          continue;
        }

        // Create transaction records for wallet history
        const transactions = [];

        // Transaction 1: Principal Return
        if (investorPrincipal > 0) {
          const principalTransaction = new Transaction({
            user: investorUser._id,
            type: 'investment_principal_return',
            amount: investorPrincipal,
            balanceBefore: investorUser.offChainBalance,
            balanceAfter: investorUser.offChainBalance + investorPrincipal,
            status: 'completed',
            description: `Principal return - Loan installment #${installmentNumber} (Pool: ${loan.poolName})`,
            metadata: {
              loanId: loan._id,
              poolId: loan.pool,
              installmentNumber,
              poolName: loan.poolName
            }
          });
          await principalTransaction.save();
          transactions.push(principalTransaction._id);
          
          // Update investor balance
          investorUser.offChainBalance += investorPrincipal;
          console.log('   ✅ Principal transaction created');
        }

        // Transaction 2: Interest/Profit
        if (investorInterest > 0) {
          const interestTransaction = new Transaction({
            user: investorUser._id,
            type: 'investment_interest_earned',
            amount: investorInterest,
            balanceBefore: investorUser.offChainBalance,
            balanceAfter: investorUser.offChainBalance + investorInterest,
            status: 'completed',
            description: `Interest earned - Loan installment #${installmentNumber} (Pool: ${loan.poolName})`,
            metadata: {
              loanId: loan._id,
              poolId: loan.pool,
              installmentNumber,
              poolName: loan.poolName,
              roi: investment.lockedROI
            }
          });
          await interestTransaction.save();
          transactions.push(interestTransaction._id);
          
          // Update investor balance
          investorUser.offChainBalance += investorInterest;
          console.log('   ✅ Interest transaction created');
        }

        // Save updated balance
        await investorUser.save();

        // Record distribution in investment
        investment.recordDistribution(
          loan._id,
          installmentNumber,
          investorPrincipal,
          investorInterest,
          transactions
        );
        await investment.save();

        console.log('   ✅ Investment record updated');
        console.log('   💰 New balance:', investorUser.offChainBalance.toFixed(2));

        // Send email notification
        try {
          await sendRepaymentNotificationEmail(
            investment.investor,
            loan,
            installmentNumber,
            investorPrincipal,
            investorInterest,
            investorUser.offChainBalance
          );
          console.log('   📧 Email notification sent');
        } catch (emailError) {
          console.log('   ⚠️  Email notification failed:', emailError.message);
        }

        // Send real-time socket notification
        if (io) {
          io.to(investorUser._id.toString()).emit('repayment_received', {
            poolName: loan.poolName,
            installmentNumber,
            principalAmount: investorPrincipal,
            interestAmount: investorInterest,
            totalAmount: investorPrincipal + investorInterest,
            newBalance: investorUser.offChainBalance,
            timestamp: new Date()
          });
          console.log('   🔔 Socket notification sent');
        }

        distributionResults.push({
          investorId: investment.investor._id,
          email: investment.investor.email,
          principal: investorPrincipal,
          interest: investorInterest,
          success: true
        });

      } catch (investorError) {
        console.error(`   ❌ Error processing investor ${investment.investor.email}:`, investorError);
        distributionResults.push({
          investorId: investment.investor._id,
          email: investment.investor.email,
          success: false,
          error: investorError.message
        });
      }
    }

    console.log('\n========================================');
    console.log('✅ REPAYMENT DISTRIBUTION COMPLETED');
    console.log('Success:', distributionResults.filter(r => r.success).length);
    console.log('Failed:', distributionResults.filter(r => !r.success).length);
    console.log('========================================\n');

    return {
      success: true,
      totalDistributed: principalAmount + interestAmount,
      investorsProcessed: distributionResults.length,
      results: distributionResults
    };

  } catch (error) {
    console.error('❌ REPAYMENT DISTRIBUTION FAILED:', error);
    throw error;
  }
}

/**
 * Send email notification to investor about repayment received
 */
async function sendRepaymentNotificationEmail(investor, loan, installmentNumber, principal, interest, newBalance) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8C57FF;">💰 Repayment Received</h2>
      
      <p>Dear ${investor.firstName || 'Investor'},</p>
      
      <p>You've received a repayment distribution from your investment:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Pool:</strong></td>
            <td style="text-align: right;">${loan.poolName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Installment:</strong></td>
            <td style="text-align: right;">#${installmentNumber}</td>
          </tr>
          <tr style="border-top: 1px solid #ddd;">
            <td style="padding: 8px 0;"><strong>Principal Returned:</strong></td>
            <td style="text-align: right; color: #22c55e;">$${principal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Interest Earned:</strong></td>
            <td style="text-align: right; color: #22c55e;">$${interest.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #8C57FF;">
            <td style="padding: 8px 0;"><strong>Total Received:</strong></td>
            <td style="text-align: right; font-size: 18px; color: #8C57FF;"><strong>$${(principal + interest).toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
      
      <p style="background: #e0f2fe; padding: 12px; border-radius: 6px; border-left: 4px solid #0284c7;">
        <strong>Your New Balance:</strong> $${newBalance.toFixed(2)}
      </p>
      
      <p>This amount has been added to your wallet and is available for withdrawal or reinvestment.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated notification from RentMates Investment Platform.
      </p>
    </div>
  `;

  await sendEmail(
    investor.email,
    'Repayment Received - RentMates Investment',
    emailContent
  );
}

module.exports = {
  distributeRepaymentToInvestors
};
