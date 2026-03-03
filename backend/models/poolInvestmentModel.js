const mongoose = require('mongoose');

const poolInvestmentSchema = new mongoose.Schema({
  // References
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentPool',
    required: true
  },
  
  // Investment Details
  amountInvested: { type: Number, required: true }, // USDT amount
  investmentDate: { type: Date, default: Date.now },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'withdrawn'],
    default: 'active'
  },
  
  // ROI at time of investment (locked in)
  lockedROI: { type: Number, required: true },
  
  // Expected maturity date (calculated from investment date + pool duration)
  maturityDate: { type: Date },
  
  // Earnings Tracking
  totalEarnings: { type: Number, default: 0 }, // Total interest earned
  principalReturned: { type: Number, default: 0 }, // Principal repaid back
  currentValue: { type: Number }, // Current portfolio value (invested + earnings - returned)
  
  // Real-time ROI tracking
  actualROI: { type: Number, default: 0 }, // Calculated based on actual returns
  
  // Repayment Distribution History
  repaymentDistributions: [{
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    installmentNumber: { type: Number },
    principalAmount: { type: Number }, // Portion of principal returned
    interestAmount: { type: Number }, // Interest/profit earned
    distributionDate: { type: Date, default: Date.now },
    transactionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }] // References to wallet transactions
  }],
  
  // Active Loans funded by this investment
  contributedLoans: [{
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    contributionAmount: { type: Number }, // How much of this investment went to this loan
    contributionPercentage: { type: Number }, // Percentage share in that loan
    status: { 
      type: String, 
      enum: ['active', 'completed', 'defaulted'],
      default: 'active'
    }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate maturity date before saving 
poolInvestmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const pool = await mongoose.model('InvestmentPool').findById(this.pool);
    if (pool) {
      // Set maturity date = investment date + duration months
      const maturityDate = new Date(this.investmentDate);
      maturityDate.setMonth(maturityDate.getMonth() + pool.durationMonths);
      this.maturityDate = maturityDate;
      // Initialize current value
      this.currentValue = this.amountInvested;
    }
  }
  next();
});

// Helper method to calculate days remaining until maturity
poolInvestmentSchema.methods.getDaysRemaining = function() {
  if (!this.maturityDate) return 0;
  const now = new Date();
  const diff = this.maturityDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Helper method to update current value and ROI
poolInvestmentSchema.methods.updateValue = function() {
  this.currentValue = this.amountInvested + this.totalEarnings - this.principalReturned;
  if (this.amountInvested > 0) {
    this.actualROI = ((this.totalEarnings + this.principalReturned) / this.amountInvested - 1) * 100;
  }
};

// Helper method to record a repayment distribution
poolInvestmentSchema.methods.recordDistribution = function(loanId, installmentNumber, principalAmount, interestAmount, transactionIds) {
  this.repaymentDistributions.push({
    loanId,
    installmentNumber,
    principalAmount,
    interestAmount,
    distributionDate: new Date(),
    transactionIds
  });
  
  this.principalReturned += principalAmount;
  this.totalEarnings += interestAmount;
  this.updateValue();
};

// Index for efficient queries (non-unique to allow multiple investments)
poolInvestmentSchema.index({ investor: 1, pool: 1 });

const PoolInvestment = mongoose.model('PoolInvestment', poolInvestmentSchema);

module.exports = PoolInvestment;
