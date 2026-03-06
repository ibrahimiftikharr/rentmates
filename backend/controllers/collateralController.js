const Loan = require('../models/loanModel');
const InvestmentPool = require('../models/investmentPoolModel');
const Student = require('../models/studentModel');
const blockchainService = require('../services/blockchainService');

/**
 * Get smart contract addresses for frontend
 */
exports.getContractAddresses = async (req, res) => {
  try {
    const addresses = blockchainService.getContractAddresses();
    
    res.json({
      success: true,
      contracts: addresses
    });
  } catch (error) {
    console.error('Get contract addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch contract addresses' });
  }
};

/**
 * Get wallet balances (PAXG in wallet + deposited collateral)
 */
exports.getWalletBalances = async (req, res) => {
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Get PAXG balance in wallet
    const paxgBalance = await blockchainService.getPAXGBalance(walletAddress);
    
    // Get deposited collateral
    const depositedCollateral = await blockchainService.getDepositedCollateral(walletAddress);
    
    res.json({
      success: true,
      walletAddress,
      paxgBalance,
      depositedCollateral,
      totalBalance: (parseFloat(paxgBalance) + parseFloat(depositedCollateral)).toFixed(9)
    });
  } catch (error) {
    console.error('Get wallet balances error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balances' });
  }
};

/**
 * Get pending loan details (for collateral deposit page)
 */
exports.getPendingLoan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loanId } = req.params;
    
    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Get loan
    const loan = await Loan.findOne({
      _id: loanId,
      borrower: student._id,
      status: 'collateral_pending'
    }).populate('pool', 'name');
    
    if (!loan) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }
    
    res.json({
      success: true,
      loan: {
        _id: loan._id,
        loanAmount: loan.loanAmount,
        poolName: loan.poolName,
        duration: loan.duration,
        apr: loan.lockedAPR,
        monthlyRepayment: loan.monthlyRepayment,
        totalRepayment: loan.totalRepayment,
        requiredCollateral: loan.requiredCollateral,
        applicationDate: loan.applicationDate,
        expiryTime: loan.applicationDate.getTime() + (5 * 60 * 1000) // 5 minutes from application
      }
    });
  } catch (error) {
    console.error('Get pending loan error:', error);
    res.status(500).json({ error: 'Failed to fetch pending loan' });
  }
};

/**
 * Verify and confirm collateral deposit
 */
exports.confirmCollateralDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loanId, txHash, walletAddress } = req.body;
    
    // Validate input
    if (!loanId || !txHash || !walletAddress) {
      return res.status(400).json({ 
        error: 'Loan ID, transaction hash, and wallet address are required' 
      });
    }
    
    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Get loan
    const loan = await Loan.findOne({
      _id: loanId,
      borrower: student._id,
      status: 'collateral_pending'
    }).populate('pool');
    
    if (!loan) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }
    
    // Check if collateral already deposited
    if (loan.collateralDeposited) {
      return res.status(400).json({ error: 'Collateral already deposited for this loan' });
    }
    
    // Verify transaction on blockchain
    const verification = await blockchainService.verifyDepositTransaction(
      txHash,
      walletAddress,
      loan.requiredCollateral.toString()
    );
    
    if (!verification.success) {
      return res.status(400).json({ 
        error: 'Transaction verification failed',
        details: verification.message 
      });
    }
    
    // Update loan with collateral info
    loan.collateralDeposited = true;
    loan.collateralTxHash = txHash;
    loan.collateralDepositedAt = new Date();
    loan.walletAddress = walletAddress;
    loan.collateralStatus = 'deposited';
    loan.status = 'active'; // Approve loan
    loan.approvalDate = new Date();
    loan.disbursementDate = new Date();
    
    // Calculate maturity date
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + loan.duration);
    loan.maturityDate = maturityDate;
    
    // Generate repayment schedule
    loan.generateRepaymentSchedule();
    
    await loan.save();
    
    // Update pool balance (decrease available balance)
    const InvestmentPool = require('../models/investmentPoolModel');
    const pool = await InvestmentPool.findById(loan.pool);
    if (pool) {
      pool.availableBalance -= loan.loanAmount;
      pool.disbursedLoans += loan.loanAmount;
      await pool.save();
      console.log(`📊 Pool ${pool.name}: Available balance decreased by ${loan.loanAmount} USDT → ${pool.availableBalance} USDT`);
    }
    
    // Update user's off-chain balance (loan disbursement)
    // student variable is already fetched at the beginning of this function
    const User = require('../models/userModel');
    const user = await User.findById(userId);
    if (user) {
      const previousBalance = user.offChainBalance || 0;
      user.offChainBalance += loan.loanAmount;
      await user.save();
      
      // Record transaction for loan disbursement
      const Transaction = require('../models/transactionModel');
      const transaction = new Transaction({
        user: userId,
        type: 'loan_disbursement',
        amount: loan.loanAmount,
        status: 'completed',
        description: `Loan disbursement from ${loan.poolName} (${loan.duration} months at ${loan.lockedAPR}% APR)`,
        balanceAfter: user.offChainBalance,
        txHash: txHash // Reference to the collateral deposit transaction
      });
      await transaction.save();
      
      console.log(`📝 Transaction recorded: Loan disbursement of ${loan.loanAmount} USDT`);
    }
    
    console.log(`✅ Collateral deposited for loan ${loanId}, loan approved and activated`);
    
    // ✅ Emit Socket.IO events for real-time loan approval update
    const io = req.app.get('io');
    if (io) {
      // Notify the student/borrower
      io.to(`user_${userId}`).emit('loan_approved', {
        loanId: loan._id,
        poolName: loan.poolName,
        amount: loan.loanAmount,
        duration: loan.duration,
        apr: loan.lockedAPR,
        timestamp: new Date()
      });

      // Broadcast pool update to all connected users (investors might be interested)
      io.emit('pool_updated', {
        poolId: loan.pool,
        poolName: loan.poolName,
        availableBalance: pool?.availableBalance,
        disbursedLoans: pool?.disbursedLoans,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Collateral deposit confirmed and loan approved',
      loan: {
        _id: loan._id,
        status: loan.status,
        collateralTxHash: loan.collateralTxHash,
        approvalDate: loan.approvalDate,
        disbursementDate: loan.disbursementDate,
        maturityDate: loan.maturityDate,
        nextPaymentDate: loan.nextPaymentDate
      },
      verification: {
        amount: verification.amount,
        blockNumber: verification.blockNumber,
        timestamp: verification.timestamp
      }
    });
    
  } catch (error) {
    console.error('Confirm collateral deposit error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm collateral deposit',
      details: error.message 
    });
  }
};

/**
 * Get all user's collateral deposits
 */
exports.getMyCollateral = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Get all loans with collateral deposited
    const loans = await Loan.find({
      borrower: student._id,
      collateralDeposited: true
    }).select('loanAmount requiredCollateral collateralStatus collateralTxHash collateralDepositedAt walletAddress poolName status')
      .sort({ collateralDepositedAt: -1 });
    
    // Calculate totals
    const totalCollateral = loans.reduce((sum, loan) => sum + loan.requiredCollateral, 0);
    const activeCollateral = loans
      .filter(loan => loan.collateralStatus === 'deposited' && loan.status !== 'completed')
      .reduce((sum, loan) => sum + loan.requiredCollateral, 0);
    
    res.json({
      success: true,
      totalCollateral: Number(totalCollateral.toFixed(9)),
      activeCollateral: Number(activeCollateral.toFixed(9)),
      collateralDeposits: loans.map(loan => ({
        loanId: loan._id,
        loanAmount: loan.loanAmount,
        poolName: loan.poolName,
        requiredCollateral: loan.requiredCollateral,
        collateralStatus: loan.collateralStatus,
        collateralTxHash: loan.collateralTxHash,
        depositedAt: loan.collateralDepositedAt,
        walletAddress: loan.walletAddress,
        loanStatus: loan.status
      }))
    });
  } catch (error) {
    console.error('Get my collateral error:', error);
    res.status(500).json({ error: 'Failed to fetch collateral deposits' });
  }
};

/**
 * Withdraw collateral for a completed loan
 * The collateral will be transferred from the holder contract back to the student's wallet
 */
exports.withdrawCollateral = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loanId } = req.body;
    
    if (!loanId) {
      return res.status(400).json({ error: 'Loan ID is required' });
    }
    
    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Get loan
    const loan = await Loan.findOne({
      _id: loanId,
      borrower: student._id
    }).populate('pool');
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Verify loan is completed
    if (loan.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Loan is not completed yet',
        message: 'You can only withdraw collateral after completing all loan payments'
      });
    }
    
    // Verify collateral is available for withdrawal
    if (loan.collateralStatus !== 'returned') {
      return res.status(400).json({ 
        error: 'Collateral is not available for withdrawal',
        message: 'Collateral must be marked as returned before withdrawal'
      });
    }
    
    // Check if collateral was already withdrawn
    if (loan.collateralStatus === 'withdrawn') {
      return res.status(400).json({ 
        error: 'Collateral already withdrawn',
        message: 'You have already withdrawn your collateral for this loan'
      });
    }
    
    // Get the wallet address used for deposit
    const walletAddress = loan.walletAddress;
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'No wallet address found',
        message: 'Original deposit wallet address not found'
      });
    }
    
    // IMPORTANT: In production, this would trigger an admin-approved blockchain transaction
    // to transfer PAXG from the collateral holder back to the student's wallet.
    // For now, we'll mark it as withdrawn and create a notification.
    // The actual blockchain transfer would need to be done by an administrator with
    // the private key to the collateral holder contract.
    
    console.log(`💎 Processing collateral withdrawal for loan ${loanId}`);
    console.log(`   Student wallet: ${walletAddress}`);
    console.log(`   Collateral amount: ${loan.requiredCollateral} PAXG`);
    
    // Mark collateral as withdrawn in the database
    loan.collateralStatus = 'withdrawn';
    loan.notes = (loan.notes || '') + `\n[${new Date().toISOString()}] Collateral withdrawal requested by student. Amount: ${loan.requiredCollateral} PAXG to wallet ${walletAddress}`;
    await loan.save();
    
    // Create a notification for the student
    const Notification = require('../models/notificationModel');
    await Notification.create({
      recipient: student._id,
      recipientModel: 'Student',
      type: 'loan_completed',
      title: 'Collateral Withdrawal Initiated',
      message: `Your collateral withdrawal request for ${loan.requiredCollateral.toFixed(4)} PAXG has been initiated. The funds will be transferred to your wallet (${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 8)}) shortly.`,
      relatedId: loan._id,
      relatedModel: 'Loan',
      metadata: {
        loanId: loan._id,
        collateralAmount: loan.requiredCollateral,
        walletAddress: walletAddress
      }
    });
    
    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('collateral_withdrawn', {
        loanId: loan._id,
        collateralAmount: loan.requiredCollateral,
        walletAddress: walletAddress,
        timestamp: new Date()
      });
    }
    
    console.log(`✅ Collateral withdrawal marked for loan ${loanId}`);
    
    res.json({
      success: true,
      message: 'Collateral withdrawal initiated',
      collateral: {
        amount: loan.requiredCollateral,
        walletAddress: walletAddress,
        status: 'withdrawn'
      }
    });
    
  } catch (error) {
    console.error('Withdraw collateral error:', error);
    res.status(500).json({ 
      error: 'Failed to withdraw collateral',
      details: error.message 
    });
  }
};

/**
 * Get collateral status for a specific loan
 */
exports.getCollateralStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loanId } = req.params;
    
    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Get loan
    const loan = await Loan.findOne({
      _id: loanId,
      borrower: student._id
    });
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Calculate PAXG to USDT value
    const { getPAXGPrice } = require('../services/coinMarketCapService');
    const paxgPrice = await getPAXGPrice();
    const collateralValueUSDT = loan.requiredCollateral * paxgPrice;
    
    res.json({
      success: true,
      collateral: {
        amount: loan.requiredCollateral,
        valueUSDT: collateralValueUSDT,
        status: loan.collateralStatus,
        deposited: loan.collateralDeposited,
        depositedAt: loan.collateralDepositedAt,
        txHash: loan.collateralTxHash,
        walletAddress: loan.walletAddress,
        canWithdraw: loan.status === 'completed' && loan.collateralStatus === 'returned'
      },
      loan: {
        id: loan._id,
        status: loan.status,
        paymentsCompleted: loan.paymentsCompleted,
        totalPayments: loan.repaymentSchedule.length,
        amountRepaid: loan.amountRepaid,
        remainingBalance: loan.remainingBalance
      }
    });
    
  } catch (error) {
    console.error('Get collateral status error:', error);
    res.status(500).json({ error: 'Failed to fetch collateral status' });
  }
};

module.exports = exports;
