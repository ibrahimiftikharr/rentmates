const PoolInvestment = require('../models/poolInvestmentModel');
const InvestmentPool = require('../models/investmentPoolModel');
const User = require('../models/userModel');
const Loan = require('../models/loanModel');

/**
 * Calculate dashboard metrics for an investor
 * @param {String} investorId - User ID of the investor
 * @returns {Object} Dashboard metrics
 */
async function getDashboardMetrics(investorId) {
  try {
    // Get user's wallet balance
    const user = await User.findById(investorId);
    if (!user) {
      throw new Error('User not found');
    }

    // Find all active investments for this investor
    const investments = await PoolInvestment.find({
      investor: investorId,
      status: 'active'
    }).populate('pool');

    // Initialize metrics
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalEarnings = 0;

    // Calculate metrics from all investments
    if (investments.length > 0) {
      for (const investment of investments) {
        if (!investment.pool) continue;
        
        totalInvested += investment.amountInvested;
        const currentValue = await investment.getCurrentValue();
        totalCurrentValue += currentValue;
        totalEarnings += investment.totalEarnings || 0;
      }
    }

    // Calculate Annual ROI
    const annualROI = totalInvested > 0 
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
      : 0;

    // Calculate Pool Utilization Rate (across all pools)
    const allPools = await InvestmentPool.find({ isActive: true });
    let totalPoolCapacity = 0;
    let totalPoolUtilized = 0;
    
    for (const pool of allPools) {
      totalPoolCapacity += pool.maxCapital;
      
      // Calculate outstanding principal from all loans in this pool
      const poolLoans = await Loan.find({ 
        investmentPool: pool._id,
        status: { $in: ['active', 'disbursed'] }
      });
      
      const outstandingPrincipal = poolLoans.reduce((sum, loan) => {
        return sum + (loan.principalAmount - loan.principalPaid);
      }, 0);
      
      // Pool value = available balance + outstanding principal (no double counting)
      totalPoolUtilized += pool.availableBalance + outstandingPrincipal;
    }
    
    const poolUtilizationRate = totalPoolCapacity > 0 
      ? (totalPoolUtilized / totalPoolCapacity) * 100 
      : 0;

    // Count active pools investor is in
    const activePools = new Set(
      investments
        .filter(inv => inv.pool)
        .map(inv => inv.pool._id.toString())
    ).size;

    return {
      totalInvested: Number(totalInvested.toFixed(2)),
      earningsGenerated: Number(totalEarnings.toFixed(2)),
      currentValue: Number(totalCurrentValue.toFixed(2)),
      annualROI: Number(annualROI.toFixed(2)),
      poolUtilizationRate: Number(poolUtilizationRate.toFixed(2)),
      activePools: activePools,
      walletBalance: Number(user.offChainBalance.toFixed(2)),
      walletAddress: user.walletAddress || null
    };
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    throw error;
  }
}

/**
 * Calculate risk metrics for all active pools
 * Risk is calculated based on LTV ratio
 * - LTV 0.7 = 7% risk (Low)
 * - LTV 0.8 = 8% risk (Medium)
 * - LTV 0.9 = 9% risk (Medium/High based on threshold)
 */
async function getPoolRiskMetrics() {
  try {
    const pools = await InvestmentPool.find({ isActive: true });
    
    const riskMetrics = pools.map(pool => {
      // Risk Score = LTV * 10 (percentage)
      const riskScore = pool.ltv * 10;
      
      // Determine risk level based on LTV
      let riskLevel = 'Low';
      if (pool.ltv >= 0.85) riskLevel = 'High';
      else if (pool.ltv >= 0.75) riskLevel = 'Medium';
      
      // Determine trend based on loan deployment
      const totalPoolValue = pool.getTotalPoolValue();
      const loanDeploymentRate = totalPoolValue > 0 
        ? (pool.disbursedLoans / totalPoolValue) 
        : 0;
      
      let trend = 'stable';
      if (loanDeploymentRate > 0.5) trend = 'up';
      else if (loanDeploymentRate > 0) trend = 'down';
      
      return {
        poolId: pool._id,
        poolName: pool.name,
        riskScore: Number(riskScore.toFixed(2)),
        riskLevel: riskLevel,
        trend: trend,
        ltv: pool.ltv,
        totalPoolValue: Number(totalPoolValue.toFixed(2)),
        disbursedLoans: Number(pool.disbursedLoans.toFixed(2)),
        availableBalance: Number(pool.availableBalance.toFixed(2))
      };
    });
    
    return riskMetrics;
  } catch (error) {
    console.error('Error calculating pool risk metrics:', error);
    throw error;
  }
}

module.exports = {
  getDashboardMetrics,
  getPoolRiskMetrics
};
