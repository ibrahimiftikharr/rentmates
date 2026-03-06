/**
 * Test Script for Collateral Liquidation System
 * Run with: node test-collateral-liquidation.js
 */

const mongoose = require('mongoose');
const Loan = require('./models/loanModel');
const { checkOverduePayments } = require('./jobs/loanMonitoringJob');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Rentmates';

async function setupTestLoan() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find an active loan or create a test scenario
    const loan = await Loan.findOne({ 
      status: { $in: ['active', 'repaying'] },
      collateralDeposited: true 
    });

    if (!loan) {
      console.log('❌ No active loan found. Create a loan first.');
      process.exit(1);
    }

    console.log(`\n📋 Found loan: ${loan._id}`);
    console.log(`   Status: ${loan.status}`);
    console.log(`   Collateral: ${loan.requiredCollateral} PAXG`);
    console.log(`   Pool: ${loan.poolName}`);

    // Find first unpaid installment
    const unpaidInstallment = loan.repaymentSchedule.find(
      inst => inst.status === 'pending' || inst.status === 'overdue'
    );

    if (!unpaidInstallment) {
      console.log('❌ No unpaid installments found. All payments completed.');
      process.exit(1);
    }

    console.log(`\n📅 Current installment #${unpaidInstallment.installmentNumber}`);
    console.log(`   Due date: ${unpaidInstallment.dueDate}`);
    console.log(`   Status: ${unpaidInstallment.status}`);

    // Ask user to choose test scenario
    console.log('\n\n🧪 TEST SCENARIOS:');
    console.log('Choose a scenario to test:\n');
    console.log('1. Test Payment Reminder (1-3 days overdue)');
    console.log('2. Test Urgent Warning (4-7 days overdue)');
    console.log('3. Test Collateral Liquidation (8+ days overdue)');
    console.log('4. Test Loan Completion & Collateral Return\n');

    const scenario = process.argv[2] || '1';
    
    switch(scenario) {
      case '1':
        await testPaymentReminder(loan, unpaidInstallment);
        break;
      case '2':
        await testUrgentWarning(loan, unpaidInstallment);
        break;
      case '3':
        await testLiquidation(loan, unpaidInstallment);
        break;
      case '4':
        await testLoanCompletion(loan);
        break;
      default:
        console.log('❌ Invalid scenario');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function testPaymentReminder(loan, installment) {
  console.log('\n🧪 SCENARIO 1: Payment Reminder (3 days overdue)');
  console.log('================================================\n');

  // Set due date to 3 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  installment.dueDate = threeDaysAgo;
  installment.status = 'overdue';
  await loan.save();

  console.log('✓ Set installment due date to 3 days ago');
  console.log(`  New due date: ${installment.dueDate}`);

  // Trigger check
  console.log('\n⏳ Triggering overdue payment check...\n');
  await checkOverduePayments(null);

  console.log('\n✅ Test complete!');
  console.log('Check:');
  console.log('  1. Console logs for "📧 Reminder sent"');
  console.log('  2. Student email inbox for reminder');
  console.log('  3. In-app notifications for student');
  console.log('  4. Loan status should still be active\n');
}

async function testUrgentWarning(loan, installment) {
  console.log('\n🧪 SCENARIO 2: Urgent Warning (6 days overdue)');
  console.log('================================================\n');

  // Set due date to 6 days ago
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  
  installment.dueDate = sixDaysAgo;
  installment.status = 'overdue';
  await loan.save();

  console.log('✓ Set installment due date to 6 days ago');
  console.log(`  New due date: ${installment.dueDate}`);

  // Trigger check
  console.log('\n⏳ Triggering overdue payment check...\n');
  await checkOverduePayments(null);

  console.log('\n✅ Test complete!');
  console.log('Check:');
  console.log('  1. Console logs for "URGENT" reminder');
  console.log('  2. Student email with urgent warning');
  console.log('  3. Days remaining should be 1');
  console.log('  4. Loan status should still be active\n');
}

async function testLiquidation(loan, installment) {
  console.log('\n🧪 SCENARIO 3: Collateral Liquidation (8 days overdue)');
  console.log('======================================================\n');

  // Set due date to 8 days ago (past grace period)
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  
  installment.dueDate = eightDaysAgo;
  installment.status = 'overdue';
  await loan.save();

  console.log('✓ Set installment due date to 8 days ago');
  console.log(`  New due date: ${installment.dueDate}`);
  console.log('  Grace period: EXCEEDED ⚠️');

  // Trigger check
  console.log('\n⏳ Triggering overdue payment check...\n');
  console.log('🔥 LIQUIDATION SHOULD TRIGGER NOW...\n');
  
  await checkOverduePayments(null);

  // Refetch loan to see changes
  const updatedLoan = await Loan.findById(loan._id);

  console.log('\n✅ Test complete!');
  console.log('\nCheck Database Changes:');
  console.log(`  Loan status: ${updatedLoan.status} (should be "defaulted")`);
  console.log(`  Collateral status: ${updatedLoan.collateralStatus} (should be "liquidated")`);
  console.log('\nCheck Notifications:');
  console.log('  1. Student: Collateral liquidated notice');
  console.log('  2. Investors: Default notification with recovery amounts');
  console.log('  3. Email sent to all parties');
  console.log('\nCheck Pool Balance:');
  console.log('  Run: db.investmentpools.findOne({ name: "' + loan.poolName + '" })');
  console.log('  Available balance should have increased\n');
}

async function testLoanCompletion(loan) {
  console.log('\n🧪 SCENARIO 4: Loan Completion & Collateral Return');
  console.log('===================================================\n');

  // Mark all installments as paid
  loan.repaymentSchedule.forEach(inst => {
    inst.status = 'paid';
    inst.paidAt = new Date();
    inst.paidAmount = inst.amount;
  });

  loan.status = 'completed';
  loan.paymentsCompleted = loan.repaymentSchedule.length;
  loan.amountRepaid = loan.totalRepayment;
  loan.remainingBalance = 0;
  
  await loan.save();

  console.log('✓ Marked all installments as paid');
  console.log('✓ Set loan status to completed');

  // Trigger check to mark collateral as available
  console.log('\n⏳ Triggering loan monitoring check...\n');
  await checkOverduePayments(null);

  // Refetch loan
  const updatedLoan = await Loan.findById(loan._id);

  console.log('\n✅ Test complete!');
  console.log('\nDatabase State:');
  console.log(`  Loan status: ${updatedLoan.status}`);
  console.log(`  Collateral status: ${updatedLoan.collateralStatus} (should be "returned")`);
  console.log('\nCheck Frontend:');
  console.log('  1. Go to Loan Center page');
  console.log('  2. Look for green "Collateral Available" card');
  console.log('  3. "Withdraw Collateral" button should be enabled');
  console.log('\nCheck Notifications:');
  console.log('  1. Student should receive completion notification');
  console.log('  2. Email sent about collateral availability\n');
}

// Run the setup
console.log('========================================');
console.log('🧪 COLLATERAL LIQUIDATION TEST SCRIPT');
console.log('========================================\n');

console.log('Usage: node test-collateral-liquidation.js [scenario]');
console.log('Scenarios: 1=Reminder, 2=Warning, 3=Liquidation, 4=Completion\n');

setupTestLoan();
