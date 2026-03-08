const mongoose = require('mongoose');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
require('dotenv').config();

/**
 * Test Script: Verify Pool Accounting is Correct
 * 
 * This script verifies that:
 * 1. Pool value = availableBalance + disbursedLoans (no double-counting)
 * 2. Total investor share value = pool value (always withdrawable)
 * 3. Share price is calculated correctly
 */

async function verifyPoolAccounting() {
  try {
    console.log('🔍 Verifying Pool Accounting Integrity\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const pools = await InvestmentPool.find({});
    
    if (pools.length === 0) {
      console.log('ℹ️  No pools found in database. Accounting rules are correct for new pools.\n');
      console.log('✅ When you create pools and investments:');
      console.log('   • Pool Value = availableBalance + disbursedLoans');
      console.log('   • Share Price = Pool Value / Total Shares');
      console.log('   • All investor shares will equal pool value');
      console.log('   • Investors can always withdraw their full share value\n');
      process.exit(0);
    }
    
    console.log(`Found ${pools.length} investment pool(s)\n`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let allPoolsValid = true;
    
    for (const pool of pools) {
      console.log(`📊 Pool: ${pool.name}`);
      console.log(`   ID: ${pool._id}`);
      console.log(`   ─────────────────────────────────────────────────────────`);
      
      // Calculate pool value using the method
      const poolValue = pool.getTotalPoolValue();
      const manualPoolValue = pool.availableBalance + pool.disbursedLoans;
      
      console.log(`\n   Pool Balances:`);
      console.log(`   │ Available Balance: $${pool.availableBalance.toFixed(2)} (cash in pool)`);
      console.log(`   │ Disbursed Loans: $${pool.disbursedLoans.toFixed(2)} (outstanding loans)`);
      console.log(`   │ Accrued Interest: $${pool.accruedInterest.toFixed(2)} ${pool.accruedInterest === 0 ? '✅' : '⚠️ (should be 0)'}`);
      console.log(`   │ Total Pool Value: $${poolValue.toFixed(2)}`);
      console.log(`   │ Manual Calculation: $${manualPoolValue.toFixed(2)}`);
      
      // Verify pool value calculation
      if (Math.abs(poolValue - manualPoolValue) > 0.01) {
        console.log(`   ❌ ERROR: Pool value mismatch!`);
        allPoolsValid = false;
      } else {
        console.log(`   ✅ Pool value calculation correct`);
      }
      
      // Check share price
      console.log(`\n   Share Information:`);
      console.log(`   │ Total Shares: ${pool.totalShares.toFixed(6)}`);
      
      if (pool.totalShares > 0) {
        const sharePrice = pool.getSharePrice();
        const expectedSharePrice = poolValue / pool.totalShares;
        console.log(`   │ Share Price: $${sharePrice.toFixed(6)}`);
        console.log(`   │ Expected: $${expectedSharePrice.toFixed(6)}`);
        
        if (Math.abs(sharePrice - expectedSharePrice) > 0.000001) {
          console.log(`   ❌ ERROR: Share price calculation incorrect!`);
          allPoolsValid = false;
        } else {
          console.log(`   ✅ Share price calculation correct`);
        }
      } else {
        console.log(`   │ No shares issued yet`);
      }
      
      // Get all active investments
      const investments = await PoolInvestment.find({
        pool: pool._id,
        status: 'active'
      }).populate('investor', 'email firstName lastName');
      
      if (investments.length > 0) {
        console.log(`\n   Investor Positions (${investments.length} investors):`);
        console.log(`   ─────────────────────────────────────────────────────────`);
        
        let totalShareValue = 0;
        const sharePrice = pool.getSharePrice();
        
        for (const inv of investments) {
          const shareValue = inv.shares * sharePrice;
          totalShareValue += shareValue;
          
          const investorName = inv.investor ? 
            `${inv.investor.firstName} ${inv.investor.lastName} (${inv.investor.email})` : 
            'Unknown Investor';
          
          console.log(`   │ ${investorName}`);
          console.log(`   │   • Shares: ${inv.shares.toFixed(6)}`);
          console.log(`   │   • Share Value: $${shareValue.toFixed(2)}`);
          console.log(`   │   • Amount Invested: $${inv.amountInvested.toFixed(2)}`);
          console.log(`   │   • Profit: $${(shareValue - inv.amountInvested).toFixed(2)}`);
        }
        
        console.log(`   ─────────────────────────────────────────────────────────`);
        console.log(`\n   Total Investor Share Value: $${totalShareValue.toFixed(2)}`);
        console.log(`   Pool Value: $${poolValue.toFixed(2)}`);
        console.log(`   Difference: $${Math.abs(totalShareValue - poolValue).toFixed(2)}`);
        
        // Verify that total investor share value equals pool value
        if (Math.abs(totalShareValue - poolValue) > 0.02) {
          console.log(`   ❌ ERROR: Investor shares don't match pool value!`);
          console.log(`   ⚠️  Investors cannot withdraw their full value!`);
          allPoolsValid = false;
        } else {
          console.log(`   ✅ PERFECT: Investors can withdraw their full value!`);
        }
        
        // Check if pool has enough available balance for withdrawals
        console.log(`\n   Withdrawal Capacity:`);
        console.log(`   │ Available for Withdrawal: $${pool.availableBalance.toFixed(2)}`);
        
        if (pool.disbursedLoans > 0) {
          console.log(`   │ Locked in Loans: $${pool.disbursedLoans.toFixed(2)}`);
          console.log(`   │ Note: Some funds locked until loans are repaid`);
        }
        
        if (pool.availableBalance >= totalShareValue) {
          console.log(`   ✅ All investors can withdraw NOW`);
        } else if (pool.availableBalance + pool.disbursedLoans >= totalShareValue) {
          console.log(`   ⚠️  Some funds locked in loans, but total value is sufficient`);
          console.log(`   ✅ All investors can withdraw when loans are repaid`);
        } else {
          console.log(`   ❌ ERROR: Pool doesn't have enough value for all investors!`);
          allPoolsValid = false;
        }
      } else {
        console.log(`\n   No active investments in this pool`);
      }
      
      console.log(`\n═══════════════════════════════════════════════════════════\n`);
    }
    
    // Final verdict
    console.log('\n📋 FINAL VERIFICATION REPORT\n');
    console.log('═══════════════════════════════════════════════════════════');
    if (allPoolsValid) {
      console.log('✅ ALL POOLS PASS VERIFICATION');
      console.log('✅ Pool accounting is mathematically correct');
      console.log('✅ No double-counting detected');
      console.log('✅ Investors can withdraw their full share value');
      console.log('✅ System is stable and closed');
    } else {
      console.log('❌ SOME POOLS FAILED VERIFICATION');
      console.log('⚠️  Please review the errors above');
      console.log('⚠️  Run the migration script to fix issues');
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(allPoolsValid ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run verification
verifyPoolAccounting();
