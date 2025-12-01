const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
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
  joinRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JoinRequest',
    required: true
  },

  // Financial Details
  monthlyRentAmount: {
    type: Number,
    required: true
  },
  securityDepositAmount: {
    type: Number,
    required: true
  },

  // Important Dates
  movingDate: {
    type: Date,
    required: true
  },
  monthlyRentDueDate: {
    type: Number, // Day of month (1-31)
    required: true
  },
  securityDepositDueDate: {
    type: Date,
    required: true
  },
  contractSignedDate: {
    type: Date,
    required: true
  },
  leaseStartDate: {
    type: Date,
    required: true
  },
  leaseEndDate: {
    type: Date
  },

  // Contract Document
  signedContract: {
    content: { type: String, required: true },
    studentSignature: { type: String },
    landlordSignature: { type: String },
    generatedAt: { type: Date, required: true }
  },

  // Property Information (snapshot at time of rental)
  propertyInfo: {
    title: { type: String },
    address: { type: String },
    city: { type: String },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    furnishingStatus: { type: String }
  },

  // Student Information (snapshot)
  studentInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    governmentId: { type: String },
    university: { type: String }
  },

  // Landlord Information (snapshot)
  landlordInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    governmentId: { type: String }
  },

  // Rental Status
  status: {
    type: String,
    enum: ['registered', 'active', 'terminated', 'completed'],
    default: 'registered'
  },

  // Payment tracking
  payments: [{
    amount: { type: Number },
    type: { type: String, enum: ['rent', 'security_deposit', 'other'] },
    paidAt: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue'] }
  }],

  // Action history tracking
  actionHistory: [{
    action: { type: String, required: true },
    amount: { type: String },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    gasFee: { type: String }
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient queries
rentalSchema.index({ student: 1, status: 1 });
rentalSchema.index({ landlord: 1, status: 1 });
rentalSchema.index({ property: 1 });
rentalSchema.index({ monthlyRentDueDate: 1 });

// Calculate next rent due date
rentalSchema.methods.getNextRentDueDate = function() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const dueDay = this.monthlyRentDueDate;

  // Create date for this month's due date
  let nextDueDate = new Date(currentYear, currentMonth, dueDay);

  // If this month's due date has passed, move to next month
  if (nextDueDate <= now) {
    nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
  }

  return nextDueDate;
};

// Check if rent is due within specified days
rentalSchema.methods.isRentDueWithinDays = function(days) {
  const nextDue = this.getNextRentDueDate();
  const now = new Date();
  const daysUntilDue = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
  return daysUntilDue <= days && daysUntilDue >= 0;
};

const Rental = mongoose.model('Rental', rentalSchema);
module.exports = Rental;
