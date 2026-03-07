const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },

  recipientModel: {
    type: String,
    required: true,
    enum: ['Student', 'Landlord', 'Investor']
  },

  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
      // Visit & Property
      'visit_request',
      'visit_confirmed',
      'visit_rescheduled',
      'visit_rejected',
      'visit_completed',
      'message',
      'property_update',
      'application_status',
      'join_request',
      'pool_available',
      // Security Deposit
      'security_deposit_due',
      'security_deposit_paid',
      'security_deposit_reminder',
      'security_deposit_refunded',
      'contract_terminated',
      // Student Loan Notifications
      'loan_application_submitted',
      'loan_application_approved',
      'loan_application_rejected',
      'loan_disbursed',
      'loan_payment_reminder',
      'loan_payment_overdue',
      'loan_payment_success',
      'loan_default_warning',
      'loan_defaulted',
      'collateral_liquidation_initiated',
      'collateral_liquidated',
      'collateral_available_withdrawal',
      'loan_completed',
      'loan_queue_status_updated',
      'loan_queue_approved',
      'loan_queue_expired',
      // Investor Loan Notifications
      'loan_issued_from_pool',
      'loan_repayment_received',
      'investor_profit_earned',
      'pool_collateral_liquidated',
      'pool_utilization_high',
      'pool_utilization_low',
      'loan_default_in_pool',
      'investment_matured'
    ]
  },

  // Notification content
  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // Related data
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },

  relatedModel: {
    type: String,
    enum: ['VisitRequest', 'Property', 'Message', 'Application', 'JoinRequest', 'Rental', 'InvestmentPool', 'Loan']
  },

  // Additional data
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },

  // Status
  read: {
    type: Boolean,
    default: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
