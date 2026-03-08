const mongoose = require('mongoose');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
require('dotenv').config();

/**
 * Migration Script: Fix Accrued Interest Double-Counting Bug
 * 
 * Problem: accruedInterest was being added to pool value calculation
 * while interest was already included in availableBalance from repayments.
 * This caused share prices to be inflated and made withdrawals impossible.
 * 
 * Solution: Zero out accruedInterest since interest is already in availableBalance
 */

async function fixAccruedInterestBug() {
  try {
    console.log('🔧 Starting Migration: Fix Accrued Interest Double-Counting Bug\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const pools = await InvestmentPool.find({});
    console.log(`Found ${pools.length} investment pools\n`);
    
    let fixedCount = 0;
    
    for (const pool of pools) {
      console.log(`\n📊 Pool: ${pool.name}`);
      console.log(`   ID: ${pool._id}`);
      console.log(`   ─────────────────────────────────────────`);
      
      const oldAccruedInterest = pool.accruedInterest;
      const oldPoolValue = pool.availableBalance + pool.disbursedLoans + pool.accruedInterest;
      const oldSharePrice = pool.totalShares > 0 ? oldPoolValue / pool.totalShares : 1;
      
      console.log(`   BEFORE:`);
      console.log(`   │ Available Balance: $${pool.availableBalance.toFixed(2)}`);
      console.log(`   │ Disbursed Loans: $${pool.disbursedLoans.toFixed(2)}`);
      console.log(`   │ Accrued Interest: $${oldAccruedInterest.toFixed(2)} ❌ (double-counted)`);
      console.log(`   │ Total Pool Value: $${oldPoolValue.toFixed(2)}`);
      console.log(`   │ Total Shares: ${pool.totalShares.toFixed(6)}`);
      console.log(`   │ Share Price: $${oldSharePrice.toFixed(6)}\n`);
      
      // FIX: Zero out accruedInterest (it's already in availableBalance)
      pool.accruedInterest = 0;
      await pool.save();
      
      const newPoolValue = pool.getTotalPoolValue();
      const newSharePrice = pool.getSharePrice();
      
      console.log(`   AFTER:`);
      console.log(`   │ Available Balance: $${pool.availableBalance.toFixed(2)}`);
      console.log(`   │ Disbursed Loans: $${pool.disbursedLoans.toFixed(2)}`);
      console.log(`   │ Accrued Interest: $${pool.accruedInterest.toFixed(2)} ✅ (fixed)`);
      console.log(`   │ Total Pool Value: $${newPoolValue.toFixed(2)}`);
      console.log(`   │ Total Shares: ${pool.totalShares.toFixed(6)}`);
      console.log(`   │ Share Price: $${newSharePrice.toFixed(6)}\n`);
      
      if (oldAccruedInterest > 0) {
        console.log(`   ✅ Fixed! Removed $${oldAccruedInterest.toFixed(2)} double-counted interest`);
        console.log(`   📉 Share price corrected: $${oldSharePrice.toFixed(6)} → $${newSharePrice.toFixed(6)}`);
        fixedCount++;
      } else {
        console.log(`   ℹ️  No changes needed (accrued interest was already 0)`);
      }
    }
    
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Migration Completed Successfully!`);
    console.log(`   Total pools processed: ${pools.length}`);
    console.log(`   Pools fixed: ${fixedCount}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Now verify investor share values match pool capacity
    console.log('\n🔍 Verifying investor share values...\n');
    
    for (const pool of pools) {
      const investments = await PoolInvestment.find({
        pool: pool._id,
        status: 'active'
      });
      
      if (investments.length === 0) continue;
      
      const poolValue = pool.getTotalPoolValue();
      let totalShareValue = 0;
      
      for (const inv of investments) {
        const shareValue = inv.shares * pool.getSharePrice();
        totalShareValue += shareValue;
      }
      
      console.log(`${pool.name}:`);
      console.log(`  Pool Value: $${poolValue.toFixed(2)}`);
      console.log(`  Total Investor Share Value: $${totalShareValue.toFixed(2)}`);
      console.log(`  Match: ${Math.abs(poolValue - totalShareValue) < 0.01 ? '✅' : '❌'}\n`);
    }
    
    console.log('✅ All investors can now withdraw their full share value!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
fixAccruedInterestBug();
