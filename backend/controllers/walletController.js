const mongoose = require('mongoose');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const Rental = require('../models/rentalModel');
const Transaction = require('../models/transactionModel');
const { getUSDTBalance, withdrawFromVault, getVaultBalance } = require('../services/contractService');
const { sendEmail } = require('../services/emailService');

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

    console.log('✓ Wallet connected for user:', userId);

    // Update reputation score based on user role
    let reputationScore = null;
    
    // Check if user is a student
    const student = await Student.findOne({ user: userId });
    if (student) {
      student.walletLinked = true;
      await student.save(); // This will trigger pre-save hook to recalculate reputation
      
      reputationScore = student.reputationScore;
      console.log('✓ Student reputation updated:', reputationScore);
      
      // Emit Socket.IO event for real-time reputation update
      const io = req.app.get('io');
      if (io) {
        io.to(`student_${userId}`).emit('reputation_updated', {
          reputationScore: student.reputationScore,
          walletConnected: true
        });
      }
    }

    // If user is a landlord, recalculate reputation score
    const landlord = await Landlord.findOne({ user: userId });
    if (landlord) {
      await landlord.calculateReputationScore();
      await landlord.save();
      
      reputationScore = landlord.reputationScore;
      console.log('✓ Landlord reputation updated:', reputationScore);
      
      // Emit Socket.IO event for real-time reputation update
      const io = req.app.get('io');
      if (io) {
        io.to(`landlord_${userId}`).emit('reputation_updated', {
          reputationScore: landlord.reputationScore,
          walletConnected: true
        });
      }
    }

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      walletAddress: user.walletAddress,
      offChainBalance: user.offChainBalance,
      reputationScore
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

    // Calculate total rental earnings for landlords
    let totalRentalEarnings = 0;
    if (user.role === 'landlord') {
      const landlord = await Landlord.findOne({ user: userId });
      if (landlord) {
        console.log('🔍 Fetching rental earnings for landlord:', userId);
        
        // Sum all completed rent_received transactions
        const earningsResult = await Transaction.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              type: 'rent_received',
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);
        
        console.log('💰 Earnings result:', earningsResult);
        totalRentalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;
        console.log('✅ Total rental earnings:', totalRentalEarnings);
      }
    }

    res.json({
      success: true,
      walletAddress: user.walletAddress,
      onChainBalance, // USDT in user's MetaMask wallet
      offChainBalance: user.offChainBalance, // User's balance in MongoDB (available in vault)
      totalBalance: user.offChainBalance, // What user can actually use in the app
      totalRentalEarnings: totalRentalEarnings // Total earnings from rent payments
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

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'completed',
      txHash: txHash,
      balanceAfter: user.offChainBalance,
      description: `Deposited ${amount} USDT to wallet`
    });

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

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'withdraw',
      amount: parseFloat(amount),
      status: 'completed',
      txHash: txHash,
      balanceAfter: user.offChainBalance,
      description: `Withdrew ${amount} USDT to wallet`
    });

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
    const studentId = req.user.id;

    // Find the student's active rental
    const rental = await Rental.findOne({
      student: studentId,
      status: { $in: ['registered', 'active'] }
    })
    .populate('student', 'name email offChainBalance')
    .populate('landlord', 'name email offChainBalance')
    .populate('property', 'title address');

    if (!rental) {
      return res.status(404).json({ error: 'No active rental found' });
    }

    // Get current rent cycle info
    const cycleInfo = rental.getCurrentRentCycle();
    
    console.log('💰 Processing rent payment for cycle:', {
      forMonth: cycleInfo.forMonth,
      forYear: cycleInfo.forYear,
      canPayNow: cycleInfo.canPayNow,
      isPaid: cycleInfo.isPaid
    });
    
    // Check if payment window is open (20 days before due date)
    if (!cycleInfo.canPayNow) {
      return res.status(400).json({ 
        error: 'Payment window not open yet',
        message: `Rent payment will be available starting ${cycleInfo.paymentWindowStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        daysUntilWindowOpens: cycleInfo.daysUntilWindowOpens
      });
    }

    const rentAmount = rental.monthlyRentAmount;
    const student = rental.student;
    const landlord = rental.landlord;

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

    // Create transaction records for both parties
    const monthName = new Date(cycleInfo.forYear, cycleInfo.forMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const studentTransaction = await Transaction.create({
      user: student._id,
      type: 'rent_payment',
      amount: rentAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: landlord._id,
      balanceAfter: student.offChainBalance,
      description: `Rent payment for ${rental.propertyInfo.title} - ${monthName}`
    });

    await Transaction.create({
      user: landlord._id,
      type: 'rent_received',
      amount: rentAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: student._id,
      balanceAfter: landlord.offChainBalance,
      description: `Rent received from ${student.name} for ${rental.propertyInfo.title} - ${monthName}`
    });

    // Add to rental payment history with period info
    rental.payments.push({
      amount: rentAmount,
      type: 'rent',
      paidAt: new Date(),
      status: 'paid',
      forMonth: cycleInfo.forMonth,
      forYear: cycleInfo.forYear
    });

    // Add to rental action history
    rental.actionHistory.push({
      action: 'Rent Paid',
      amount: `$${rentAmount}`,
      date: new Date(),
      notes: `Monthly rent payment for ${monthName}`
    });

    // Mark current cycle as paid and move to next cycle
    rental.markCycleAsPaidAndMoveNext();

    await rental.save();
    
    console.log('✓ Rent payment completed and moved to next cycle');

    // Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    if (io) {
      // Update student's rent card in real-time
      io.to(`student_${studentId}`).emit('rent_cycle_updated', {
        currentCycle: rental.currentRentCycle,
        canPayNow: false, // Next cycle's window not open yet
        isPaid: false
      });
      
      // Notify landlord of rent received
      io.to(`landlord_${landlord._id}`).emit('new_notification', {
        type: 'rent_received',
        title: 'Rent Payment Received',
        message: `${student.name} paid rent of $${rentAmount} USDT for ${rental.propertyInfo.title} (${monthName})`,
        rentalId: rental._id,
        amount: rentAmount,
        transactionId: studentTransaction._id
      });
    }

    // Send email notification to landlord
    try {
      await sendEmail(
        landlord.email,
        'Rent Payment Received',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8C57FF;">Rent Payment Received</h2>
            <p>Dear ${landlord.name},</p>
            <p>You have received a rent payment from your tenant.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Payment Details:</h3>
              <p style="margin: 10px 0;"><strong>Tenant:</strong> ${student.name}</p>
              <p style="margin: 10px 0;"><strong>Property:</strong> ${rental.propertyInfo.title}</p>
              <p style="margin: 10px 0;"><strong>Address:</strong> ${rental.propertyInfo.address}</p>
              <p style="margin: 10px 0;"><strong>Period:</strong> ${monthName}</p>
              <p style="margin: 10px 0;"><strong>Amount:</strong> $${rentAmount} USDT</p>
              <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p style="margin: 10px 0;"><strong>New Balance:</strong> $${landlord.offChainBalance} USDT</p>
            </div>

            <p>The payment has been credited to your wallet balance.</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
            </div>
          </div>
        `
      );
    } catch (emailError) {
      console.error('Error sending rent payment email:', emailError);
    }

    console.log(`✓ Rent paid: ${rentAmount} USDT from ${student.email} to ${landlord.email} for ${monthName}`);

    res.json({
      success: true,
      message: 'Rent paid successfully',
      amount: rentAmount,
      period: monthName,
      newBalance: student.offChainBalance,
      landlordName: landlord.name,
      propertyTitle: rental.propertyInfo.title,
      transactionId: studentTransaction._id,
      showMoveInWarning: paymentInfo.shouldShowMoveInWarning
    });
  } catch (error) {
    console.error('Pay rent error:', error);
    res.status(500).json({ error: 'Failed to pay rent', details: error.message });
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

/**
 * Get transaction history with filtering
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, fromDate, toDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { user: userId };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        query.createdAt.$lte = endDate;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .populate('relatedUser', 'name email')
      .populate('rental', 'propertyInfo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

/**
 * Get student's active rental info for wallet page
 */
exports.getStudentRentalInfo = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find the student's active rental
    const rental = await Rental.findOne({
      student: studentId,
      status: { $in: ['registered', 'active'] }
    })
    .populate('landlord', 'name email phone')
    .populate('property', 'title address city images');

    if (!rental) {
      return res.json({
        success: true,
        hasActiveRental: false,
        rental: null
      });
    }

    // Get current rent cycle info with new simple logic
    const cycleInfo = rental.getCurrentRentCycle();
    
    console.log('📊 Current rent cycle for student:', {
      studentId,
      rentalId: rental._id,
      forMonth: cycleInfo.forMonth,
      forYear: cycleInfo.forYear,
      canPayNow: cycleInfo.canPayNow,
      isPaid: cycleInfo.isPaid,
      daysUntilDue: cycleInfo.daysUntilDue
    });
    
    res.json({
      success: true,
      hasActiveRental: true,
      rental: {
        rentalId: rental._id,
        propertyTitle: rental.propertyInfo.title,
        propertyAddress: rental.propertyInfo.address,
        monthlyRent: rental.monthlyRentAmount,
        rentDueDay: rental.monthlyRentDueDate,
        nextDueDate: cycleInfo.dueDate,
        daysUntilDue: cycleInfo.daysUntilDue,
        canPayNow: cycleInfo.canPayNow,
        paymentWindowStart: cycleInfo.paymentWindowStart,
        daysUntilWindowOpens: cycleInfo.daysUntilWindowOpens,
        isFirstPayment: cycleInfo.isFirstPayment,
        shouldShowMoveInWarning: cycleInfo.shouldShowMoveInWarning,
        forMonth: cycleInfo.forMonth,
        forYear: cycleInfo.forYear,
        isPaid: cycleInfo.isPaid,
        landlord: {
          id: rental.landlord._id,
          name: rental.landlord.name,
          email: rental.landlord.email,
          phone: rental.landlord.phone
        },
        leaseStartDate: rental.leaseStartDate,
        leaseEndDate: rental.leaseEndDate,
        movingDate: rental.movingDate,
        status: rental.status,
        autoPaymentEnabled: rental.autoPaymentEnabled || false
      }
    });
  } catch (error) {
    console.error('Get student rental info error:', error);
    res.status(500).json({ error: 'Failed to fetch rental information' });
  }
};

/**
 * Toggle auto-payment for student's rental
 */
exports.toggleAutoPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value. Must be boolean.' });
    }

    // Find the student's active rental
    const rental = await Rental.findOne({
      student: studentId,
      status: { $in: ['registered', 'active'] }
    });

    if (!rental) {
      return res.status(404).json({ error: 'No active rental found' });
    }

    // Update auto-payment setting
    rental.autoPaymentEnabled = enabled;
    await rental.save();

    console.log(`✓ Auto-payment ${enabled ? 'enabled' : 'disabled'} for rental ${rental._id}`);

    res.json({
      success: true,
      message: `Auto-payment ${enabled ? 'enabled' : 'disabled'} successfully`,
      autoPaymentEnabled: rental.autoPaymentEnabled
    });
  } catch (error) {
    console.error('Toggle auto-payment error:', error);
    res.status(500).json({ error: 'Failed to toggle auto-payment' });
  }
};

