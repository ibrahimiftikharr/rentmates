const mongoose = require('mongoose');
const User = require('../models/userModel');
const Investor = require('../models/investorModel');
const InvestmentPool = require('../models/investmentPoolModel');
const PoolInvestment = require('../models/poolInvestmentModel');
const Transaction = require('../models/transactionModel');

/**
 * Get all investment pools with dynamic calculations
 */
exports.getAllPools = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active pools
    const pools = await InvestmentPool.find({ isActive: true });

    // Get user's off-chain balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate dynamic data for each pool
    const poolsWithData = await Promise.all(pools.map(async (pool) => {
      // Use real-time pool balance (much more efficient)
      const poolSize = pool.totalInvested;
      
      // Get unique investor count (still need to query for this)
      const investments = await PoolInvestment.find({ pool: pool._id, status: 'active' });
      const uniqueInvestors = new Set(investments.map(inv => inv.investor.toString()));
      const investorCount = uniqueInvestors.size;
      
      // Calculate Pool Filled % (total capital invested / max capital × 100)
      const poolFilledPercentage = (poolSize / pool.maxCapital) * 100;
      
      // Calculate Remaining Capacity
      const remainingCapacity = 100 - poolFilledPercentage;
      
      // Get all user's investments in this pool
      const userInvestments = await PoolInvestment.find({
        investor: userId,
        pool: pool._id,
        status: 'active'
      });
      
      // Calculate user's total contribution (sum of all investments)
      const userTotalInvested = userInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
      const userContributionShare = poolSize > 0 ? (userTotalInvested / poolSize) * 100 : 0;
      
      // Calculate Expected ROI
      const expectedROI = pool.calculateROI();
      
      // Check if pool is full based on capital
      const isFull = poolSize >= pool.maxCapital;
      
      return {
        _id: pool._id,
        name: pool.name,
        description: pool.description,
        ltv: pool.ltv,
        durationMonths: pool.durationMonths,
        expectedROI: Number(expectedROI.toFixed(2)),
        poolSize: Number(poolSize.toFixed(2)),
        availableBalance: Number(pool.availableBalance.toFixed(2)),
        disbursedLoans: Number(pool.disbursedLoans.toFixed(2)),
        poolFilledPercentage: Number(poolFilledPercentage.toFixed(2)),
        remainingCapacity: Number(remainingCapacity.toFixed(2)),
        investorCount: investorCount,
        maxCapital: pool.maxCapital,
        minInvestment: pool.minInvestment,
        maxInvestment: pool.maxInvestment,
        userInvestmentAmount: Number(userTotalInvested.toFixed(2)),
        userContributionShare: Number(userContributionShare.toFixed(2)),
        isFull: isFull,
        canInvest: !isFull // Can invest if pool is not full (multiple investments allowed)
      };
    }));

    res.json({
      success: true,
      userBalance: user.offChainBalance,
      pools: poolsWithData
    });
  } catch (error) {
    console.error('Get all pools error:', error);
    res.status(500).json({ error: 'Failed to fetch investment pools' });
  }
};

/**
 * Get user's investments across all pools
 */
exports.getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.id;

    const investments = await PoolInvestment.find({
      investor: userId,
      status: 'active'
    }).populate('pool', 'name ltv durationMonths');

    const investmentsWithDetails = investments.map(inv => ({
      id: inv._id,
      poolName: inv.pool.name,
      poolId: inv.pool._id,
      amountInvested: inv.amountInvested,
      lockedROI: inv.lockedROI,
      investmentDate: inv.investmentDate,
      maturityDate: inv.maturityDate,
      status: inv.status,
      expectedEarnings: (inv.amountInvested * inv.lockedROI) / 100
    }));

    // Calculate total invested
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);

    res.json({
      success: true,
      totalInvested,
      investments: investmentsWithDetails
    });
  } catch (error) {
    console.error('Get user investments error:', error);
    res.status(500).json({ error: 'Failed to fetch user investments' });
  }
};

/**
 * Make an investment in a pool
 */
exports.investInPool = async (req, res) => {
  try {
    const { poolId, amount } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!poolId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid pool ID or amount' });
    }

    // Get pool
    const pool = await InvestmentPool.findById(poolId);
    if (!pool || !pool.isActive) {
      return res.status(404).json({ error: 'Investment pool not found or inactive' });
    }

    // Validate investment amount
    if (amount < pool.minInvestment) {
      return res.status(400).json({
        error: `Minimum investment is ${pool.minInvestment} USDT`
      });
    }

    if (amount > pool.maxInvestment) {
      return res.status(400).json({
        error: `Maximum investment is ${pool.maxInvestment} USDT`
      });
    }

    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.offChainBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        available: user.offChainBalance,
        required: amount
      });
    }

    // Check pool capital capacity using real-time balance
    if (pool.totalInvested + amount > pool.maxCapital) {
      const availableCapacity = pool.maxCapital - pool.totalInvested;
      return res.status(400).json({
        error: `Pool capacity exceeded. Maximum capacity: ${pool.maxCapital} USDT, Current: ${pool.totalInvested.toFixed(2)} USDT, Available: ${availableCapacity.toFixed(2)} USDT`
      });
    }

    // Calculate ROI at time of investment (locked in)
    const lockedROI = pool.calculateROI();

    // Create investment record
    const investment = new PoolInvestment({
      investor: userId,
      pool: poolId,
      amountInvested: amount,
      lockedROI: lockedROI,
      investmentDate: new Date(),
      status: 'active'
    });

    await investment.save();

    // Update pool balances
    pool.totalInvested += amount;
    pool.availableBalance += amount;
    await pool.save();
    console.log(`📊 Pool ${pool.name}: Available balance increased by ${amount} USDT → ${pool.availableBalance} USDT`);

    // Deduct from user's off-chain balance
    user.offChainBalance -= amount;
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'pool_investment',
      amount: amount,
      status: 'completed',
      balanceAfter: user.offChainBalance,
      description: `Invested ${amount} USDT in ${pool.name}`,
      metadata: {
        poolId: pool._id,
        poolName: pool.name,
        lockedROI: lockedROI
      }
    });

    console.log(`✓ Investment successful: ${amount} USDT in ${pool.name} by user ${userId}`);

    res.json({
      success: true,
      message: 'Investment successful',
      investment: {
        id: investment._id,
        poolName: pool.name,
        amountInvested: investment.amountInvested,
        lockedROI: investment.lockedROI,
        maturityDate: investment.maturityDate,
        expectedEarnings: (investment.amountInvested * investment.lockedROI) / 100
      },
      newBalance: user.offChainBalance
    });
  } catch (error) {
    console.error('Invest in pool error:', error);
    res.status(500).json({ error: 'Failed to process investment' });
  }
};

/**
 * Get investment statistics for dashboard
 */
exports.getInvestmentStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user's active investments
    const investments = await PoolInvestment.find({
      investor: userId,
      status: 'active'
    }).populate('pool');

    // Calculate total invested
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);

    // Calculate total expected earnings
    const totalExpectedEarnings = investments.reduce((sum, inv) => {
      return sum + (inv.amountInvested * inv.lockedROI) / 100;
    }, 0);

    // Calculate average ROI
    const avgROI = investments.length > 0
      ? investments.reduce((sum, inv) => sum + inv.lockedROI, 0) / investments.length
      : 0;

    // Count active pools
    const activePools = investments.length;

    res.json({
      success: true,
      stats: {
        totalInvested: Number(totalInvested.toFixed(2)),
        totalExpectedEarnings: Number(totalExpectedEarnings.toFixed(2)),
        averageROI: Number(avgROI.toFixed(2)),
        activePools: activePools
      }
    });
  } catch (error) {
    console.error('Get investment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch investment statistics' });
  }
};
