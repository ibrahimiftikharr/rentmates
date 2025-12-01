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

  // Payment tracking - updated to include month/year info
  payments: [{
    amount: { type: Number },
    type: { type: String, enum: ['rent', 'security_deposit', 'other'] },
    paidAt: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue'] },
    forMonth: { type: Number }, // Month (0-11) this payment covers
    forYear: { type: Number }   // Year this payment covers
  }],

  // Current Rent Cycle (Simple Deterministic Tracking)
  currentRentCycle: {
    forMonth: { type: Number }, // Month (0-11) for current cycle
    forYear: { type: Number },  // Year for current cycle
    dueDate: { type: Date },    // Due date for current cycle
    paymentWindowStart: { type: Date }, // Date when payment window opens (20 days before due)
    amount: { type: Number },   // Rent amount for this cycle
    isPaid: { type: Boolean, default: false }, // Whether current cycle is paid
    paidAt: { type: Date }      // When it was paid (if paid)
  },

  // Auto-payment settings
  autoPaymentEnabled: {
    type: Boolean,
    default: false
  },
  autoPaymentLastAttempt: { type: Date }, // Track last auto-payment attempt
  autoPaymentLastStatus: { 
    type: String, 
    enum: ['success', 'insufficient_funds', 'error'],
    default: null
  },

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

/**
 * Initialize the current rent cycle (called when rental is created)
 */
rentalSchema.methods.initializeRentCycle = function() {
  const leaseStart = new Date(this.leaseStartDate);
  const dueDay = this.monthlyRentDueDate;
  
  // Set up first cycle
  const forMonth = leaseStart.getMonth();
  const forYear = leaseStart.getFullYear();
  const dueDate = new Date(forYear, forMonth, dueDay);
  
  // Payment window opens 20 days before due date
  const paymentWindowStart = new Date(dueDate);
  paymentWindowStart.setDate(paymentWindowStart.getDate() - 20);
  
  this.currentRentCycle = {
    forMonth,
    forYear,
    dueDate,
    paymentWindowStart,
    amount: this.monthlyRentAmount,
    isPaid: false,
    paidAt: null
  };
  
  console.log('✓ Initialized rent cycle:', {
    forMonth,
    forYear,
    dueDate: dueDate.toISOString(),
    paymentWindowStart: paymentWindowStart.toISOString()
  });
};

/**
 * Move to the next rent cycle (called after payment)
 */
rentalSchema.methods.moveToNextRentCycle = function() {
  if (!this.currentRentCycle) {
    this.initializeRentCycle();
    return;
  }
  
  // Calculate next month/year
  let nextMonth = this.currentRentCycle.forMonth + 1;
  let nextYear = this.currentRentCycle.forYear;
  
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }
  
  const dueDay = this.monthlyRentDueDate;
  const dueDate = new Date(nextYear, nextMonth, dueDay);
  
  // Payment window opens 20 days before due date
  const paymentWindowStart = new Date(dueDate);
  paymentWindowStart.setDate(paymentWindowStart.getDate() - 20);
  
  this.currentRentCycle = {
    forMonth: nextMonth,
    forYear: nextYear,
    dueDate,
    paymentWindowStart,
    amount: this.monthlyRentAmount,
    isPaid: false,
    paidAt: null
  };
  
  console.log('✓ Moved to next rent cycle:', {
    forMonth: nextMonth,
    forYear: nextYear,
    dueDate: dueDate.toISOString(),
    paymentWindowStart: paymentWindowStart.toISOString()
  });
};

/**
 * Get current rent cycle information
 */
rentalSchema.methods.getCurrentRentCycle = function() {
  // If no cycle exists, initialize it
  if (!this.currentRentCycle || this.currentRentCycle.forMonth === undefined || this.currentRentCycle.forMonth === null) {
    console.log('⚠ No rent cycle found, initializing...');
    this.initializeRentCycle();
  }
  
  const now = new Date();
  const dueDate = new Date(this.currentRentCycle.dueDate);
  const paymentWindowStart = new Date(this.currentRentCycle.paymentWindowStart);
  
  // Calculate days until due
  const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  
  // Check if payment window is open
  const canPayNow = now >= paymentWindowStart && !this.currentRentCycle.isPaid;
  
  // Days until payment window opens
  const daysUntilWindowOpens = canPayNow ? 0 : Math.ceil((paymentWindowStart - now) / (1000 * 60 * 60 * 24));
  
  // Check if this is the first rent payment
  const isFirstPayment = this.payments.filter(p => p.type === 'rent' && p.status === 'paid').length === 0;
  
  // Check if within first 3 days after move-in (for warning)
  const moveInDate = new Date(this.movingDate);
  const threeDaysAfterMoveIn = new Date(moveInDate);
  threeDaysAfterMoveIn.setDate(threeDaysAfterMoveIn.getDate() + 3);
  const shouldShowMoveInWarning = isFirstPayment && now < threeDaysAfterMoveIn;
  
  return {
    forMonth: this.currentRentCycle.forMonth,
    forYear: this.currentRentCycle.forYear,
    dueDate: this.currentRentCycle.dueDate,
    paymentWindowStart: this.currentRentCycle.paymentWindowStart,
    amount: this.currentRentCycle.amount,
    isPaid: this.currentRentCycle.isPaid,
    paidAt: this.currentRentCycle.paidAt,
    canPayNow,
    daysUntilDue,
    daysUntilWindowOpens,
    isFirstPayment,
    shouldShowMoveInWarning
  };
};

/**
 * Mark current cycle as paid and move to next
 */
rentalSchema.methods.markCycleAsPaidAndMoveNext = function() {
  if (!this.currentRentCycle) {
    throw new Error('No current rent cycle found');
  }
  
  // Mark current as paid
  this.currentRentCycle.isPaid = true;
  this.currentRentCycle.paidAt = new Date();
  
  console.log('✓ Marked cycle as paid:', {
    forMonth: this.currentRentCycle.forMonth,
    forYear: this.currentRentCycle.forYear
  });
  
  // Move to next cycle
  this.moveToNextRentCycle();
};

/**
 * Legacy method for backward compatibility
 */
rentalSchema.methods.getNextRentDueDate = function() {
  const cycle = this.getCurrentRentCycle();
  return cycle.dueDate;
};

/**
 * Legacy method - kept for backward compatibility
 */
rentalSchema.methods.isRentDueWithinDays = function(days) {
  const { daysUntilDue } = this.getCurrentRentCycle();
  return daysUntilDue <= days && daysUntilDue >= 0;
};

/**
 * Check if rent has been paid for a specific period (for history queries)
 */
rentalSchema.methods.isRentPaidForPeriod = function(month, year) {
  return this.payments.some(payment => 
    payment.type === 'rent' && 
    payment.status === 'paid' &&
    payment.forMonth === month &&
    payment.forYear === year
  );
};

const Rental = mongoose.model('Rental', rentalSchema);
module.exports = Rental;
