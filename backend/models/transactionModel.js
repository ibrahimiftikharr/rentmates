const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User who initiated the transaction
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Transaction type
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'rent_payment', 'rent_received'],
    required: true
  },

  // Amount in USDT
  amount: {
    type: Number,
    required: true
  },

  // Transaction status
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },

  // For rent payments - reference to rental
  rental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },

  // For rent payments - the other party (landlord for student, student for landlord)
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Blockchain transaction hash (for deposits and withdrawals)
  txHash: {
    type: String
  },

  // Balance after this transaction
  balanceAfter: {
    type: Number
  },

  // Additional notes or description
  description: {
    type: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ rental: 1 });
transactionSchema.index({ status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
