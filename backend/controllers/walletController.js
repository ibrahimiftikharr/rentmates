const User = require('../models/userModel');
const { getUSDTBalance, withdrawFromVault, getVaultBalance } = require('../services/contractService');

/**
 * Connect wallet - Store user's MetaMask wallet address
 */
exports.connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Update user's wallet address
    const user = await User.findByIdAndUpdate(
      userId,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      walletAddress: user.walletAddress,
      offChainBalance: user.offChainBalance
    });
  } catch (error) {
    console.error('Connect wallet error:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
};

/**
 * Get wallet balance - Returns both on-chain USDT and off-chain balance
 */
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let onChainBalance = '0';
    
    // Get on-chain USDT balance if wallet is connected
    if (user.walletAddress) {
      try {
        onChainBalance = await getUSDTBalance(user.walletAddress);
      } catch (error) {
        console.error('Error fetching on-chain balance:', error);
      }
    }

    res.json({
      success: true,
      walletAddress: user.walletAddress,
      onChainBalance, // USDT in user's MetaMask wallet
      offChainBalance: user.offChainBalance, // User's balance in MongoDB (available in vault)
      totalBalance: user.offChainBalance // What user can actually use in the app
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

/**
 * Record deposit - User deposits USDT to vault (transaction happens on frontend)
 * Backend just updates the off-chain balance
 */
exports.recordDeposit = async (req, res) => {
  try {
    const { amount, txHash } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Find user and update off-chain balance
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { offChainBalance: parseFloat(amount) } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Deposit recorded: ${amount} USDT for user ${user.email} (tx: ${txHash})`);

    res.json({
      success: true,
      message: 'Deposit recorded successfully',
      offChainBalance: user.offChainBalance,
      txHash
    });
  } catch (error) {
    console.error('Record deposit error:', error);
    res.status(500).json({ error: 'Failed to record deposit' });
  }
};

/**
 * Withdraw - Backend calls vault contract to send USDT to user's wallet
 */
exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.walletAddress) {
      return res.status(400).json({ error: 'Wallet not connected' });
    }

    // Check if user has sufficient off-chain balance
    if (user.offChainBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available: user.offChainBalance,
        requested: amount
      });
    }

    // Call smart contract to withdraw
    const txHash = await withdrawFromVault(user.walletAddress, amount);

    // Deduct from off-chain balance
    user.offChainBalance -= parseFloat(amount);
    await user.save();

    console.log(`Withdrawal successful: ${amount} USDT to ${user.walletAddress} (tx: ${txHash})`);

    res.json({
      success: true,
      message: 'Withdrawal successful',
      txHash,
      offChainBalance: user.offChainBalance
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ 
      error: 'Withdrawal failed', 
      details: error.message 
    });
  }
};

/**
 * Pay rent - Transfer balance from student to landlord (off-chain only)
 */
exports.payRent = async (req, res) => {
  try {
    const { landlordId, amount } = req.body;
    const studentId = req.user.id;

    // Validate inputs
    if (!landlordId) {
      return res.status(400).json({ error: 'Landlord ID is required' });
    }

    // For now, use hardcoded amount of 2 USDT if not provided
    const rentAmount = amount || 2;

    if (rentAmount <= 0) {
      return res.status(400).json({ error: 'Invalid rent amount' });
    }

    // Get student and landlord
    const student = await User.findById(studentId);
    const landlord = await User.findById(landlordId);

    if (!student || !landlord) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (student.role !== 'student') {
      return res.status(403).json({ error: 'Only students can pay rent' });
    }

    if (landlord.role !== 'landlord') {
      return res.status(400).json({ error: 'Invalid landlord' });
    }

    // Check if student has sufficient balance
    if (student.offChainBalance < rentAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available: student.offChainBalance,
        required: rentAmount
      });
    }

    // Transfer balance from student to landlord (off-chain)
    student.offChainBalance -= rentAmount;
    landlord.offChainBalance += rentAmount;

    await student.save();
    await landlord.save();

    console.log(`Rent paid: ${rentAmount} USDT from ${student.email} to ${landlord.email}`);

    res.json({
      success: true,
      message: 'Rent paid successfully',
      amount: rentAmount,
      newBalance: student.offChainBalance,
      landlordEmail: landlord.email
    });
  } catch (error) {
    console.error('Pay rent error:', error);
    res.status(500).json({ error: 'Failed to pay rent' });
  }
};

/**
 * Get vault info - For admin/debugging purposes
 */
exports.getVaultInfo = async (req, res) => {
  try {
    const vaultBalance = await getVaultBalance();
    
    res.json({
      success: true,
      vaultBalance,
      vaultAddress: require('../services/contractService').VAULT_ADDRESS,
      usdtAddress: require('../services/contractService').USDT_ADDRESS
    });
  } catch (error) {
    console.error('Get vault info error:', error);
    res.status(500).json({ error: 'Failed to fetch vault info' });
  }
};
