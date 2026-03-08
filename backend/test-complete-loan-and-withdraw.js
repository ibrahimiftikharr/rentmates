/**
 * Test complete loan repayment and collateral withdrawal workflow
 * This test:
 * 1. Finds an active loan
 * 2. Marks all installments as paid to complete the loan
 * 3. Verifies collateral is marked as 'returned'
 * 4. Tests that the withdrawal button appears
 */

const mongoose = require('mongoose');
const Loan = require('./models/loanModel');
const Student = require('./models/studentModel');
const User = require('./models/userModel');
const { returnCollateral } = require('./services/collateralLiquidationService');

// Connect to MongoDB - NOTE: Database name is case-sensitive!
mongoose.connect('mongodb://localhost:27017/Rentmates');

// Wait for connection
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function testCompleteWorkflow(loanIdArg) {
  console.log('\n🧪 Testing Complete Loan Repayment & Collateral Withdrawal Workflow\n');
  
  try {
    // Debug: Show connection info
    console.log('🔌 Database Connection Info:');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    
    // Debug: List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📂 Found ${collections.length} collection(s) in database:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Debug: Check Loan model collection name
    console.log(`\n🔍 Looking for loans in collection: "${Loan.collection.name}"`);
    
    let loan;
    
    // If loan ID provided as argument, use that
    if (loanIdArg) {
      console.log(`\n🎯 Using specified loan ID: ${loanIdArg}\n`);
      loan = await Loan.findById(loanIdArg).populate('borrower');
      
      if (!loan) {
        console.log(`❌ Loan with ID ${loanIdArg} not found.\n`);
        process.exit(1);
      }
      
      console.log('📋 Found loan:', {
        loanId: loan._id,
        amount: loan.loanAmount,
        poolName: loan.poolName,
        status: loan.status,
        collateralStatus: loan.collateralStatus,
        collateralDeposited: loan.collateralDeposited,
        paymentsCompleted: loan.paymentsCompleted,
        totalPayments: loan.duration
      });
    } else {
      // Otherwise, search for an active loan
    // First, let's see what loans exist
    console.log('\n🔍 Checking all loans in database...\n');
    const allLoans = await Loan.find({}).populate('borrower').limit(10);
    
    if (allLoans.length === 0) {
      console.log('❌ No loans found in database at all.');
      console.log('   Please create a loan first via the frontend.\n');
      process.exit(1);
    }
    
    console.log(`Found ${allLoans.length} loan(s) in database:`);
    allLoans.forEach((l, index) => {
      console.log(`\n${index + 1}. Loan ID: ${l._id}`);
      console.log(`   Status: ${l.status}`);
      console.log(`   Collateral Status: ${l.collateralStatus}`);
      console.log(`   Collateral Deposited: ${l.collateralDeposited}`);
      console.log(`   Amount: $${l.loanAmount} USDT`);
      console.log(`   Pool: ${l.poolName}`);
      console.log(`   Payments: ${l.paymentsCompleted}/${l.duration}`);
    });
    
    // Find an active loan
    loan = await Loan.findOne({ 
      status: { $in: ['active', 'repaying'] },
      collateralDeposited: true
    }).populate('borrower');
    
    if (!loan) {
      console.log('\n❌ No ACTIVE loan with deposited collateral found.');
      console.log('   Looking for: status = "active" or "repaying" AND collateralDeposited = true');
      console.log('\n💡 Suggestions:');
      console.log('   1. Complete the collateral deposit for a pending loan');
      console.log('   2. Or manually specify a loan ID to test with\n');
      process.exit(1);
    }
    
    console.log('\n✅ Found active loan with deposited collateral!');
    } // End of if-else block for finding loan
    
    console.log('\n📋 Loan Details:', {
      loanId: loan._id,
      borrower: loan.borrower?.user,
      amount: loan.loanAmount,
      poolName: loan.poolName,
      status: loan.status,
      collateralStatus: loan.collateralStatus,
      paymentsCompleted: loan.paymentsCompleted,
      totalPayments: loan.duration
    });
    
    // Mark all installments as paid
    console.log('\n💰 Marking all installments as paid...');
    
    let unpaidCount = 0;
    loan.repaymentSchedule.forEach((installment, index) => {
      if (installment.status !== 'paid') {
        installment.status = 'paid';
        installment.paidAt = new Date();
        installment.paidAmount = installment.amount;
        
        loan.amountRepaid += installment.amount;
        loan.paymentsCompleted += 1;
        unpaidCount++;
        
        console.log(`   ✓ Installment ${installment.installmentNumber}: $${installment.amount.toFixed(2)} - Marked as PAID`);
      }
    });
    
    if (unpaidCount === 0) {
      console.log('   ℹ️  All installments were already paid');
    }
    
    // Mark loan as completed
    loan.status = 'completed';
    loan.remainingBalance = 0;
    loan.nextPaymentDate = null;
    
    await loan.save();
    console.log('\n✅ Loan marked as COMPLETED');
    
    // Call returnCollateral service
    console.log('\n🔓 Calling returnCollateral service...');
    await returnCollateral(loan._id);
    
    // Reload loan to check updated status
    const updatedLoan = await Loan.findById(loan._id);
    
    console.log('\n📊 Final Loan Status:');
    console.log('   Status:', updatedLoan.status);
    console.log('   Collateral Status:', updatedLoan.collateralStatus);
    console.log('   Amount Repaid:', `$${updatedLoan.amountRepaid.toFixed(2)} USDT`);
    console.log('   Payments Completed:', `${updatedLoan.paymentsCompleted}/${updatedLoan.duration}`);
    console.log('   Remaining Balance:', `$${updatedLoan.remainingBalance.toFixed(2)} USDT`);
    
    // Check if withdrawal button should appear
    const shouldShowWithdrawal = 
      updatedLoan.status === 'completed' && 
      updatedLoan.collateralStatus === 'returned' &&
      updatedLoan.collateralStatus !== 'withdrawn';
    
    console.log('\n🎯 Withdrawal Button Status:');
    console.log('   Should Appear:', shouldShowWithdrawal ? '✅ YES' : '❌ NO');
    console.log('   Condition Check:');
    console.log('      - Loan completed:', updatedLoan.status === 'completed' ? '✅' : '❌');
    console.log('      - Collateral returned:', updatedLoan.collateralStatus === 'returned' ? '✅' : '❌');
    console.log('      - Not withdrawn:', updatedLoan.collateralStatus !== 'withdrawn' ? '✅' : '❌');
    
    if (shouldShowWithdrawal) {
      console.log('\n✅ TEST PASSED: Withdrawal button should now appear on frontend!');
      console.log(`   Collateral Amount: ${updatedLoan.requiredCollateral.toFixed(9)} PAXG`);
      console.log(`   Borrower can withdraw from: /student/loan-center`);
    } else {
      console.log('\n❌ TEST FAILED: Withdrawal button will not appear');
      console.log('   Check the status values above');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Login to frontend as the borrower');
    console.log('   2. Navigate to Loan Center page');
    console.log('   3. Look for green "Collateral Available for Withdrawal" card');
    console.log('   4. Click "Withdraw Collateral" button');
    console.log('   5. Confirm MetaMask transaction to receive PAXG back\n');
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

// Get loan ID from command line argument if provided
const loanIdArg = process.argv[2];

// Wait for connection before running test
mongoose.connection.once('open', async () => {
  if (loanIdArg) {
    console.log(`\n📌 Running test with specific loan ID: ${loanIdArg}`);
    await testCompleteWorkflow(loanIdArg);
  } else {
    console.log('\n📌 Running test (will search for an active loan automatically)');
    console.log('   Or provide loan ID: node test-complete-loan-and-withdraw.js <loanId>\n');
    await testCompleteWorkflow();
  }
});
