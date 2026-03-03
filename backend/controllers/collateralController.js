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

module.exports = exports;
