/**
 * Test Script for Collateral Withdrawal
 * Run with: node test-withdrawal.js YOUR_LOAN_ID
 */

const mongoose = require('mongoose');
const Loan = require('./models/loanModel');
const Student = require('./models/studentModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Rentmates';

async function testWithdrawal() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const loanId = process.argv[2];
    
    if (!loanId) {
      console.log('Usage: node test-withdrawal.js <loanId>');
      console.log('\nTo find a loan ID, run this in MongoDB:');
      console.log('  db.loans.findOne({ status: "active" }, { _id: 1 })');
      process.exit(1);
    }

    const loan = await Loan.findById(loanId).populate('borrower');
    
    if (!loan) {
      console.log('❌ Loan not found');
      process.exit(1);
    }

    console.log('📋 Loan Details:');
    console.log(`   ID: ${loan._id}`);
    console.log(`   Status: ${loan.status}`);
    console.log(`   Collateral Status: ${loan.collateralStatus}`);
    console.log(`   Collateral Amount: ${loan.requiredCollateral} PAXG`);
    console.log(`   Pool: ${loan.poolName}`);
    console.log(`   Payments: ${loan.paymentsCompleted}/${loan.repaymentSchedule.length}\n`);

    if (loan.status === 'completed' && loan.collateralStatus === 'returned') {
      console.log('✅ Loan is eligible for withdrawal!');
      console.log('\nTest on frontend:');
      console.log('  1. Login as the borrower');
      console.log('  2. Go to Loan Center page');
      console.log('  3. You should see the green withdrawal card');
      console.log('  4. Click "Withdraw Collateral"');
      console.log('  5. Check toast notification and in-app notifications\n');
    } else if (loan.status !== 'completed') {
      console.log('❌ Cannot withdraw - loan not completed');
      console.log('\nTo make it ready for withdrawal:');
      console.log('  1. Run: node test-collateral-liquidation.js 4');
      console.log('  2. Or pay all remaining installments\n');
    } else if (loan.collateralStatus !== 'returned') {
      console.log('❌ Collateral not marked as returned');
      console.log(`   Current status: ${loan.collateralStatus}`);
      console.log('\nTo fix, run in MongoDB:');
      console.log(`  db.loans.updateOne({ _id: ObjectId("${loan._id}") }, { $set: { collateralStatus: "returned" } })\n`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testWithdrawal();
