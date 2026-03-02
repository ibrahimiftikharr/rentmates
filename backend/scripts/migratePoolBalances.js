/**
 * Migration Script: Initialize Pool Balance Fields
 * 
 * This script calculates and sets the initial values for:
 * - totalInvested: Sum of all active investments
 * - availableBalance: totalInvested - disbursedLoans
 * - disbursedLoans: Sum of all active/repaying loans
 * 
 * Run once after deploying the new pool balance fields
 */

const mongoose = require('mongoose');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
const Loan = require('../models/loanModel');
require('dotenv').config();

async function migratePoolBalances() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get all pools
    const pools = await InvestmentPool.find({});
    console.log(`\nFound ${pools.length} pools to migrate\n`);

    for (const pool of pools) {
      console.log(`\n📊 Migrating: ${pool.name}`);
      
      // Calculate total invested (all active investments)
      const investments = await PoolInvestment.find({ 
        pool: pool._id, 
        status: 'active' 
      });
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
      
      // Calculate disbursed loans (all active/repaying loans)
      const loans = await Loan.find({
        pool: pool._id,
        status: { $in: ['active', 'repaying'] }
      });
      const disbursedLoans = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
      
      // Calculate available balance
      const availableBalance = totalInvested - disbursedLoans;
      
      // Update pool
      pool.totalInvested = totalInvested;
      pool.disbursedLoans = disbursedLoans;
      pool.availableBalance = availableBalance;
      await pool.save();
      
      console.log(`  ✓ Total Invested: ${totalInvested.toFixed(2)} USDT`);
      console.log(`  ✓ Disbursed Loans: ${disbursedLoans.toFixed(2)} USDT`);
      console.log(`  ✓ Available Balance: ${availableBalance.toFixed(2)} USDT`);
    }

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migratePoolBalances();
