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
      
      // ✅ SHARE-BASED: Get all user's investments in this pool
      const userInvestments = await PoolInvestment.find({
        investor: userId,
        pool: pool._id,
        status: 'active'
      });
      
      // ✅ SHARE-BASED: Calculate user's shares and value
      const userTotalShares = userInvestments.reduce((sum, inv) => sum + (inv.shares || 0), 0);
      const userTotalInvested = userInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0);
      const currentSharePrice = pool.getSharePrice();
      const userCurrentValue = userTotalShares * currentSharePrice;
      const userSharePercentage = pool.totalShares > 0 ? (userTotalShares / pool.totalShares) * 100 : 0;
      
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
        
        // Pool totals
        poolSize: Number(poolSize.toFixed(2)),
        availableBalance: Number(pool.availableBalance.toFixed(2)),
        disbursedLoans: Number(pool.disbursedLoans.toFixed(2)),
        poolFilledPercentage: Number(poolFilledPercentage.toFixed(2)),
        remainingCapacity: Number(remainingCapacity.toFixed(2)),
        investorCount: investorCount,
        maxCapital: pool.maxCapital,
        minInvestment: pool.minInvestment,
        maxInvestment: pool.maxInvestment,
        
        // ✅ SHARE-BASED: Pool share info
        totalShares: Number(pool.totalShares.toFixed(6)),
        currentSharePrice: Number(currentSharePrice.toFixed(6)),
        
        // ✅ SHARE-BASED: User's position in this pool
        userTotalShares: Number(userTotalShares.toFixed(6)),
        userInvestmentAmount: Number(userTotalInvested.toFixed(2)),
        userCurrentValue: Number(userCurrentValue.toFixed(2)),
        userSharePercentage: Number(userSharePercentage.toFixed(2)),
        
        isFull: isFull,
        canInvest: !isFull
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
 * ✅ SHARE-BASED: Returns share-based investment data
 */
exports.getUserInvestments = async (req, res) => {
  try {
    const userId = req.user.id;

    const investments = await PoolInvestment.find({
      investor: userId,
      status: 'active'
    }).populate('pool');

    // ✅ SHARE-BASED: Map investments with share info
    const investmentsWithDetails = await Promise.all(investments.map(async (inv) => {
      const currentValue = await inv.getCurrentValue();
      const pool = inv.pool;
      
      return {
        id: inv._id,
        poolName: pool.name,
        poolId: pool._id,
        
        // ✅ SHARE-BASED: Share info
        shares: inv.shares,
        entrySharePrice: inv.entrySharePrice,
        currentSharePrice: pool.getSharePrice(),
        
        // Investment amounts
        amountInvested: inv.amountInvested,
        currentValue: currentValue,
        totalEarnings: inv.totalEarnings,
        actualROI: inv.actualROI,
        
        // Dates (investment date still relevant)
        investmentDate: inv.investmentDate,
        
        status: inv.status
      };
    }));

    // ✅ SHARE-BASED: Calculate totals
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
    const totalShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
    const totalCurrentValue = investmentsWithDetails.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEarnings = totalCurrentValue - totalInvested;

    res.json({
      success: true,
      totalInvested,
      totalShares: Number(totalShares.toFixed(6)),
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalEarnings: Number(totalEarnings.toFixed(2)),
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

    // Calculate ROI at time of investment (for reference)
    const lockedROI = pool.calculateROI();
    
    // ✅ SHARE-BASED ACCOUNTING: Calculate share price and shares to mint
    const currentSharePrice = pool.getSharePrice(); // Returns 1 if totalShares = 0
    const sharesToMint = amount / currentSharePrice;
    
    console.log(`💰 Share calculation: Price=${currentSharePrice.toFixed(6)}, Amount=${amount}, Shares to mint=${sharesToMint.toFixed(6)}`);

    // Create investment record with shares
    const investment = new PoolInvestment({
      investor: userId,
      pool: poolId,
      amountInvested: amount,
      shares: sharesToMint,
      entrySharePrice: currentSharePrice,
      lockedROI: lockedROI,
      investmentDate: new Date(),
      status: 'active'
    });

    await investment.save();

    // Update pool balances and shares
    pool.totalInvested += amount;
    pool.availableBalance += amount;
    pool.totalShares += sharesToMint; // ✅ Update total shares
    await pool.save();
    console.log(`📊 Pool ${pool.name}: Total shares increased by ${sharesToMint.toFixed(6)} → ${pool.totalShares.toFixed(6)} shares`);
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

    // ✅ Emit Socket.IO event for real-time investment update
    const io = req.app.get('io');
    if (io) {
      // Notify the investor
      io.to(`user_${userId}`).emit('investment_created', {
        poolId: pool._id,
        poolName: pool.name,
        amount: amount,
        shares: sharesToMint,
        sharePrice: currentSharePrice,
        timestamp: new Date()
      });

      // Broadcast pool update to all connected users
      io.emit('pool_updated', {
        poolId: pool._id,
        poolName: pool.name,
        totalInvested: pool.totalInvested,
        availableBalance: pool.availableBalance,
        timestamp: new Date()
      });      
      // Emit dashboard metrics update to investor
      io.to(`user_${userId}`).emit('dashboard_metrics_updated', {
        trigger: 'investment_created',
        poolId: pool._id,
        poolName: pool.name,
        timestamp: new Date()
      });      
      // Emit dashboard metrics update to investor
      io.to(`user_${userId}`).emit('dashboard_metrics_updated', {
        trigger: 'investment_created',
        poolId: pool._id,
        poolName: pool.name,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Investment successful',
      investment: {
        id: investment._id,
        poolName: pool.name,
        amountInvested: investment.amountInvested,
        shares: investment.shares,
        sharePrice: investment.entrySharePrice,
        lockedROI: investment.lockedROI,
        expectedEarnings: (investment.amountInvested * investment.lockedROI) / 100
      },
      pool: {
        totalShares: pool.totalShares,
        currentSharePrice: currentSharePrice
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
 * ✅ SHARE-BASED: Uses real-time share price calculations
 */
exports.getInvestmentStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user's active investments
    const investments = await PoolInvestment.find({
      investor: userId,
      status: 'active'
    }).populate('pool');

    // ✅ SHARE-BASED: Calculate current values
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
    const totalShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
    
    // Calculate current value based on share prices
    let totalCurrentValue = 0;
    for (const inv of investments) {
      const currentValue = await inv.getCurrentValue();
      totalCurrentValue += currentValue;
    }
    
    const totalEarnings = totalCurrentValue - totalInvested;
    const portfolioROI = totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0;

    // Count unique pools
    const uniquePools = new Set(investments.map(inv => inv.pool._id.toString()));
    const activePools = uniquePools.size;

    res.json({
      success: true,
      stats: {
        totalInvested: Number(totalInvested.toFixed(2)),
        totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
        portfolioROI: Number(portfolioROI.toFixed(2)),
        totalShares: Number(totalShares.toFixed(6)),
        activePools: activePools,
        totalInvestments: investments.length
      }
    });
  } catch (error) {
    console.error('Get investment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch investment statistics' });
  }
};

/**
 * Withdraw from investment pool (sell shares at current price)
 * ✅ SHARE-BASED: Investors can withdraw anytime by selling shares
 */
exports.withdrawFromPool = async (req, res) => {
  try {
    const userId = req.user.id;
    const { poolId, amount } = req.body;

    console.log('\n💰 WITHDRAWAL REQUEST');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Pool ID:', poolId);
    console.log('Withdrawal Amount:', amount);

    // Validate inputs
    if (!poolId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal request' });
    }

    // Get pool
    const pool = await InvestmentPool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Investment pool not found' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all active investments for this user in this pool
    const investments = await PoolInvestment.find({
      investor: userId,
      pool: poolId,
      status: 'active'
    });

    if (investments.length === 0) {
      return res.status(404).json({ error: 'No active investments found in this pool' });
    }

    // Calculate total shares owned in this pool
    const totalSharesOwned = investments.reduce((sum, inv) => sum + inv.shares, 0);
    
    // Get current share price
    const currentSharePrice = pool.getSharePrice();
    const maxWithdrawalAmount = totalSharesOwned * currentSharePrice;

    console.log('Total Shares Owned:', totalSharesOwned.toFixed(6));
    console.log('Current Share Price:', currentSharePrice.toFixed(6));
    console.log('Max Withdrawal Amount:', maxWithdrawalAmount.toFixed(2));

    // Validate withdrawal amount
    if (amount > maxWithdrawalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient shares',
        maxWithdrawalAmount: maxWithdrawalAmount,
        currentSharePrice: currentSharePrice
      });
    }

    // Check pool has sufficient liquidity
    if (amount > pool.availableBalance) {
      return res.status(400).json({ 
        error: 'Insufficient pool liquidity',
        availableBalance: pool.availableBalance
      });
    }

    // Calculate shares to sell
    const sharesToSell = amount / currentSharePrice;
    console.log('Shares to Sell:', sharesToSell.toFixed(6));

    // Update investments (proportionally reduce shares AND amountInvested)
    let remainingSharesToSell = sharesToSell;
    let remainingAmountToWithdraw = amount;
    const updatedInvestments = [];

    for (const investment of investments) {
      if (remainingSharesToSell <= 0) break;

      const sharesToReduceFromThis = Math.min(investment.shares, remainingSharesToSell);
      
      // ✅ FIX: Proportionally reduce amountInvested to maintain correct totalEarnings
      const proportionReduced = sharesToReduceFromThis / investment.shares;
      const amountInvestedToReduce = investment.amountInvested * proportionReduced;
      
      investment.shares -= sharesToReduceFromThis;
      investment.amountInvested -= amountInvestedToReduce;
      remainingSharesToSell -= sharesToReduceFromThis;
      remainingAmountToWithdraw -= amountInvestedToReduce;

      if (investment.shares <= 0.000001) { // Essentially zero
        investment.status = 'withdrawn';
        investment.shares = 0;
        investment.amountInvested = 0;
      }

      // ✅ FIX: Update current value and total earnings after withdrawal
      await investment.updateValue();
      await investment.save();
      
      updatedInvestments.push({
        investmentId: investment._id,
        sharesReduced: sharesToReduceFromThis,
        amountInvestedReduced: amountInvestedToReduce,
        remainingShares: investment.shares,
        remainingAmountInvested: investment.amountInvested,
        status: investment.status
      });
      
      console.log(`  Investment ${investment._id}: Reduced ${sharesToReduceFromThis.toFixed(6)} shares & $${amountInvestedToReduce.toFixed(2)} invested → ${investment.shares.toFixed(6)} shares, $${investment.amountInvested.toFixed(2)} invested remaining`);
    }

    // ✅ FIX: Update pool using FULL ECONOMIC VALUE formula
    // Pool Value = availableBalance + disbursedLoans + accruedInterest
    // Share Price = Pool Value / totalShares
    console.log('\n📊 UPDATING POOL VALUES (maintaining invariant)');
    console.log(`Before withdrawal:`);
    console.log(`  - availableBalance: ${pool.availableBalance.toFixed(2)}`);
    console.log(`  - disbursedLoans: ${pool.disbursedLoans.toFixed(2)}`);
    console.log(`  - accruedInterest: ${pool.accruedInterest.toFixed(2)}`);
    console.log(`  - totalShares: ${pool.totalShares.toFixed(6)}`);
    console.log(`  - poolValue: ${pool.getTotalPoolValue().toFixed(2)}`);
    console.log(`  - sharePrice: ${currentSharePrice.toFixed(6)}`);
    
    // Step 1: Reduce available balance (cash leaving pool)
    pool.availableBalance -= amount;
    
    // Step 2: Reduce total shares (shares burned)
    pool.totalShares -= sharesToSell;
    
    // Step 3: Keep disbursedLoans unchanged (loans still outstanding)
    // Step 4: Keep accruedInterest unchanged (interest still owed to pool)
    // Step 5: Keep totalInvested unchanged (historical tracking only)
    
    // Save pool (will recalculate share price with new values)
    await pool.save();
    
    const newSharePrice = pool.getSharePrice();
    const newPoolValue = pool.getTotalPoolValue();
    console.log(`After withdrawal:`);
    console.log(`  - availableBalance: ${pool.availableBalance.toFixed(2)}`);
    console.log(`  - disbursedLoans: ${pool.disbursedLoans.toFixed(2)}`);
    console.log(`  - accruedInterest: ${pool.accruedInterest.toFixed(2)}`);
    console.log(`  - totalShares: ${pool.totalShares.toFixed(6)}`);
    console.log(`  - poolValue: ${newPoolValue.toFixed(2)}`);
    console.log(`  - sharePrice: ${newSharePrice.toFixed(6)}`);
    console.log('✅ Share price stable! Invariant maintained: Share Price = Pool Value / Total Shares\n');

    // Add to user's off-chain balance
    const oldBalance = user.offChainBalance;
    user.offChainBalance += amount;
    await user.save();
    console.log(`💰 User balance: ${oldBalance.toFixed(2)} → ${user.offChainBalance.toFixed(2)} USDT`);

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'withdraw',
      amount: amount,
      status: 'completed',
      balanceAfter: user.offChainBalance,
      description: `Withdrew ${amount} USDT from ${pool.name} (Sold ${sharesToSell.toFixed(6)} shares)`
    });

    console.log('✅ WITHDRAWAL SUCCESSFUL');
    console.log('========================================\n');

    // ✅ Emit Socket.IO event for real-time withdrawal update
    const io = req.app.get('io');
    if (io) {
      // Notify the investor
      io.to(`user_${userId}`).emit('withdrawal_completed', {
        poolId: pool._id,
        poolName: pool.name,
        amount: amount,
        sharesSold: sharesToSell,
        newSharePrice: newSharePrice,
        timestamp: new Date()
      });

      // Broadcast pool update to all connected users
      io.emit('pool_updated', {
        poolId: pool._id,
        poolName: pool.name,
        availableBalance: pool.availableBalance,
        totalShares: pool.totalShares,
        sharePrice: newSharePrice,
        timestamp: new Date()
      });
      
      // Emit dashboard metrics update to investor
      io.to(`user_${userId}`).emit('dashboard_metrics_updated', {
        trigger: 'withdrawal_completed',
        poolId: pool._id,
        poolName: pool.name,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Withdrawal successful',
      withdrawal: {
        amount: amount,
        sharesSold: sharesToSell,
        sharePriceAtWithdrawal: currentSharePrice,
        investments: updatedInvestments
      },
      pool: {
        name: pool.name,
        remainingShares: pool.totalShares,
        sharePriceAfterWithdrawal: newSharePrice,
        totalInvested: pool.totalInvested,
        availableBalance: pool.availableBalance
      },
      newBalance: user.offChainBalance
    });
  } catch (error) {
    console.error('Withdraw from pool error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
};
