const Rental = require('../models/rentalModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const Notification = require('../models/notificationModel');
const Transaction = require('../models/transactionModel');
const JoinRequest = require('../models/joinRequestModel');
const emailService = require('../services/emailService');

// Get security deposit status for a student
exports.getSecurityDepositStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find active or registered rental for the student
    const rental = await Rental.findOne({
      student: userId,
      status: { $in: ['registered', 'active'] }
    })
      .populate('property')
      .populate('landlord');

    if (!rental) {
      return res.status(404).json({ error: 'No active rental found' });
    }

    const now = new Date();
    const daysUntilDue = Math.ceil((rental.securityDepositDueDate - now) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDue < 0;
    const canRefund = rental.securityDepositStatus === 'paid' && new Date() < new Date(rental.movingDate);

    res.json({
      success: true,
      securityDeposit: {
        amount: rental.securityDepositAmount,
        status: rental.securityDepositStatus,
        dueDate: rental.securityDepositDueDate,
        paidAt: rental.securityDepositPaidAt,
        refundedAt: rental.securityDepositRefundedAt,
        refundReason: rental.securityDepositRefundReason,
        daysUntilDue,
        isOverdue,
        canRefund,
        movingDate: rental.movingDate
      },
      rental: {
        id: rental._id,
        propertyTitle: rental.propertyInfo.title,
        monthlyRent: rental.monthlyRentAmount,
        leaseStartDate: rental.leaseStartDate,
        leaseEndDate: rental.leaseEndDate
      }
    });
  } catch (error) {
    console.error('Error getting security deposit status:', error);
    res.status(500).json({ error: 'Failed to get security deposit status' });
  }
};

// Pay security deposit
exports.paySecurityDeposit = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find active or registered rental for the student
    const rental = await Rental.findOne({
      student: userId,
      status: { $in: ['registered', 'active'] }
    })
      .populate('property')
      .populate('landlord');

    if (!rental) {
      return res.status(404).json({ error: 'No active rental found' });
    }

    if (rental.securityDepositStatus === 'paid') {
      return res.status(400).json({ error: 'Security deposit already paid' });
    }

    // Check if payment is overdue
    const now = new Date();
    if (now > rental.securityDepositDueDate) {
      return res.status(400).json({ error: 'Security deposit payment deadline has passed' });
    }

    // Get student user
    const user = await User.findById(userId);

    // Check if student has sufficient balance
    if (user.offChainBalance < rental.securityDepositAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: rental.securityDepositAmount,
        available: user.offChainBalance
      });
    }

    // Deduct from student's wallet
    user.offChainBalance -= rental.securityDepositAmount;
    await user.save();

    // Update rental record
    rental.securityDepositStatus = 'paid';
    rental.securityDepositPaidAt = new Date();
    rental.actionHistory.push({
      action: 'Security Deposit Paid',
      amount: `$${rental.securityDepositAmount}`,
      date: new Date(),
      notes: 'Security deposit paid by student'
    });
    await rental.save();

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'rent_payment',
      amount: rental.securityDepositAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: rental.landlord,
      balanceAfter: user.offChainBalance,
      description: 'Security deposit payment'
    });
    await transaction.save();

    // Get landlord info for notification
    const landlordUser = await User.findById(rental.landlord);
    const landlordDoc = await Landlord.findOne({ user: rental.landlord });

    // Create notification for landlord
    const notification = new Notification({
      recipient: landlordDoc._id,
      recipientModel: 'Landlord',
      type: 'security_deposit_paid',
      title: 'Security Deposit Received',
      message: `${user.name} has successfully paid the security deposit of $${rental.securityDepositAmount} for ${rental.propertyInfo.title}. The payment has been received by the platform.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await notification.save();

    // Send email to landlord
    try {
      await emailService.sendEmail({
        to: landlordUser.email,
        subject: 'Security Deposit Received - RentMates',
        text: `Good news! ${user.name} has paid the security deposit of $${rental.securityDepositAmount} for "${rental.propertyInfo.title}". The platform has received the payment.`
      });
    } catch (emailError) {
      console.error('Error sending email to landlord:', emailError);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`landlord_${rental.landlord}`).emit('security_deposit_paid', {
        rentalId: rental._id,
        studentName: user.name,
        amount: rental.securityDepositAmount,
        propertyTitle: rental.propertyInfo.title
      });

      io.to(`student_${userId}`).emit('security_deposit_status_updated', {
        rentalId: rental._id,
        status: 'paid',
        paidAt: rental.securityDepositPaidAt
      });
    }

    res.json({
      success: true,
      message: 'Security deposit paid successfully',
      newBalance: user.offChainBalance,
      rental: {
        id: rental._id,
        securityDepositStatus: rental.securityDepositStatus,
        securityDepositPaidAt: rental.securityDepositPaidAt
      }
    });
  } catch (error) {
    console.error('Error paying security deposit:', error);
    res.status(500).json({ error: 'Failed to process security deposit payment' });
  }
};

// Refund security deposit (landlord initiates)
exports.refundSecurityDeposit = async (req, res) => {
  try {
    const userId = req.user.id; // Landlord ID
    const { rentalId, reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Refund reason is required' });
    }

    // Find rental and verify landlord owns it
    const rental = await Rental.findOne({
      _id: rentalId,
      landlord: userId,
      status: { $in: ['registered', 'active'] }
    })
      .populate('property')
      .populate('student');

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found or cannot be refunded' });
    }

    if (rental.securityDepositStatus !== 'paid') {
      return res.status(400).json({ error: 'Security deposit has not been paid yet' });
    }

    // Check if refund is allowed (before moving date)
    const now = new Date();
    const movingDate = new Date(rental.movingDate);
    
    if (now >= movingDate) {
      return res.status(400).json({ 
        error: 'Cannot refund security deposit after the moving date',
        movingDate: rental.movingDate
      });
    }

    // Get student user
    const studentUser = await User.findById(rental.student);

    // Refund to student's wallet
    studentUser.offChainBalance += rental.securityDepositAmount;
    await studentUser.save();

    // Update rental record
    rental.securityDepositStatus = 'refunded';
    rental.securityDepositRefundedAt = new Date();
    rental.securityDepositRefundReason = reason;
    rental.status = 'terminated';
    rental.terminationReason = `Security deposit refunded - Reason: ${reason}`;
    rental.terminatedAt = new Date();
    rental.actionHistory.push({
      action: 'Security Deposit Refunded',
      amount: `$${rental.securityDepositAmount}`,
      date: new Date(),
      notes: `Refund reason: ${reason}`
    });
    await rental.save();

    // Update corresponding JoinRequest status to terminated
    const joinRequest = await JoinRequest.findOne({
      student: rental.student,
      property: rental.property,
      status: { $in: ['completed', 'waiting_completion'] }
    });

    if (joinRequest) {
      joinRequest.status = 'terminated';
      joinRequest.terminationReason = reason;
      joinRequest.terminatedAt = new Date();
      await joinRequest.save();
    }

    // Create transaction record
    const transaction = new Transaction({
      user: rental.student,
      type: 'deposit',
      amount: rental.securityDepositAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: userId,
      balanceAfter: studentUser.offChainBalance,
      description: `Security deposit refund - ${reason}`
    });
    await transaction.save();

    // Get student info for notification
    const studentDoc = await Student.findOne({ user: rental.student });

    // Create notification for student
    const notification = new Notification({
      recipient: studentDoc._id,
      recipientModel: 'Student',
      type: 'security_deposit_refunded',
      title: 'Security Deposit Refunded',
      message: `Your security deposit of $${rental.securityDepositAmount} for ${rental.propertyInfo.title} has been refunded. Reason: ${reason}. The rental contract has been terminated.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await notification.save();

    // Create notification for landlord
    const landlordDoc = await Landlord.findOne({ user: userId });
    const landlordNotification = new Notification({
      recipient: landlordDoc._id,
      recipientModel: 'Landlord',
      type: 'contract_terminated',
      title: 'Rental Contract Terminated',
      message: `The rental contract for ${rental.propertyInfo.title} has been terminated. The security deposit of $${rental.securityDepositAmount} has been refunded to the student.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await landlordNotification.save();

    // Send email to student
    try {
      await emailService.sendEmail({
        to: studentUser.email,
        subject: 'Security Deposit Refunded - RentMates',
        text: `Your security deposit of $${rental.securityDepositAmount} for "${rental.propertyInfo.title}" has been refunded to your wallet.\n\nReason: ${reason}\n\nThe rental contract has been terminated. Your current balance is $${studentUser.offChainBalance}.`
      });
    } catch (emailError) {
      console.error('Error sending email to student:', emailError);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      console.log(`[SecurityDeposit] Emitting refund events - Student: ${rental.student}, Landlord: ${userId}`);
      
      // Emit to student for security deposit page update
      io.to(`student_${rental.student}`).emit('security_deposit_refunded', {
        rentalId: rental._id,
        amount: rental.securityDepositAmount,
        reason: reason,
        newBalance: studentUser.offChainBalance
      });
      console.log(`✓ Emitted security_deposit_refunded to student_${rental.student}`);

      // Emit explicit status update for security deposit page
      io.to(`student_${rental.student}`).emit('security_deposit_status_updated', {
        rentalId: rental._id,
        status: 'refunded',
        reason: reason
      });
      console.log(`✓ Emitted security_deposit_status_updated to student_${rental.student}`);

      // Emit to landlord for contract termination AND security deposit page update
      io.to(`landlord_${userId}`).emit('contract_terminated', {
        rentalId: rental._id,
        propertyTitle: rental.propertyInfo.title,
        reason: reason
      });
      console.log(`✓ Emitted contract_terminated to landlord_${userId}`);

      // Emit to landlord for security deposit management page update
      io.to(`landlord_${userId}`).emit('security_deposit_refunded', {
        rentalId: rental._id,
        amount: rental.securityDepositAmount,
        reason: reason
      });
      console.log(`✓ Emitted security_deposit_refunded to landlord_${userId}`);

      io.to(`landlord_${userId}`).emit('security_deposit_status_updated', {
        rentalId: rental._id,
        status: 'refunded',
        reason: reason
      });
      console.log(`✓ Emitted security_deposit_status_updated to landlord_${userId}`);

      // Emit join request status updates for both parties
      if (joinRequest) {
        // Update student's join request page
        io.to(`student_${rental.student}`).emit('join_request_status_updated', {
          joinRequestId: joinRequest._id,
          status: 'terminated',
          terminationReason: reason,
          terminatedAt: new Date()
        });
        console.log(`✓ Emitted join_request_status_updated to student_${rental.student}`);

        // Update landlord's join request page
        io.to(`landlord_${userId}`).emit('join_request_status_updated', {
          joinRequestId: joinRequest._id,
          status: 'terminated',
          terminationReason: reason,
          terminatedAt: new Date()
        });
        console.log(`✓ Emitted join_request_status_updated to landlord_${userId}`);
      }
    }

    res.json({
      success: true,
      message: 'Security deposit refunded successfully and contract terminated',
      rental: {
        id: rental._id,
        status: rental.status,
        securityDepositStatus: rental.securityDepositStatus,
        terminationReason: rental.terminationReason
      }
    });
  } catch (error) {
    console.error('Error refunding security deposit:', error);
    res.status(500).json({ error: 'Failed to refund security deposit' });
  }
};

// Request refund by student (student-initiated automatic refund)
exports.requestRefundByStudent = async (req, res) => {
  try {
    const userId = req.user.id; // Student ID
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Refund reason is required' });
    }

    // Find active rental for the student
    const rental = await Rental.findOne({
      student: userId,
      status: { $in: ['registered', 'active'] }
    })
      .populate('property')
      .populate('landlord');

    if (!rental) {
      return res.status(404).json({ error: 'No active rental found' });
    }

    if (rental.securityDepositStatus !== 'paid') {
      return res.status(400).json({ error: 'Security deposit has not been paid yet' });
    }

    // Check if refund is allowed (before moving date)
    const now = new Date();
    const movingDate = new Date(rental.movingDate);
    
    if (now >= movingDate) {
      return res.status(400).json({ 
        error: 'Cannot refund security deposit after the moving date',
        movingDate: rental.movingDate
      });
    }

    // Get student user
    const studentUser = await User.findById(userId);

    // Refund to student's wallet (automatic)
    studentUser.offChainBalance += rental.securityDepositAmount;
    await studentUser.save();

    // Update rental record
    rental.securityDepositStatus = 'refunded';
    rental.securityDepositRefundedAt = new Date();
    rental.securityDepositRefundReason = reason;
    rental.status = 'terminated';
    rental.terminationReason = `Security deposit refunded by student - Reason: ${reason}`;
    rental.terminatedAt = new Date();
    rental.actionHistory.push({
      action: 'Security Deposit Refunded (Student Request)',
      amount: `$${rental.securityDepositAmount}`,
      date: new Date(),
      notes: `Refund reason: ${reason}`
    });
    await rental.save();

    // Update corresponding JoinRequest status to terminated
    const joinRequest = await JoinRequest.findOne({
      student: userId,
      property: rental.property,
      status: { $in: ['completed', 'waiting_completion'] }
    });

    if (joinRequest) {
      joinRequest.status = 'terminated';
      joinRequest.terminationReason = reason;
      joinRequest.terminatedAt = new Date();
      await joinRequest.save();
    }

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'deposit',
      amount: rental.securityDepositAmount,
      status: 'completed',
      rental: rental._id,
      relatedUser: rental.landlord,
      balanceAfter: studentUser.offChainBalance,
      description: `Security deposit refund - ${reason}`
    });
    await transaction.save();

    // Get student and landlord info for notifications
    const studentDoc = await Student.findOne({ user: userId });
    const landlordDoc = await Landlord.findOne({ user: rental.landlord });
    const landlordUser = await User.findById(rental.landlord);

    // Create notification for student
    const studentNotification = new Notification({
      recipient: studentDoc._id,
      recipientModel: 'Student',
      type: 'security_deposit_refunded',
      title: 'Security Deposit Refunded',
      message: `Your security deposit of $${rental.securityDepositAmount} for ${rental.propertyInfo.title} has been refunded to your wallet. The rental contract has been terminated.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await studentNotification.save();

    // Create notification for landlord
    const landlordNotification = new Notification({
      recipient: landlordDoc._id,
      recipientModel: 'Landlord',
      type: 'contract_terminated',
      title: 'Rental Contract Terminated',
      message: `The student ${studentUser.name} has requested a refund for ${rental.propertyInfo.title}. The security deposit of $${rental.securityDepositAmount} has been automatically refunded and the contract has been terminated. Reason: ${reason}`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });
    await landlordNotification.save();

    // Send email to student
    try {
      await emailService.sendEmail({
        to: studentUser.email,
        subject: 'Security Deposit Refunded - RentMates',
        text: `Your security deposit of $${rental.securityDepositAmount} for "${rental.propertyInfo.title}" has been refunded to your wallet.\n\nReason: ${reason}\n\nThe rental contract has been terminated. Your current balance is $${studentUser.offChainBalance}.\n\nThank you for using RentMates.`
      });
    } catch (emailError) {
      console.error('Error sending email to student:', emailError);
    }

    // Send email to landlord
    try {
      await emailService.sendEmail({
        to: landlordUser.email,
        subject: 'Rental Contract Terminated - Security Deposit Refunded',
        text: `The student ${studentUser.name} has requested a security deposit refund for your property "${rental.propertyInfo.title}".\n\nRefund Amount: $${rental.securityDepositAmount}\nReason: ${reason}\n\nThe security deposit has been automatically refunded to the student's wallet and the rental contract has been terminated.\n\nProperty Status: Available for new tenants`
      });
    } catch (emailError) {
      console.error('Error sending email to landlord:', emailError);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      console.log(`[SecurityDeposit] Emitting refund events (student-initiated) - Student: ${userId}, Landlord: ${rental.landlord}`);
      
      // Emit to student for security deposit page update
      io.to(`student_${userId}`).emit('security_deposit_refunded', {
        rentalId: rental._id,
        amount: rental.securityDepositAmount,
        reason: reason,
        newBalance: studentUser.offChainBalance
      });
      console.log(`✓ Emitted security_deposit_refunded to student_${userId}`);

      // Emit explicit status update for security deposit page
      io.to(`student_${userId}`).emit('security_deposit_status_updated', {
        rentalId: rental._id,
        status: 'refunded',
        reason: reason
      });
      console.log(`✓ Emitted security_deposit_status_updated to student_${userId}`);

      // Emit to landlord for contract termination
      io.to(`landlord_${rental.landlord}`).emit('contract_terminated', {
        rentalId: rental._id,
        propertyTitle: rental.propertyInfo.title,
        studentName: studentUser.name,
        reason: reason,
        refundAmount: rental.securityDepositAmount
      });
      console.log(`✓ Emitted contract_terminated to landlord_${rental.landlord}`);

      // Emit to landlord for security deposit management page update
      io.to(`landlord_${rental.landlord}`).emit('security_deposit_refunded', {
        rentalId: rental._id,
        amount: rental.securityDepositAmount,
        reason: reason
      });
      console.log(`✓ Emitted security_deposit_refunded to landlord_${rental.landlord}`);

      io.to(`landlord_${rental.landlord}`).emit('security_deposit_status_updated', {
        rentalId: rental._id,
        status: 'refunded',
        reason: reason
      });
      console.log(`✓ Emitted security_deposit_status_updated to landlord_${rental.landlord}`);

      // Emit join request status updates for both parties
      if (joinRequest) {
        // Update student's join request page
        io.to(`student_${userId}`).emit('join_request_status_updated', {
          joinRequestId: joinRequest._id,
          status: 'terminated',
          terminationReason: reason,
          terminatedAt: new Date()
        });
        console.log(`✓ Emitted join_request_status_updated to student_${userId}`);

        // Update landlord's join request page
        io.to(`landlord_${rental.landlord}`).emit('join_request_status_updated', {
          joinRequestId: joinRequest._id,
          status: 'terminated',
          terminationReason: reason,
          terminatedAt: new Date()
        });
        console.log(`✓ Emitted join_request_status_updated to landlord_${rental.landlord}`);
      }
    }

    res.json({
      success: true,
      message: 'Security deposit refunded successfully and contract terminated',
      refundAmount: rental.securityDepositAmount,
      newBalance: studentUser.offChainBalance,
      rental: {
        id: rental._id,
        status: rental.status,
        securityDepositStatus: rental.securityDepositStatus,
        terminationReason: rental.terminationReason
      }
    });
  } catch (error) {
    console.error('Error processing student refund request:', error);
    res.status(500).json({ error: 'Failed to process refund request' });
  }
};

// Get landlord's rental with security deposit info
exports.getLandlordRentalSecurityDeposit = async (req, res) => {
  try {
    const userId = req.user.id; // Landlord ID
    const { rentalId } = req.params;

    const rental = await Rental.findOne({
      _id: rentalId,
      landlord: userId
    })
      .populate('property')
      .populate('student');

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const now = new Date();
    const movingDate = new Date(rental.movingDate);
    const canRefund = rental.securityDepositStatus === 'paid' && now < movingDate;
    const daysUntilMoving = Math.ceil((movingDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      rental: {
        id: rental._id,
        status: rental.status,
        propertyTitle: rental.propertyInfo.title,
        studentName: rental.studentInfo.name,
        studentEmail: rental.studentInfo.email,
        securityDepositAmount: rental.securityDepositAmount,
        securityDepositStatus: rental.securityDepositStatus,
        securityDepositPaidAt: rental.securityDepositPaidAt,
        securityDepositRefundedAt: rental.securityDepositRefundedAt,
        securityDepositRefundReason: rental.securityDepositRefundReason,
        securityDepositDueDate: rental.securityDepositDueDate,
        movingDate: rental.movingDate,
        canRefund,
        daysUntilMoving
      }
    });
  } catch (error) {
    console.error('Error getting landlord rental security deposit:', error);
    res.status(500).json({ error: 'Failed to get rental information' });
  }
};

module.exports = {
  getSecurityDepositStatus: exports.getSecurityDepositStatus,
  paySecurityDeposit: exports.paySecurityDeposit,
  refundSecurityDeposit: exports.refundSecurityDeposit,
  requestRefundByStudent: exports.requestRefundByStudent,
  getLandlordRentalSecurityDeposit: exports.getLandlordRentalSecurityDeposit
};
