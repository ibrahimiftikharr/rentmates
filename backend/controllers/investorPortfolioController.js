const PoolInvestment = require('../models/poolInvestmentModel');
const Investor = require('../models/investorModel');
const InvestmentPool = require('../models/investmentPoolModel');
const Loan = require('../models/loanModel');

/**
 * Get investor's active investments with real-time performance data
 */
exports.getActiveInvestments = async (req, res) => {
  try {
    const investorId = req.user.id; // User ID from auth token

    // Find all active investments for this investor
    const investments = await PoolInvestment.find({
      investor: investorId,
      status: 'active'
    })
    .populate('pool', 'name description ltv durationMonths expectedROI')
    .sort({ investmentDate: -1 });

    if (investments.length === 0) {
      return res.json({
        hasInvestments: false,
        investments: [],
        message: 'No active investments found'
      });
    }

    // Format investment data with real-time calculations
    const formattedInvestments = investments
      .filter(investment => investment.pool !== null) // Filter out investments with deleted pools
      .map(investment => {
      const pool = investment.pool;
      const daysRemaining = investment.getDaysRemaining();
      
      // Calculate risk level based on LTV
      let riskLevel = 'Low';
      if (pool.ltv >= 0.8) riskLevel = 'High';
      else if (pool.ltv >= 0.7) riskLevel = 'Medium';

      return {
        _id: investment._id,
        poolId: pool._id,
        poolName: pool.name,
        poolDescription: pool.description,
        riskLevel: riskLevel,
        
        // Investment amounts
        amountInvested: investment.amountInvested,
        currentValue: investment.currentValue || investment.amountInvested,
        totalEarnings: investment.totalEarnings,
        principalReturned: investment.principalReturned,
        
        // ROI metrics
        lockedROI: investment.lockedROI,
        actualROI: investment.actualROI || 0,
        
        // Time tracking
        investmentDate: investment.investmentDate,
        maturityDate: investment.maturityDate,
        daysRemaining: daysRemaining,
        durationMonths: pool.durationMonths,
        
        // Pool info
        ltv: pool.ltv,
        
        // Distribution history count
        distributionsReceived: investment.repaymentDistributions.length,
        
        status: investment.status
      };
    });

    // Calculate portfolio summary
    const totalInvested = formattedInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
    const totalCurrentValue = formattedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEarnings = formattedInvestments.reduce((sum, inv) => sum + inv.totalEarnings, 0);
    const averageROI = formattedInvestments.length > 0 
      ? formattedInvestments.reduce((sum, inv) => sum + inv.actualROI, 0) / formattedInvestments.length 
      : 0;

    res.json({
      hasInvestments: true,
      investments: formattedInvestments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalEarnings,
        averageROI,
        activeInvestments: formattedInvestments.length
      }
    });
  } catch (error) {
    console.error('Get active investments error:', error);
    res.status(500).json({ error: 'Failed to fetch active investments' });
  }
};

/**
 * Get detailed information for a specific investment including performance data
 */
exports.getInvestmentDetails = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { investmentId } = req.params;

    const investment = await PoolInvestment.findOne({
      _id: investmentId,
      investor: investorId
    })
    .populate('pool', 'name description ltv durationMonths expectedROI')
    .populate({
      path: 'repaymentDistributions.loanId',
      select: 'poolName loanAmount borrower status'
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Check if pool still exists
    if (!investment.pool) {
      return res.status(404).json({ error: 'Investment pool no longer exists' });
    }

    // Calculate performance graph data (monthly)
    const performanceData = calculatePerformanceGraphData(investment);

    res.json({
      investment: {
        _id: investment._id,
        poolName: investment.pool.name,
        amountInvested: investment.amountInvested,
        currentValue: investment.currentValue,
        totalEarnings: investment.totalEarnings,
        principalReturned: investment.principalReturned,
        lockedROI: investment.lockedROI,
        actualROI: investment.actualROI,
        investmentDate: investment.investmentDate,
        maturityDate: investment.maturityDate,
        daysRemaining: investment.getDaysRemaining(),
        status: investment.status
      },
      performanceData: performanceData,
      distributionHistory: investment.repaymentDistributions.map(dist => ({
        _id: dist._id,
        loanId: dist.loanId?._id,
        installmentNumber: dist.installmentNumber,
        principalAmount: dist.principalAmount,
        interestAmount: dist.interestAmount,
        totalAmount: dist.principalAmount + dist.interestAmount,
        distributionDate: dist.distributionDate
      }))
    });
  } catch (error) {
    console.error('Get investment details error:', error);
    res.status(500).json({ error: 'Failed to fetch investment details' });
  }
};

/**
 * Get repayment schedule for loans in a specific pool investment
 */
exports.getPoolRepaymentSchedule = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { poolId } = req.params;

    // Verify investor has investment in this pool
    const investment = await PoolInvestment.findOne({
      investor: investorId,
      pool: poolId,
      status: 'active'
    });

    if (!investment) {
      return res.status(404).json({ error: 'No active investment found in this pool' });
    }

    // Find all active loans in this pool
    const loans = await Loan.find({
      pool: poolId,
      status: { $in: ['active', 'repaying'] }
    })
    .select('borrower loanAmount duration repaymentSchedule paymentsCompleted status')
    .populate('borrower', 'user')
    .populate({
      path: 'borrower',
      populate: {
        path: 'user',
        select: 'name'
      }
    });

    // Calculate investor's share in each loan based on pool investment
    const poolInvestments = await PoolInvestment.find({
      pool: poolId,
      status: 'active'
    });
    
    const totalPoolInvestment = poolInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
    const investorSharePercentage = investment.amountInvested / totalPoolInvestment;

    // Format loan repayment schedules
    const loanSchedules = loans.map(loan => {
      const investorShareInLoan = loan.loanAmount * investorSharePercentage;
      
      return {
        loanId: loan._id,
        borrowerName: loan.borrower?.user?.name || 'Unknown',
        loanAmount: loan.loanAmount,
        investorShare: investorShareInLoan,
        sharePercentage: (investorSharePercentage * 100).toFixed(2),
        paymentsCompleted: loan.paymentsCompleted,
        totalInstallments: loan.duration,
        status: loan.status,
        schedule: loan.repaymentSchedule.map(installment => ({
          installmentNumber: installment.installmentNumber,
          dueDate: installment.dueDate,
          totalAmount: installment.amount,
          investorPortion: installment.amount * investorSharePercentage,
          principalAmount: installment.principalAmount,
          interestAmount: installment.interestAmount,
          investorPrincipal: installment.principalAmount * investorSharePercentage,
          investorInterest: installment.interestAmount * investorSharePercentage,
          status: installment.status,
          paidAt: installment.paidAt
        }))
      };
    });

    res.json({
      poolId: poolId,
      investorSharePercentage: (investorSharePercentage * 100).toFixed(2),
      amountInvested: investment.amountInvested,
      totalPoolInvestment: totalPoolInvestment,
      activeLoans: loanSchedules.length,
      loanSchedules: loanSchedules
    });
  } catch (error) {
    console.error('Get pool repayment schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch repayment schedule' });
  }
};

/**
 * Get portfolio performance graph data
 */
exports.getPortfolioPerformance = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { timeRange = '6m' } = req.query; // 6m, 1y, all

    // Get all investments (active and completed)
    const investments = await PoolInvestment.find({
      investor: investorId
    }).populate('pool', 'name');

    if (investments.length === 0) {
      return res.json({
        hasData: false,
        performanceData: [],
        message: 'No investment history found'
      });
    }

    // Generate performance data points
    const performanceData = generatePortfolioPerformanceData(investments, timeRange);

    res.json({
      hasData: true,
      performanceData: performanceData,
      summary: {
        totalInvested: investments.reduce((sum, inv) => sum + inv.amountInvested, 0),
        totalEarnings: investments.reduce((sum, inv) => sum + inv.totalEarnings, 0),
        currentValue: investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amountInvested), 0)
      }
    });
  } catch (error) {
    console.error('Get portfolio performance error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio performance' });
  }
};

/**
 * Helper function to calculate performance graph data
 */
function calculatePerformanceGraphData(investment) {
  const data = [];
  const investmentDate = new Date(investment.investmentDate);
  const now = new Date();
  
  // Generate monthly data points from investment date to now
  let currentDate = new Date(investmentDate);
  let cumulativeValue = investment.amountInvested;
  
  while (currentDate <= now) {
    // Calculate earnings up to this date
    const earningsUpToDate = investment.repaymentDistributions
      .filter(dist => new Date(dist.distributionDate) <= currentDate)
      .reduce((sum, dist) => sum + dist.interestAmount + dist.principalAmount, 0);
    
    data.push({
      month: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      date: new Date(currentDate),
      value: Math.round(investment.amountInvested + earningsUpToDate)
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return data.length > 0 ? data : [{
    month: investmentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    date: investmentDate,
    value: investment.amountInvested
  }];
}

/**
 * Helper function to generate portfolio-wide performance data
 */
function generatePortfolioPerformanceData(investments, timeRange) {
  const data = [];
  
  // Determine date range
  const now = new Date();
  let startDate = new Date();
  
  switch(timeRange) {
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      // Find earliest investment date
      startDate = investments.reduce((earliest, inv) => {
        const invDate = new Date(inv.investmentDate);
        return invDate < earliest ? invDate : earliest;
      }, now);
      break;
  }
  
  // Generate monthly data points
  let currentDate = new Date(startDate);
  
  while (currentDate <= now) {
    let totalValue = 0;
    
    // Calculate total portfolio value at this date
    investments.forEach(investment => {
      const invStartDate = new Date(investment.investmentDate);
      
      // Only include if investment existed at this date
      if (invStartDate <= currentDate) {
        // Calculate earnings up to this date
        const earningsUpToDate = investment.repaymentDistributions
          .filter(dist => new Date(dist.distributionDate) <= currentDate)
          .reduce((sum, dist) => sum + dist.interestAmount + dist.principalAmount, 0);
        
        totalValue += investment.amountInvested + earningsUpToDate;
      }
    });
    
    if (totalValue > 0) {
      data.push({
        month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
        date: new Date(currentDate),
        value: Math.round(totalValue)
      });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return data;
}

module.exports = exports;
