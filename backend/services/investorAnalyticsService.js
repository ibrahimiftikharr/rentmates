const PoolInvestment = require('../models/poolInvestmentModel');
const InvestmentPool = require('../models/investmentPoolModel');
const Loan = require('../models/loanModel');
const QueuedLoanRequest = require('../models/queuedLoanRequestModel');
const User = require('../models/userModel');

/**
 * Get Risk Pool Allocation analytics for an investor
 * Shows how investor's funds are distributed across different risk levels
 * @param {String} investorId - User ID of the investor
 * @returns {Object} Risk allocation breakdown
 */
async function getRiskPoolAllocation(investorId) {
  try {
    // Get all active investments for this investor
    const investments = await PoolInvestment.find({
      investor: investorId,
      status: 'active'
    }).populate('pool');

    if (investments.length === 0) {
      return {
        totalInvested: 0,
        allocations: [
          { name: 'Low Risk', value: 0, amount: 0, color: '#10b981' },
          { name: 'Medium Risk', value: 0, amount: 0, color: '#f59e0b' },
          { name: 'High Risk', value: 0, amount: 0, color: '#ef4444' }
        ]
      };
    }

    // Calculate current value in each risk category
    let totalCurrentValue = 0;
    const riskCategories = {
      low: 0,
      medium: 0,
      high: 0
    };

    for (const investment of investments) {
      if (!investment.pool) continue;
      
      const currentValue = await investment.getCurrentValue();
      totalCurrentValue += currentValue;

      // Categorize by LTV (which indicates risk level)
      const ltv = investment.pool.ltv;
      if (ltv <= 0.7) {
        riskCategories.low += currentValue;
      } else if (ltv <= 0.8) {
        riskCategories.medium += currentValue;
      } else {
        riskCategories.high += currentValue;
      }
    }

    // Calculate percentages
    const allocations = [
      {
        name: 'Low Risk',
        value: totalCurrentValue > 0 ? Number(((riskCategories.low / totalCurrentValue) * 100).toFixed(1)) : 0,
        amount: Number(riskCategories.low.toFixed(2)),
        color: '#10b981'
      },
      {
        name: 'Medium Risk',
        value: totalCurrentValue > 0 ? Number(((riskCategories.medium / totalCurrentValue) * 100).toFixed(1)) : 0,
        amount: Number(riskCategories.medium.toFixed(2)),
        color: '#f59e0b'
      },
      {
        name: 'High Risk',
        value: totalCurrentValue > 0 ? Number(((riskCategories.high / totalCurrentValue) * 100).toFixed(1)) : 0,
        amount: Number(riskCategories.high.toFixed(2)),
        color: '#ef4444'
      }
    ];

    return {
      totalInvested: Number(totalCurrentValue.toFixed(2)),
      allocations: allocations
    };
  } catch (error) {
    console.error('Error calculating risk pool allocation:', error);
    throw error;
  }
}

/**
 * Get Pool Utilization vs Available Liquidity analytics
 * Shows efficiency of capital deployment across all pools
 * @returns {Object} Pool utilization data with insights
 */
async function getPoolUtilizationAnalytics() {
  try {
    const pools = await InvestmentPool.find({ isActive: true }).sort({ name: 1 });
    
    const poolData = [];
    let highUtilizationPools = [];
    let underutilizedPools = [];

    for (const pool of pools) {
      // Calculate outstanding principal from active loans
      const activeLoans = await Loan.find({
        investmentPool: pool._id,
        status: { $in: ['active', 'disbursed'] }
      });

      const outstandingPrincipal = activeLoans.reduce((sum, loan) => {
        return sum + (loan.principalAmount - loan.principalPaid);
      }, 0);

      const totalPoolValue = pool.availableBalance + outstandingPrincipal;
      const maxCapacity = pool.maxCapital;

      // Utilization as percentage of max capacity
      const utilization = maxCapacity > 0 ? (totalPoolValue / maxCapacity) * 100 : 0;
      const availableLiquidity = maxCapacity > 0 ? ((maxCapacity - totalPoolValue) / maxCapacity) * 100 : 100;

      const poolUtilization = {
        poolId: pool._id,
        poolName: pool.name,
        utilization: Number(utilization.toFixed(1)),
        liquidity: Number(availableLiquidity.toFixed(1)),
        utilizationAmount: Number(totalPoolValue.toFixed(2)),
        liquidityAmount: Number((maxCapacity - totalPoolValue).toFixed(2)),
        maxCapacity: Number(maxCapacity.toFixed(2)),
        ltv: pool.ltv,
        apr: pool.calculateROI()
      };

      poolData.push(poolUtilization);

      // Categorize pools
      if (utilization >= 70) {
        highUtilizationPools.push(pool.name);
      } else if (utilization < 50) {
        underutilizedPools.push(pool.name);
      }
    }

    // Generate insights
    const insights = {
      highUtilization: {
        count: highUtilizationPools.length,
        pools: highUtilizationPools,
        message: highUtilizationPools.length > 0 
          ? `${highUtilizationPools.join(', ')} ${highUtilizationPools.length === 1 ? 'is' : 'are'} performing well with high utilization`
          : 'No pools with high utilization yet'
      },
      underutilized: {
        count: underutilizedPools.length,
        pools: underutilizedPools,
        message: underutilizedPools.length > 0
          ? `${underutilizedPools.join(', ')} ${underutilizedPools.length === 1 ? 'has' : 'have'} high liquidity - consider rebalancing investments`
          : 'All pools are efficiently utilized'
      }
    };

    return {
      pools: poolData,
      insights: insights
    };
  } catch (error) {
    console.error('Error calculating pool utilization analytics:', error);
    throw error;
  }
}

/**
 * Get Investment Opportunities analytics
 * Shows underutilized pools with queued student loan requests
 * @returns {Object} Investment opportunities with demand data
 */
async function getInvestmentOpportunities() {
  try {
    const pools = await InvestmentPool.find({ isActive: true });
    
    // Get all queued loan requests (active student demand)
    const queuedRequests = await QueuedLoanRequest.find({ 
      status: 'queued',
      expiresAt: { $gt: new Date() }
    }).populate('student');

    console.log(`📊 Found ${queuedRequests.length} queued loan requests for investment opportunities`);
    if (queuedRequests.length > 0) {
      console.log('First queued request:', {
        amount: queuedRequests[0].requestedAmount,
        duration: queuedRequests[0].duration,
        purpose: queuedRequests[0].purpose
      });
    }

    const opportunities = [];

    for (const pool of pools) {
      // Calculate pool metrics
      const activeLoans = await Loan.find({
        investmentPool: pool._id,
        status: { $in: ['active', 'disbursed'] }
      });

      const outstandingPrincipal = activeLoans.reduce((sum, loan) => {
        return sum + (loan.principalAmount - loan.principalPaid);
      }, 0);

      const totalPoolValue = pool.availableBalance + outstandingPrincipal;
      const utilization = pool.maxCapital > 0 ? (totalPoolValue / pool.maxCapital) * 100 : 0;
      const availableLiquidity = pool.maxCapital - totalPoolValue;

      // Only show pools with < 70% utilization (have capacity for more investments)
      if (utilization >= 70) continue;

      // Count queued requests that could match this pool
      // Filter based on pool's lending criteria
      const matchingRequests = queuedRequests.filter(req => {
        // Check if loan amount is within pool's available liquidity
        const isAmountSuitable = req.requestedAmount <= availableLiquidity;
        
        // Check if duration EXACTLY matches this pool's duration
        // Conservative: 6 months, Balanced: 9 months, High Yield: 12 months
        const isDurationSuitable = req.duration === pool.durationMonths;
        
        return isAmountSuitable && isDurationSuitable;
      });

      console.log(`Pool ${pool.name} (${pool.durationMonths} months): ${matchingRequests.length} matching requests (available liquidity: $${availableLiquidity}, utilization: ${utilization.toFixed(1)}%)`);

      // Calculate total requested amount from all matching queued students
      const totalRequested = matchingRequests.length > 0
        ? matchingRequests.reduce((sum, req) => sum + req.requestedAmount, 0)
        : 0;

      // Determine student demand level
      let studentDemand = 'Low';
      if (matchingRequests.length >= 15) studentDemand = 'Very High';
      else if (matchingRequests.length >= 10) studentDemand = 'High';
      else if (matchingRequests.length >= 5) studentDemand = 'Medium';

      // Determine risk level from LTV
      let riskLevel = 'Low';
      if (pool.ltv >= 0.85) riskLevel = 'High';
      else if (pool.ltv >= 0.75) riskLevel = 'Medium';

      const apr = pool.calculateROI();
      
      opportunities.push({
        poolId: pool._id,
        poolName: pool.name,
        utilization: Number(utilization.toFixed(1)),
        availableLiquidity: Number(availableLiquidity.toFixed(2)),
        queuedRequests: matchingRequests.length,
        studentDemand: studentDemand,
        totalRequested: Number(totalRequested.toFixed(2)),
        riskLevel: riskLevel,
        ltv: pool.ltv,
        apr: apr,
        potentialMonthlyReturn: Number((availableLiquidity * (apr / 100) / 12).toFixed(2))
      });
    }

    // Sort by queued requests (highest demand first)
    opportunities.sort((a, b) => b.queuedRequests - a.queuedRequests);

    // Calculate summary stats
    const totalQueuedRequests = queuedRequests.length;
    const totalQueuedAmount = queuedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);

    return {
      opportunities: opportunities,
      summary: {
        totalQueuedRequests: totalQueuedRequests,
        totalQueuedAmount: Number(totalQueuedAmount.toFixed(2)),
        avgRequestAmount: totalQueuedRequests > 0 ? Number((totalQueuedAmount / totalQueuedRequests).toFixed(2)) : 0,
        opportunityCount: opportunities.length
      }
    };
  } catch (error) {
    console.error('Error calculating investment opportunities:', error);
    throw error;
  }
}

/**
 * Get complete analytics data for investor dashboard
 * Combines all analytics sections
 * @param {String} investorId - User ID of the investor
 * @returns {Object} Complete analytics data
 */
async function getCompleteAnalytics(investorId) {
  try {
    const [riskAllocation, poolUtilization, opportunities] = await Promise.all([
      getRiskPoolAllocation(investorId),
      getPoolUtilizationAnalytics(),
      getInvestmentOpportunities()
    ]);

    return {
      riskAllocation,
      poolUtilization,
      opportunities,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting complete analytics:', error);
    throw error;
  }
}

module.exports = {
  getRiskPoolAllocation,
  getPoolUtilizationAnalytics,
  getInvestmentOpportunities,
  getCompleteAnalytics
};
