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
    enum: ['Student', 'Landlord']
  },

  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
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
      'security_deposit_due',
      'security_deposit_paid',
      'security_deposit_reminder',
      'security_deposit_refunded',
      'contract_terminated'
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
    enum: ['VisitRequest', 'Property', 'Message', 'Application', 'JoinRequest', 'Rental', 'InvestmentPool']
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
