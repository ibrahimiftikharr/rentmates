const PoolInvestment = require('../models/poolInvestmentModel');
const Investor = require('../models/investorModel');
const InvestmentPool = require('../models/investmentPoolModel');
const Loan = require('../models/loanModel');

/**
 * Get investor's active investments with real-time performance data
 * ✅ SHARE-BASED: Aggregates multiple investments in same pool into ONE card
 */
exports.getActiveInvestments = async (req, res) => {
  try {
    const investorId = req.user.id; // User ID from auth token

    // Find all active investments for this investor
    const investments = await PoolInvestment.find({
      investor: investorId,
      status: 'active'
    })
    .populate('pool')
    .sort({ investmentDate: -1 });

    if (investments.length === 0) {
      return res.json({
        hasInvestments: false,
        investments: [],
        message: 'No active investments found'
      });
    }

    // ✅ SHARE-BASED: Group investments by pool and aggregate
    const poolMap = new Map();
    
    for (const investment of investments) {
      if (!investment.pool) continue; // Skip if pool deleted
      
      const poolId = investment.pool._id.toString();
      
      if (!poolMap.has(poolId)) {
        // First investment in this pool - initialize
        poolMap.set(poolId, {
          poolId: investment.pool._id,
          pool: investment.pool,
          investments: [],
          totalShares: 0,
          totalAmountInvested: 0,
          totalEarnings: 0,
          earliestInvestmentDate: investment.investmentDate,
          investmentCount: 0
        });
      }
      
      const poolData = poolMap.get(poolId);
      poolData.investments.push(investment);
      poolData.totalShares += investment.shares || 0;
      poolData.totalAmountInvested += investment.amountInvested;
      poolData.totalEarnings += investment.totalEarnings || 0;
      poolData.investmentCount += 1;
      
      // Track earliest investment date
      if (investment.investmentDate < poolData.earliestInvestmentDate) {
        poolData.earliestInvestmentDate = investment.investmentDate;
      }
    }

    // ✅ SHARE-BASED: Format aggregated data per pool
    const aggregatedInvestments = Array.from(poolMap.values()).map(poolData => {
      const pool = poolData.pool;
      
      // Calculate current share price and value
      const currentSharePrice = pool.getSharePrice();
      const currentValue = poolData.totalShares * currentSharePrice;
      
      // Calculate risk level based on LTV
      let riskLevel = 'Low';
      if (pool.ltv >= 0.8) riskLevel = 'High';
      else if (pool.ltv >= 0.7) riskLevel = 'Medium';
      
      // Calculate ROI based on share price appreciation
      const averageEntryPrice = poolData.totalAmountInvested / poolData.totalShares;
      const actualROI = poolData.totalShares > 0 
        ? ((currentSharePrice - averageEntryPrice) / averageEntryPrice) * 100 
        : 0;
      
      // Collect all earnings history for performance graph (sorted by date)
      const earningsHistory = poolData.investments
        .flatMap(inv => inv.earningsHistory || [])
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        poolId: pool._id,
        poolName: pool.name,
        poolDescription: pool.description,
        riskLevel: riskLevel,
        
        // ✅ SHARE-BASED: Aggregated amounts
        totalAmountInvested: poolData.totalAmountInvested,
        currentValue: currentValue,
        totalEarnings: poolData.totalEarnings,
        
        // ✅ SHARE-BASED: Share info
        totalShares: poolData.totalShares,
        currentSharePrice: currentSharePrice,
        averageEntryPrice: averageEntryPrice,
        
        // ROI metrics
        expectedROI: pool.expectedROI,
        actualROI: actualROI,
        
        // Time tracking
        earliestInvestmentDate: poolData.earliestInvestmentDate,
        durationMonths: pool.durationMonths,
        
        // Pool info
        ltv: pool.ltv,
        availableBalance: pool.availableBalance, // For withdrawal liquidity check
        
        // Meta info
        investmentCount: poolData.investmentCount, // How many times invested in this pool
        investmentIds: poolData.investments.map(inv => inv._id), // For fetching details
        
        // ✅ SHARE-BASED: Performance history for graph
        earningsHistory: earningsHistory,
        
        status: 'active'
      };
    });

    // Calculate portfolio summary
    const totalInvested = aggregatedInvestments.reduce((sum, inv) => sum + inv.totalAmountInvested, 0);
    const totalCurrentValue = aggregatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEarnings = aggregatedInvestments.reduce((sum, inv) => sum + inv.totalEarnings, 0);
    const portfolioROI = totalInvested > 0 
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
      : 0;

    res.json({
      hasInvestments: true,
      investments: aggregatedInvestments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalEarnings,
        portfolioROI,
        activePools: aggregatedInvestments.length, // Number of unique pools
        totalInvestments: investments.length // Total number of investments
      }
    });
  } catch (error) {
    console.error('Get active investments error:', error);
    res.status(500).json({ error: 'Failed to fetch active investments' });
  }
};

/**
 * Get detailed information for a specific investment including performance data
 * ✅ SHARE-BASED: Returns share-based investment data with earnings history
 * NOTE: This returns a SINGLE investment, not aggregated by pool
 */
exports.getInvestmentDetails = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { investmentId } = req.params;

    const investment = await PoolInvestment.findOne({
      _id: investmentId,
      investor: investorId
    })
    .populate('pool');

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Check if pool still exists
    if (!investment.pool) {
      return res.status(404).json({ error: 'Investment pool no longer exists' });
    }

    // ✅ SHARE-BASED: Get current value and share price
    const currentValue = await investment.getCurrentValue();
    const currentSharePrice = investment.pool.getSharePrice();

    // ✅ SHARE-BASED: Format earnings history for performance graph
    const performanceData = investment.earningsHistory.map(earning => ({
      date: earning.date,
      month: new Date(earning.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: earning.totalValue,
      sharePrice: earning.sharePrice,
      earning: earning.amount,
      source: earning.source
    }));

    res.json({
      investment: {
        _id: investment._id,
        poolName: investment.pool.name,
        poolId: investment.pool._id,
        
        // ✅ SHARE-BASED: Share info
        shares: investment.shares,
        entrySharePrice: investment.entrySharePrice,
        currentSharePrice: currentSharePrice,
        
        // Investment amounts
        amountInvested: investment.amountInvested,
        currentValue: currentValue,
        totalEarnings: investment.totalEarnings,
        actualROI: investment.actualROI,
        
        // Dates
        investmentDate: investment.investmentDate,
        
        status: investment.status
      },
      performanceData: performanceData,
      earningsHistory: investment.earningsHistory
    });
  } catch (error) {
    console.error('Get investment details error:', error);
    res.status(500).json({ error: 'Failed to fetch investment details' });
  }
};

/**
 * Get repayment schedule for loans in a specific pool
 * ✅ SHARE-BASED: Shows loan info based on investor's share percentage
 * NOTE: This is informational only - actual earnings are based on share price increases
 */
exports.getPoolRepaymentSchedule = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { poolId } = req.params;

    // Verify investor has investment in this pool
    const userInvestments = await PoolInvestment.find({
      investor: investorId,
      pool: poolId,
      status: 'active'
    });

    if (userInvestments.length === 0) {
      return res.status(404).json({ error: 'No active investment found in this pool' });
    }

    // Get pool
    const pool = await InvestmentPool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    // ✅ SHARE-BASED: Calculate user's share percentage
    const userTotalShares = userInvestments.reduce((sum, inv) => sum + inv.shares, 0);
    const userSharePercentage = pool.totalShares > 0 ? (userTotalShares / pool.totalShares) * 100 : 0;
    const userTotalInvested = userInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
    const currentSharePrice = pool.getSharePrice();
    const userCurrentValue = userTotalShares * currentSharePrice;

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

    // ✅ SHARE-BASED: Format loan repayment schedules
    const loanSchedules = loans.map(loan => {
      return {
        loanId: loan._id,
        borrowerName: loan.borrower?.user?.name || 'Unknown',
        loanAmount: loan.loanAmount,
        paymentsCompleted: loan.paymentsCompleted,
        totalInstallments: loan.duration,
        status: loan.status,
        schedule: loan.repaymentSchedule.map(installment => ({
          installmentNumber: installment.installmentNumber,
          dueDate: installment.dueDate,
          totalAmount: installment.amount,
          principalAmount: installment.principalAmount,
          interestAmount: installment.interestAmount,
          status: installment.status,
          paidAt: installment.paidAt
        }))
      };
    });

    res.json({
      poolId: poolId,
      poolName: pool.name,
      
      // ✅ SHARE-BASED: User's position
      userTotalShares: Number(userTotalShares.toFixed(6)),
      userSharePercentage: Number(userSharePercentage.toFixed(2)),
      userTotalInvested: Number(userTotalInvested.toFixed(2)),
      userCurrentValue: Number(userCurrentValue.toFixed(2)),
      currentSharePrice: Number(currentSharePrice.toFixed(6)),
      
      // Pool info
      totalPoolShares: Number(pool.totalShares.toFixed(6)),
      totalPoolValue: Number(pool.getTotalPoolValue().toFixed(2)),
      
      // Loan info
      activeLoans: loanSchedules.length,
      loanSchedules: loanSchedules,
      
      // ✅ Note
      note: 'Your actual earnings are determined by share price increases, not individual loan repayments'
    });
  } catch (error) {
    console.error('Get pool repayment schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch repayment schedule' });
  }
};

/**
 * Get portfolio performance graph data
 * ✅ SHARE-BASED: Uses earningsHistory from investments
 */
exports.getPortfolioPerformance = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { timeRange = '6m' } = req.query; // 6m, 1y, all

    // Get all active investments
    const investments = await PoolInvestment.find({
      investor: investorId,
      status: 'active'
    }).populate('pool');

    if (investments.length === 0) {
      return res.json({
        hasData: false,
        performanceData: [],
        message: 'No investment history found'
      });
    }

    // ✅ SHARE-BASED: Get current values
    let totalInvested = 0;
    let totalCurrentValue = 0;
    
    for (const inv of investments) {
      totalInvested += inv.amountInvested;
      const currentValue = await inv.getCurrentValue();
      totalCurrentValue += currentValue;
    }
    
    const totalEarnings = totalCurrentValue - totalInvested;

    // ✅ SHARE-BASED: Generate performance data from earnings history
    const performanceData = generatePortfolioPerformanceData(investments, timeRange);

    res.json({
      hasData: true,
      performanceData: performanceData,
      summary: {
        totalInvested: Number(totalInvested.toFixed(2)),
        totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get portfolio performance error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio performance' });
  }
};

/**
 * Helper function to generate portfolio-wide performance data
 * ✅ SHARE-BASED: Uses earningsHistory instead of repaymentDistributions
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
  
  // ✅ SHARE-BASED: Collect all earnings events across portfolio
  const allEarnings = [];
  investments.forEach(investment => {
    const invStartDate = new Date(investment.investmentDate);
    
    // Initial investment point
    allEarnings.push({
      date: invStartDate,
      type: 'investment',
      investmentId: investment._id,
      amount: investment.amountInvested,
      runningTotal: investment.amountInvested
    });
    
    // ✅ SHARE-BASED: Add earnings from history
    if (investment.earningsHistory && investment.earningsHistory.length > 0) {
      investment.earningsHistory.forEach(earning => {
        allEarnings.push({
          date: new Date(earning.date),
          type: 'earning',
          investmentId: investment._id,
          totalValue: earning.totalValue
        });
      });
    }
  });
  
  // Sort by date
  allEarnings.sort((a, b) => a.date - b.date);
  
  // Generate monthly data points
  let currentDate = new Date(startDate);
  
  while (currentDate <= now) {
    let totalValue = 0;
    
    // Calculate total portfolio value at this date
    investments.forEach(investment => {
      const invStartDate = new Date(investment.investmentDate);
      
      // Only include if investment existed at this date
      if (invStartDate <= currentDate) {
        // Start with investment amount
        let valueAtDate = investment.amountInvested;
        
        // ✅ SHARE-BASED: Find last earning before or at this date
        if (investment.earningsHistory && investment.earningsHistory.length > 0) {
          const earningsUpToDate = investment.earningsHistory
            .filter(earning => new Date(earning.date) <= currentDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          
          if (earningsUpToDate.length > 0) {
            valueAtDate = earningsUpToDate[0].totalValue;
          }
        }
        
        totalValue += valueAtDate;
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
