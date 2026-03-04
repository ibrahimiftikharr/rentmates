const mongoose = require('mongoose');
const Loan = require('../models/loanModel');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
const Student = require('../models/studentModel');
const QueuedLoanRequest = require('../models/queuedLoanRequestModel');
const { convertUSDTtoPAXG, getPAXGPriceWithTimestamp } = require('../services/coinMarketCapService');

/**
 * Calculate monthly repayment using amortized loan formula
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 * 
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (as percentage, e.g., 12.28)
 * @param {number} months - Loan duration in months
 * @returns {number} Monthly payment amount
 */
function calculateMonthlyRepayment(principal, annualRate, months) {
  const monthlyRate = annualRate / 100 / 12; // Convert annual % to monthly decimal
  
  // Handle edge case: 0% interest rate
  if (monthlyRate === 0) {
    return principal / months;
  }
  
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return principal * (numerator / denominator);
}

/**
 * Calculate required collateral in PAXG
 * Collateral in USDT = Loan Amount / LTV
 * Then convert USDT to PAXG using live exchange rate
 * 
 * @param {number} loanAmount - Loan amount in USDT
 * @param {number} ltv - Loan-to-Value ratio (e.g., 0.7)
 * @returns {Promise<number>} Required collateral amount in PAXG
 */
async function calculateCollateral(loanAmount, ltv) {
  const collateralInUSDT = loanAmount / ltv;
  const collateralInPAXG = await convertUSDTtoPAXG(collateralInUSDT);
  return collateralInPAXG;
}

/**
 * Check loan availability across all pools
 * Returns all 3 pools with eligibility status
 */
exports.checkLoanAvailability = async (req, res) => {
  try {
    const { loanAmount, duration, purpose } = req.query;
    const userId = req.user.id;

    // Validate inputs
    if (!loanAmount || !duration) {
      return res.status(400).json({ 
        error: 'Loan amount and duration are required' 
      });
    }

    const requestedAmount = parseFloat(loanAmount);
    const requestedDuration = parseInt(duration);

    if (requestedAmount < 1 || requestedAmount > 1000) {
      return res.status(400).json({ 
        error: 'Loan amount must be between 1 and 1000 USDT' 
      });
    }

    if (![6, 9, 12].includes(requestedDuration)) {
      return res.status(400).json({ 
        error: 'Duration must be 6, 9, or 12 months' 
      });
    }
    
    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Clean up expired pending loans (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deleteResult = await Loan.deleteMany({
      borrower: student._id,
      status: 'collateral_pending',
      applicationDate: { $lt: fiveMinutesAgo }
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deleteResult.deletedCount} expired loan(s) for user ${userId}`);
    }

    // Check if student has an active loan
    const activeLoan = await Loan.findOne({
      borrower: student._id,
      status: { $in: ['active', 'repaying', 'collateral_pending'] }
    });

    if (activeLoan) {
      return res.status(400).json({
        error: 'You already have an active loan',
        hasActiveLoan: true,
        activeLoan: {
          amount: activeLoan.loanAmount,
          poolName: activeLoan.poolName,
          status: activeLoan.status
        }
      });
    }

    // Get all active investment pools
    const pools = await InvestmentPool.find({ isActive: true }).sort({ ltv: 1 });

    // Calculate availability for each pool
    const poolsWithAvailability = await Promise.all(pools.map(async (pool) => {
      // Use real-time pool balance (much more efficient)
      const currentPoolSize = pool.totalInvested;
      const availableCapital = pool.availableBalance;
      
      // Calculate remaining capacity for new loans
      const remainingCapacity = pool.maxCapital - currentPoolSize;

      // Calculate APR (same as expectedROI from pool)
      const apr = pool.calculateROI();

      // Calculate monthly repayment using POOL's duration, not requested duration
      const monthlyRepaymentRaw = calculateMonthlyRepayment(
        requestedAmount,
        apr,
        pool.durationMonths
      );
      
      // Round monthly repayment first
      const monthlyRepayment = Number(monthlyRepaymentRaw.toFixed(2));
      
      // Calculate total repayment using ROUNDED monthly repayment
      const totalRepayment = monthlyRepayment * pool.durationMonths;

      // Calculate required collateral in USDT (for frontend dynamic conversion)
      const requiredCollateralUSDT = requestedAmount / pool.ltv;
      
      // Also calculate in PAXG for backward compatibility
      const requiredCollateral = await calculateCollateral(requestedAmount, pool.ltv);

      // Check eligibility conditions
      // Pool must have enough invested capital to fund the loan
      const hasEnoughCapital = availableCapital >= requestedAmount;
      const durationMatches = pool.durationMonths === requestedDuration;
      const isEligible = hasEnoughCapital && durationMatches;

      // Determine button text based on eligibility
      let buttonText = 'Apply to Pool';
      let disableReason = null;

      if (!hasEnoughCapital) {
        buttonText = 'Insufficient Pool Capital';
        disableReason = 'insufficient_capital';
      } else if (!durationMatches) {
        buttonText = `Duration Mismatch (Pool: ${pool.durationMonths} months)`;
        disableReason = 'duration_mismatch';
      }

      return {
        _id: pool._id,
        name: pool.name,
        description: pool.description,
        ltv: pool.ltv,
        durationMonths: pool.durationMonths,
        apr: Number(apr.toFixed(2)),
        availableCapital: Number(availableCapital.toFixed(2)),
        currentPoolSize: Number(currentPoolSize.toFixed(2)),
        remainingCapacity: Number(remainingCapacity.toFixed(2)),
        maxCapital: pool.maxCapital,
        monthlyRepayment: monthlyRepayment,
        requiredCollateralUSDT: Number(requiredCollateralUSDT.toFixed(2)),
        requiredCollateral: Number(requiredCollateral.toFixed(9)),
        totalRepayment: totalRepayment,
        isEligible,
        buttonText,
        disableReason,
        hasEnoughCapital,
        durationMatches
      };
    }));

    res.json({
      success: true,
      requestedAmount,
      requestedDuration,
      purpose: purpose || 'Not specified',
      pools: poolsWithAvailability,
      hasEligiblePools: poolsWithAvailability.some(p => p.isEligible)
    });

  } catch (error) {
    console.error('Check loan availability error:', error);
    res.status(500).json({ error: 'Failed to check loan availability' });
  }
};

/**
 * Submit loan application
 */
exports.applyForLoan = async (req, res) => {
  try {
    const { poolId, loanAmount, duration, purpose } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!poolId || !loanAmount || !duration || !purpose) {
      return res.status(400).json({ 
        error: 'All fields are required (poolId, loanAmount, duration, purpose)' 
      });
    }

    const requestedAmount = parseFloat(loanAmount);
    const requestedDuration = parseInt(duration);

    if (requestedAmount < 1 || requestedAmount > 1000) {
      return res.status(400).json({ 
        error: 'Loan amount must be between 1 and 1000 USDT' 
      });
    }
    
    // Clean up expired pending loans (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Loan.deleteMany({
      status: 'collateral_pending',
      applicationDate: { $lt: fiveMinutesAgo }
    });
    console.log('🧹 Cleaned up expired pending loans');

    // Check if student exists
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Check for active loans
    const activeLoan = await Loan.findOne({
      borrower: student._id,
      status: { $in: ['active', 'repaying', 'collateral_pending'] }
    });

    if (activeLoan) {
      return res.status(400).json({
        error: 'You already have an active loan. Please complete it before applying for a new one.'
      });
    }

    // Get pool details
    const pool = await InvestmentPool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Investment pool not found' });
    }

    // Check available pool balance (real-time)
    if (pool.availableBalance < requestedAmount) {
      return res.status(400).json({
        error: 'Insufficient pool capital to fund this loan',
        availableCapital: Number(pool.availableBalance.toFixed(2)),
        requestedAmount
      });
    }

    // Validate duration match
    if (pool.durationMonths !== requestedDuration) {
      return res.status(400).json({
        error: `Duration mismatch. This pool requires ${pool.durationMonths} months, but you requested ${requestedDuration} months.`
      });
    }

    // Calculate loan terms
    const apr = pool.calculateROI();
    const monthlyRepaymentRaw = calculateMonthlyRepayment(requestedAmount, apr, requestedDuration);
    
    // Round monthly repayment first
    const monthlyRepayment = Number(monthlyRepaymentRaw.toFixed(2));
    
    // Calculate total repayment using ROUNDED monthly repayment
    const totalRepayment = monthlyRepayment * requestedDuration;
    
    const requiredCollateral = await calculateCollateral(requestedAmount, pool.ltv);

    // Create loan application
    const loan = new Loan({
      borrower: student._id,
      loanAmount: requestedAmount,
      purpose,
      duration: requestedDuration,
      pool: poolId,
      poolName: pool.name,
      lockedAPR: apr,
      lockedLTV: pool.ltv,
      monthlyRepayment: monthlyRepayment,
      totalRepayment: totalRepayment,
      requiredCollateral: Number(requiredCollateral.toFixed(9)),
      remainingBalance: totalRepayment,
      status: 'collateral_pending',
      applicationDate: new Date()
    });

    await loan.save();

    res.json({
      success: true,
      message: 'Loan application created successfully. Please proceed to deposit collateral.',
      loan: {
        _id: loan._id,
        loanAmount: loan.loanAmount,
        poolName: loan.poolName,
        duration: loan.duration,
        apr: loan.lockedAPR,
        monthlyRepayment: loan.monthlyRepayment,
        totalRepayment: loan.totalRepayment,
        requiredCollateral: loan.requiredCollateral,
        status: loan.status,
        expiryTime: Date.now() + (5 * 60 * 1000) // 5 minutes from now
      }
    });

  } catch (error) {
    console.error('Apply for loan error:', error);
    res.status(500).json({ error: 'Failed to process loan application' });
  }
};

/**
 * Get student's loan applications
 */
exports.getMyLoans = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    // Clean up expired pending loans before fetching
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deleteResult = await Loan.deleteMany({
      borrower: student._id,
      status: 'collateral_pending',
      applicationDate: { $lt: fiveMinutesAgo }
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deleteResult.deletedCount} expired loan(s) for user ${userId}`);
    }

    const loans = await Loan.find({ borrower: student._id })
      .populate('pool', 'name ltv durationMonths')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      loans
    });

  } catch (error) {
    console.error('Get my loans error:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

/**
 * Get loan details by ID
 */
exports.getLoanById = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const loan = await Loan.findOne({ 
      _id: loanId, 
      borrower: student._id 
    }).populate('pool', 'name ltv durationMonths');

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json({
      success: true,
      loan
    });

  } catch (error) {
    console.error('Get loan by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch loan details' });
  }
};

/**
 * Cancel loan application (only if collateral not deposited)
 */
exports.cancelLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const loan = await Loan.findOne({ 
      _id: loanId, 
      borrower: student._id 
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.collateralDeposited) {
      return res.status(400).json({ 
        error: 'Cannot cancel loan after collateral has been deposited' 
      });
    }

    if (!['pending', 'collateral_pending'].includes(loan.status)) {
      return res.status(400).json({ 
        error: 'Can only cancel loans in pending status' 
      });
    }

    loan.status = 'cancelled';
    loan.updatedAt = new Date();
    await loan.save();

    res.json({
      success: true,
      message: 'Loan application cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel loan error:', error);
    res.status(500).json({ error: 'Failed to cancel loan' });
  }
};

/**
 * Get current PAXG price for frontend polling
 * Used to display real-time collateral conversion
 */
exports.getPAXGPrice = async (req, res) => {
  try {
    const { paxgPrice, timestamp } = await getPAXGPriceWithTimestamp();
    
    res.json({
      success: true,
      paxgPrice,
      timestamp,
      currency: 'USDT'
    });

  } catch (error) {
    console.error('Get PAXG price error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch PAXG price',
      fallbackPrice: 2000 // Provide fallback in response
    });
  }
};

/**
 * Queue a loan request when no matching pools are available
 * This request will be shown in Investor Analytics as investment opportunity
 */
exports.queueLoanRequest = async (req, res) => {
  try {
    const { loanAmount, duration, purpose, maxAcceptableAPR, preferredRiskLevel, attemptedPools } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!loanAmount || !duration || !purpose) {
      return res.status(400).json({ 
        error: 'Loan amount, duration, and purpose are required' 
      });
    }

    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Check if student already has a similar queued request (within last 7 days)
    const recentQueuedRequest = await QueuedLoanRequest.findOne({
      student: student._id,
      status: 'queued',
      requestedAmount: loanAmount,
      duration: duration,
      requestedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (recentQueuedRequest) {
      return res.status(400).json({
        error: 'You already have a similar loan request in the queue',
        existingRequest: {
          id: recentQueuedRequest._id,
          requestedAt: recentQueuedRequest.requestedAt
        }
      });
    }

    // Create queued loan request
    const queuedRequest = new QueuedLoanRequest({
      student: student._id,
      requestedAmount: parseFloat(loanAmount),
      duration: parseInt(duration),
      purpose: purpose,
      maxAcceptableAPR: maxAcceptableAPR ? parseFloat(maxAcceptableAPR) : null,
      preferredRiskLevel: preferredRiskLevel || 'any',
      attemptedPools: attemptedPools || [],
      status: 'queued'
    });

    // Calculate priority score
    queuedRequest.calculatePriorityScore();
    
    await queuedRequest.save();

    // Emit Socket.IO event to notify investors
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('analytics_updated', {
        type: 'new_queued_request',
        data: {
          requestId: queuedRequest._id,
          amount: queuedRequest.requestedAmount,
          duration: queuedRequest.duration,
          purpose: queuedRequest.purpose
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Your loan request has been queued. You will be notified when a suitable pool becomes available.',
      queuedRequest: {
        id: queuedRequest._id,
        requestedAmount: queuedRequest.requestedAmount,
        duration: queuedRequest.duration,
        purpose: queuedRequest.purpose,
        requestedAt: queuedRequest.requestedAt,
        expiresAt: queuedRequest.expiresAt
      }
    });
  } catch (error) {
    console.error('Queue loan request error:', error);
    res.status(500).json({ error: 'Failed to queue loan request' });
  }
};

/**
 * Get student's queued loan requests
 */
exports.getMyQueuedRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Get all queued requests for this student
    const queuedRequests = await QueuedLoanRequest.find({
      student: student._id,
      status: { $in: ['queued', 'matched'] }
    }).sort({ requestedAt: -1 });

    res.json({
      success: true,
      queuedRequests: queuedRequests
    });
  } catch (error) {
    console.error('Get queued requests error:', error);
    res.status(500).json({ error: 'Failed to fetch queued requests' });
  }
};

/**
 * Cancel a queued loan request
 */
exports.cancelQueuedRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Get student profile
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Find and update the request
    const queuedRequest = await QueuedLoanRequest.findOne({
      _id: requestId,
      student: student._id
    });

    if (!queuedRequest) {
      return res.status(404).json({ error: 'Queued request not found' });
    }

    queuedRequest.status = 'cancelled';
    await queuedRequest.save();

    // Emit Socket.IO event
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('analytics_updated', {
        type: 'queued_request_cancelled',
        data: { requestId }
      });
    }

    res.json({
      success: true,
      message: 'Queued loan request cancelled'
    });
  } catch (error) {
    console.error('Cancel queued request error:', error);
    res.status(500).json({ error: 'Failed to cancel queued request' });
  }
};

module.exports = exports;
