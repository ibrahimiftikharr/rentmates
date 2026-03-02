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
  
  // Earnings (calculated when investment completes)
  totalEarnings: { type: Number, default: 0 },
  
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
    }
  }
  next();
});

// Index for efficient queries (non-unique to allow multiple investments)
poolInvestmentSchema.index({ investor: 1, pool: 1 });

const PoolInvestment = mongoose.model('PoolInvestment', poolInvestmentSchema);

module.exports = PoolInvestment;
