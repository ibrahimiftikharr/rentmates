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
  amountInvested: { type: Number, required: true }, // USDT amount invested
  investmentDate: { type: Date, default: Date.now },
  
  // Share-Based Accounting
  shares: { type: Number, required: true }, // Number of shares owned
  entrySharePrice: { type: Number, required: true }, // Share price at time of investment
  
  // Status
  status: {
    type: String,
    enum: ['active', 'withdrawn'],
    default: 'active'
  },
  
  // ROI at time of investment (for reference only, not locked)
  lockedROI: { type: Number, required: true },
  
  // Earnings Tracking (calculated from share value appreciation)
  totalEarnings: { type: Number, default: 0 }, // Total interest earned
  currentValue: { type: Number }, // Current portfolio value based on share price
  
  // Real-time ROI tracking
  actualROI: { type: Number, default: 0 }, // Calculated based on current share price
  
  // Earnings History (for transparency and performance graph)
  earningsHistory: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number }, // Earnings for this entry
    sharePrice: { type: Number }, // Share price at this time
    totalValue: { type: Number }, // Total investment value at this time
    source: { type: String } // 'loan_repayment', 'interest_accrual', etc.
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Initialize current value on new investment
poolInvestmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.currentValue = this.amountInvested;
    this.totalEarnings = 0;
    this.actualROI = 0;
  }
  next();
});

// Helper method to calculate current value based on share price
poolInvestmentSchema.methods.getCurrentValue = async function() {
  const pool = await mongoose.model('InvestmentPool').findById(this.pool);
  if (!pool) return this.amountInvested;
  const currentSharePrice = pool.getSharePrice();
  return this.shares * currentSharePrice;
};

// Helper method to update current value and ROI
poolInvestmentSchema.methods.updateValue = async function() {
  const currentValue = await this.getCurrentValue();
  this.currentValue = currentValue;
  this.totalEarnings = currentValue - this.amountInvested;
  if (this.amountInvested > 0) {
    this.actualROI = ((currentValue - this.amountInvested) / this.amountInvested) * 100;
  }
};

// Helper method to record earning event
poolInvestmentSchema.methods.recordEarning = async function(amount, source = 'loan_repayment') {
  const pool = await mongoose.model('InvestmentPool').findById(this.pool);
  const sharePrice = pool ? pool.getSharePrice() : this.entrySharePrice;
  const totalValue = this.shares * sharePrice;
  
  this.earningsHistory.push({
    date: new Date(),
    amount,
    sharePrice,
    totalValue,
    source
  });
  
  await this.updateValue();
};

// Index for efficient queries (non-unique to allow multiple investments)
poolInvestmentSchema.index({ investor: 1, pool: 1 });

const PoolInvestment = mongoose.model('PoolInvestment', poolInvestmentSchema);

module.exports = PoolInvestment;
