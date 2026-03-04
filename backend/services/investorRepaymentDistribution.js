const PoolInvestment = require('../models/poolInvestmentModel');
const InvestmentPool = require('../models/investmentPoolModel');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const Investor = require('../models/investorModel');
const { sendEmail } = require('./emailService');

/**
 * Distribute loan repayment to all investors in the pool proportionally based on shares
 * @param {Object} loan - The loan document
 * @param {Number} installmentNumber - The installment number being paid
 * @param {Number} principalAmount - Principal portion of the installment
 * @param {Number} interestAmount - Interest portion of the installment
 * @param {Object} io - Socket.IO instance for real-time notifications
 */
async function distributeRepaymentToInvestors(loan, installmentNumber, principalAmount, interestAmount, io) {
  try {
    console.log('\n💰 REPAYMENT DISTRIBUTION STARTED (Share-Based)');
    console.log('========================================');
    console.log('Loan ID:', loan._id);
    console.log('Pool ID:', loan.pool);
    console.log('Installment:', installmentNumber);
    console.log('Principal:', principalAmount);
    console.log('Interest:', interestAmount);
    console.log('Total Payment:', principalAmount + interestAmount);
    
    // Get the pool
    const pool = await InvestmentPool.findById(loan.pool);
    if (!pool) {
      console.log('⚠️  Pool not found');
      return;
    }

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
    console.log('Total Pool Shares:', pool.totalShares.toFixed(6));
    
    // ✅ SHARE-BASED: Update pool values to reflect repayment
    const totalRepayment = principalAmount + interestAmount;
    const oldPoolValue = pool.getTotalPoolValue();
    const oldSharePrice = pool.getSharePrice();
    
    // Step 1: Reduce outstanding principal (loan is being repaid)
    pool.disbursedLoans -= principalAmount;
    
    // Step 2: Add interest to accrued interest (increases pool value)
    pool.accruedInterest += interestAmount;
    
    // Step 3: Add cash back to available balance (can be withdrawn or lent again)
    pool.availableBalance += totalRepayment;
    
    await pool.save();
    
    const newPoolValue = pool.getTotalPoolValue();
    const newSharePrice = pool.getSharePrice();
    console.log('Pool Value Change:', oldPoolValue.toFixed(2), '→', newPoolValue.toFixed(2));
    console.log('Share Price Change:', oldSharePrice.toFixed(6), '→', newSharePrice.toFixed(6));
    console.log('✅ Pool economic value increased by interest:', interestAmount.toFixed(2));
    console.log('📈 Returns are REINVESTED (not sent to wallets)');

    // Track all update results
    const updateResults = [];
    
    // Group investments by investor to avoid duplicate notifications
    const investorMap = new Map();

    // Update all investors' investment values based on new share price (NO WALLET TRANSFERS)
    for (const investment of investments) {
      try {
        // ✅ SHARE-BASED: Calculate investor's proportional gain
        const shareRatio = investment.shares / pool.totalShares;
        const investorGain = interestAmount * shareRatio; // Their share of interest
        
        const oldValue = await investment.getCurrentValue();
        
        console.log(`\n👤 Processing investor: ${investment.investor.email}`);
        console.log('   Shares:', investment.shares.toFixed(6));
        console.log('   Share Ratio:', (shareRatio * 100).toFixed(4) + '%');
        console.log('   Value Increase:', investorGain.toFixed(2));
        console.log('   Old Value:', oldValue.toFixed(2));

        // ✅ NO WALLET TRANSACTION - Just record earning history
        await investment.recordEarning(investorGain, 'loan_repayment');
        await investment.save();
        
        const newValue = await investment.getCurrentValue();
        console.log('   New Value:', newValue.toFixed(2));
        console.log('   ✅ Investment value updated (compounded)');

        // Get investor user for notifications (aggregate per investor)
        const investorUserId = investment.investor._id.toString();
        
        if (!investorMap.has(investorUserId)) {
          const investorUser = await User.findById(investment.investor._id);
          
          if (!investorUser) {
            console.log('   ❌ User not found');
            continue;
          }
          
          investorMap.set(investorUserId, {
            user: investorUser,
            investor: investment.investor,
            totalGain: 0,
            totalOldValue: 0,
            totalNewValue: 0,
            totalShares: 0,
            investments: []
          });
        }
        
        // Aggregate investor data
        const investorData = investorMap.get(investorUserId);
        investorData.totalGain += investorGain;
        investorData.totalOldValue += oldValue;
        investorData.totalNewValue += newValue;
        investorData.totalShares += investment.shares;
        investorData.investments.push({
          investmentId: investment._id,
          gain: investorGain,
          oldValue,
          newValue
        });

        updateResults.push({
          investorId: investment.investor._id,
          email: investment.investor.email,
          valueIncrease: investorGain,
          newValue: newValue,
          success: true
        });

      } catch (investorError) {
        console.error(`   ❌ Error processing investor ${investment.investor.email}:`, investorError);
        updateResults.push({
          investorId: investment.investor._id,
          email: investment.investor.email,
          success: false,
          error: investorError.message
        });
      }
    }
    
    // Send ONE notification per investor (aggregated)
    for (const [investorUserId, investorData] of investorMap) {
      try {
        // Send email notification about value increase (only once per investor)
        await sendValueIncreaseNotificationEmail(
          investorData.investor,
          loan,
          installmentNumber,
          investorData.totalOldValue,
          investorData.totalNewValue,
          investorData.totalGain,
          newSharePrice
        );
        console.log(`   📧 Email notification sent to ${investorData.investor.email}`);
      } catch (emailError) {
        console.log(`   ⚠️  Email notification failed for ${investorData.investor.email}:`, emailError.message);
      }

      // Send ONE real-time socket notification per investor
      if (io) {
        io.to(`user_${investorUserId}`).emit('investment_value_updated', {
          poolId: pool._id.toString(),
          poolName: loan.poolName,
          installmentNumber,
          valueIncrease: investorData.totalGain,
          oldValue: investorData.totalOldValue,
          newValue: investorData.totalNewValue,
          sharePrice: newSharePrice,
          shares: investorData.totalShares,
          investmentCount: investorData.investments.length,
          timestamp: new Date()
        });
        console.log(`   🔔 Socket notification sent to user_${investorUserId} (${investorData.investments.length} investments aggregated)`);
      }
    }
    
// Broadcast pool share price update to all investors
    if (io) {
      io.emit('pool_share_price_updated', {
        poolId: pool._id.toString(),
        poolName: loan.poolName,
        newSharePrice: newSharePrice,
        oldSharePrice: oldSharePrice,
        totalPoolValue: newPoolValue,
        availableBalance: pool.availableBalance,
        totalShares: pool.totalShares,
        interestAccrued: interestAmount,
        timestamp: new Date()
      });
      console.log('📡 Broadcast pool share price update to all investors');
    }
    console.log('\n========================================');
    console.log('✅ VALUE UPDATE COMPLETED (NO WALLET TRANSFERS)');
    console.log('Total Interest Accrued:', interestAmount.toFixed(2));
    console.log('New Share Price:', newSharePrice.toFixed(6));
    console.log('Success:', updateResults.filter(r => r.success).length);
    console.log('Failed:', updateResults.filter(r => !r.success).length);
    console.log('========================================\n');

    return {
      success: true,
      totalInterestAccrued: interestAmount,
      newSharePrice: newSharePrice,
      investorsProcessed: updateResults.length,
      results: updateResults
    };

  } catch (error) {
    console.error('❌ REPAYMENT DISTRIBUTION FAILED:', error);
    throw error;
  }
}

/**
 * Send email notification to investor about investment value increase
 * NOTE: In share-based pools, returns are REINVESTED automatically (not sent to wallet)
 */
async function sendValueIncreaseNotificationEmail(investor, loan, installmentNumber, oldValue, newValue, valueIncrease, newSharePrice) {
  const percentageGain = ((valueIncrease / oldValue) * 100).toFixed(2);
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8C57FF;">📈 Investment Value Increased</h2>
      
      <p>Dear ${investor.firstName || 'Investor'},</p>
      
      <p>Your investment value has increased due to successful loan repayment:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Value Update</h3>
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
            <td style="padding: 8px 0;"><strong>Previous Value:</strong></td>
            <td style="text-align: right;">$${oldValue.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Value Increase:</strong></td>
            <td style="text-align: right; color: #22c55e;">+$${valueIncrease.toFixed(2)} (${percentageGain}%)</td>
          </tr>
          <tr style="border-top: 2px solid #8C57FF;">
            <td style="padding: 8px 0;"><strong>New Value:</strong></td>
            <td style="text-align: right; font-size: 18px; color: #8C57FF;"><strong>$${newValue.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Current Share Price:</strong></td>
            <td style="text-align: right; color: #0284c7;">$${newSharePrice.toFixed(6)}</td>
          </tr>
        </table>
      </div>
      
      <p style="background: #dcfce7; padding: 12px; border-radius: 6px; border-left: 4px solid #22c55e;">
        <strong>🔄 Compound Growth:</strong> Your returns are automatically reinvested, increasing your investment value through share price appreciation.
      </p>
      
      <p>💡 <strong>How it works:</strong> When loans are repaid, the interest earned increases the pool's total value, which increases the share price. Your shares are now worth more!</p>
      
      <p>You can withdraw your investment at any time by selling your shares at the current share price.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated notification from RentMates Investment Platform.
      </p>
    </div>
  `;

  await sendEmail(
    investor.email,
    '📈 Investment Value Increased - RentMates',
    emailContent
  );
}

module.exports = {
  distributeRepaymentToInvestors
};
