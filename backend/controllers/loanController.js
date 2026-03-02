const mongoose = require('mongoose');
const Loan = require('../models/loanModel');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
const Student = require('../models/studentModel');
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

    // Check if student has an active loan
    const activeLoan = await Loan.findOne({
      borrower: userId,
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
      // Get all active investments in this pool
      const investments = await PoolInvestment.find({ 
        pool: pool._id, 
        status: 'active' 
      });

      // Calculate current pool size (total capital IN the pool)
      const currentPoolSize = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
      
      // Available capital = same as pool size (total invested capital)
      const availableCapital = currentPoolSize;
      
      // Calculate remaining capacity for new loans
      const remainingCapacity = pool.maxCapital - currentPoolSize;

      // Calculate APR (same as expectedROI from pool)
      const apr = pool.calculateROI();

      // Calculate monthly repayment using POOL's duration, not requested duration
      const monthlyRepayment = calculateMonthlyRepayment(
        requestedAmount,
        apr,
        pool.durationMonths
      );

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
        monthlyRepayment: Number(monthlyRepayment.toFixed(2)),
        requiredCollateralUSDT: Number(requiredCollateralUSDT.toFixed(2)),
        requiredCollateral: Number(requiredCollateral.toFixed(9)),
        totalRepayment: Number((monthlyRepayment * pool.durationMonths).toFixed(2)),
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
      pools: poolsWithAvailability
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

    // Check if student exists
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Check for active loans
    const activeLoan = await Loan.findOne({
      borrower: userId,
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

    // Calculate pool capacity
    const investments = await PoolInvestment.find({ 
      pool: poolId, 
      status: 'active' 
    });
    const currentPoolSize = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);

    // Validate pool has enough capital to fund the loan
    if (currentPoolSize < requestedAmount) {
      return res.status(400).json({
        error: 'Insufficient pool capital to fund this loan',
        availableCapital: Number(currentPoolSize.toFixed(2)),
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
    const monthlyRepayment = calculateMonthlyRepayment(requestedAmount, apr, requestedDuration);
    const totalRepayment = monthlyRepayment * requestedDuration;
    const requiredCollateral = await calculateCollateral(requestedAmount, pool.ltv);

    // Create loan application
    const loan = new Loan({
      borrower: userId,
      loanAmount: requestedAmount,
      purpose,
      duration: requestedDuration,
      pool: poolId,
      poolName: pool.name,
      lockedAPR: apr,
      lockedLTV: pool.ltv,
      monthlyRepayment: Number(monthlyRepayment.toFixed(2)),
      totalRepayment: Number(totalRepayment.toFixed(2)),
      requiredCollateral: Number(requiredCollateral.toFixed(9)),
      remainingBalance: Number(totalRepayment.toFixed(2)),
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

    const loans = await Loan.find({ borrower: userId })
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

    const loan = await Loan.findOne({ 
      _id: loanId, 
      borrower: userId 
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

    const loan = await Loan.findOne({ 
      _id: loanId, 
      borrower: userId 
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

module.exports = exports;
