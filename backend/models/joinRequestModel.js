const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  // References
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },

  // Request Details
  movingDate: {
    type: Date,
    required: true
  },
  bidAmount: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    maxlength: 500
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waiting_completion', 'completed'],
    default: 'pending'
  },

  // Contract data
  contract: {
    generatedAt: { type: Date },
    content: { type: String }, // Full formatted contract text
    // Contract details for easy access
    propertyTitle: { type: String },
    propertyAddress: { type: String },
    landlordName: { type: String },
    landlordGovId: { type: String },
    studentName: { type: String },
    studentGovId: { type: String },
    requestDate: { type: String },
    monthlyRent: { type: String },
    rentDueDay: { type: Number },
    securityDeposit: { type: String },
    leaseDuration: { type: String },
    leaseStartDate: { type: String },
    leaseEndDate: { type: String },
    moveInDate: { type: String },
    leaseDurationMonths: { type: Number, default: 12 },
    studentSignature: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      signature: { type: String } // Transaction hash or signature
    },
    landlordSignature: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      signature: { type: String }
    }
  },

  // Rejection reason
  rejectionReason: {
    type: String
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient queries
joinRequestSchema.index({ student: 1, status: 1 });
joinRequestSchema.index({ landlord: 1, status: 1 });
joinRequestSchema.index({ property: 1 });

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
module.exports = JoinRequest;
