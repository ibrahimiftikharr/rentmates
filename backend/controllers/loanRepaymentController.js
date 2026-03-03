const Loan = require('../models/loanModel');
const Student = require('../models/studentModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const InvestmentPool = require('../models/investmentPoolModel');
const { sendEmail } = require('../services/emailService');

/**
 * Get active loan details for the student
 */
exports.getActiveLoan = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student record
    const student = await Student.findOne({ user: studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Find active loan (only one active loan allowed per student)
    const loan = await Loan.findOne({
      borrower: student._id,
      status: { $in: ['active', 'repaying'] }
    }).populate('pool', 'poolName apr ltv');

    if (!loan) {
      return res.json({
        hasActiveLoan: false,
        message: 'You do not have an active loan.'
      });
    }

    // Get current installment info
    const currentInstallment = loan.getCurrentInstallment();

    res.json({
      hasActiveLoan: true,
      loan: {
        _id: loan._id,
        loanAmount: loan.loanAmount,
        poolName: loan.poolName,
        collateralLocked: loan.requiredCollateral,
        interestRate: loan.lockedAPR,
        monthlyInstallment: loan.monthlyRepayment,
        totalRepaid: loan.amountRepaid,
        remainingBalance: loan.remainingBalance,
        status: loan.status,
        duration: loan.duration,
        paymentsCompleted: loan.paymentsCompleted,
        autoRepaymentEnabled: loan.autoRepaymentEnabled,
        disbursementDate: loan.disbursementDate,
        maturityDate: loan.maturityDate,
        currentInstallment: currentInstallment,
        repaymentSchedule: loan.repaymentSchedule
      }
    });
  } catch (error) {
    console.error('Get active loan error:', error);
    res.status(500).json({ error: 'Failed to fetch active loan details' });
  }
};

/**
 * Pay loan installment manually
 */
exports.payInstallment = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student with user info
    const student = await Student.findOne({ user: studentId }).populate('user', 'name email offChainBalance');
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Find active loan
    const loan = await Loan.findOne({
      borrower: student._id,
      status: { $in: ['active', 'repaying'] }
    }).populate('pool', 'poolName');

    if (!loan) {
      return res.status(404).json({ error: 'No active loan found' });
    }

    // Get current installment info
    const installmentInfo = loan.getCurrentInstallment();
    
    if (!installmentInfo) {
      return res.status(400).json({ 
        error: 'No pending installment',
        message: 'All loan installments have been paid'
      });
    }

    console.log('💰 Processing loan installment payment:', {
      installmentNumber: installmentInfo.installmentNumber,
      canPayNow: installmentInfo.canPayNow,
      status: installmentInfo.status
    });
    
    // Check if payment window is open
    if (!installmentInfo.canPayNow) {
      return res.status(400).json({ 
        error: 'Payment window not open yet',
        message: `Loan installment payment will be available starting ${installmentInfo.paymentWindowStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        daysUntilWindowOpens: installmentInfo.daysUntilWindowOpens
      });
    }

    const installmentAmount = installmentInfo.amount;
    const user = student.user;

    // Check if student has sufficient balance
    if (user.offChainBalance < installmentAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available: user.offChainBalance,
        required: installmentAmount
      });
    }

    // Deduct from student's wallet
    user.offChainBalance -= installmentAmount;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: 'loan_repayment',
      amount: installmentAmount,
      status: 'completed',
      balanceAfter: user.offChainBalance,
      description: `Loan repayment - Installment ${installmentInfo.installmentNumber} for ${loan.poolName}`
    });

    // Add to loan payment history
    loan.payments.push({
      amount: installmentAmount,
      paidAt: new Date(),
      installmentNumber: installmentInfo.installmentNumber,
      balanceAfter: loan.remainingBalance - installmentAmount,
      notes: 'Manual payment'
    });

    // Mark installment as paid and move to next
    loan.markInstallmentPaidAndMoveNext();

    await loan.save();
    
    console.log('✓ Loan installment payment completed');

    // Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${studentId}`).emit('loan_repayment_updated', {
        amountRepaid: loan.amountRepaid,
        remainingBalance: loan.remainingBalance,
        paymentsCompleted: loan.paymentsCompleted,
        status: loan.status
      });
    }

    // Send email notification
    try {
      await sendEmail(
        user.email,
        'Loan Installment Payment Successful',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Loan Payment Successful</h2>
            <p>Dear ${user.name},</p>
            <p>Your loan installment payment has been processed successfully.</p>
            
            <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3 style="margin-top: 0; color: #065F46;">Payment Details:</h3>
              <p style="margin: 10px 0;"><strong>Pool:</strong> ${loan.poolName}</p>
              <p style="margin: 10px 0;"><strong>Installment:</strong> ${installmentInfo.installmentNumber} of ${loan.duration}</p>
              <p style="margin: 10px 0;"><strong>Amount:</strong> $${installmentAmount.toFixed(2)} USDT</p>
              <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p style="margin: 10px 0;"><strong>Remaining Balance:</strong> $${loan.remainingBalance.toFixed(2)} USDT</p>
              <p style="margin: 10px 0;"><strong>Payments Completed:</strong> ${loan.paymentsCompleted} of ${loan.duration}</p>
              <p style="margin: 10px 0;"><strong>New Wallet Balance:</strong> $${user.offChainBalance.toFixed(2)} USDT</p>
            </div>

            ${loan.status === 'completed' ? `
            <div style="background-color: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
              <h3 style="margin-top: 0; color: #1E40AF;">🎉 Loan Fully Repaid!</h3>
              <p style="margin: 10px 0;">Congratulations! You have successfully repaid your loan in full.</p>
              <p style="margin: 10px 0;">Your collateral of ${loan.requiredCollateral} PAXG will be released shortly.</p>
            </div>
            ` : ''}

            <p>Thank you for your payment!</p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px;">This is an automated notification from RentMates. Please do not reply to this email.</p>
            </div>
          </div>
        `
      );
    } catch (emailError) {
      console.error('Error sending loan payment email:', emailError);
    }

    console.log(`✓ Loan installment paid: ${installmentAmount} USDT by ${user.email}`);

    res.json({
      success: true,
      message: 'Loan installment paid successfully',
      amount: installmentAmount,
      installmentNumber: installmentInfo.installmentNumber,
      newBalance: user.offChainBalance,
      remainingBalance: loan.remainingBalance,
      paymentsCompleted: loan.paymentsCompleted,
      loanStatus: loan.status,
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Pay loan installment error:', error);
    res.status(500).json({ error: 'Failed to process loan payment' });
  }
};

/**
 * Toggle auto-repayment for loan
 */
exports.toggleAutoRepayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid enabled value. Must be boolean.' });
    }

    // Find student record
    const student = await Student.findOne({ user: studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Find active loan
    const loan = await Loan.findOne({
      borrower: student._id,
      status: { $in: ['active', 'repaying'] }
    });

    if (!loan) {
      return res.status(404).json({ error: 'No active loan found' });
    }

    // Update auto-repayment setting
    loan.autoRepaymentEnabled = enabled;
    await loan.save();

    console.log(`✓ Auto-repayment ${enabled ? 'enabled' : 'disabled'} for loan ${loan._id}`);

    res.json({
      success: true,
      message: `Auto-repayment ${enabled ? 'enabled' : 'disabled'} successfully`,
      autoRepaymentEnabled: loan.autoRepaymentEnabled
    });
  } catch (error) {
    console.error('Toggle auto-repayment error:', error);
    res.status(500).json({ error: 'Failed to toggle auto-repayment' });
  }
};

/**
 * Get loan repayment history
 */
exports.getRepaymentHistory = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student record
    const student = await Student.findOne({ user: studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Find active loan
    const loan = await Loan.findOne({
      borrower: student._id,
      status: { $in: ['active', 'repaying'] }
    });

    if (!loan) {
      return res.json({
        hasActiveLoan: false,
        repaymentHistory: []
      });
    }

    // Format repayment schedule with payment status
    const repaymentHistory = loan.repaymentSchedule.map(installment => ({
      id: installment._id,
      installmentNumber: installment.installmentNumber,
      dueDate: installment.dueDate,
      amount: installment.amount,
      principalAmount: installment.principalAmount,
      interestAmount: installment.interestAmount,
      status: installment.status,
      paidAt: installment.paidAt,
      remainingBalance: loan.totalRepayment - (installment.amount * (installment.installmentNumber - 1)) - (installment.status === 'paid' ? installment.amount : 0)
    }));

    res.json({
      hasActiveLoan: true,
      repaymentHistory: repaymentHistory,
      totalPaid: loan.amountRepaid,
      remainingBalance: loan.remainingBalance,
      paymentsCompleted: loan.paymentsCompleted,
      totalInstallments: loan.duration
    });
  } catch (error) {
    console.error('Get repayment history error:', error);
    res.status(500).json({ error: 'Failed to fetch repayment history' });
  }
};

module.exports = exports;
