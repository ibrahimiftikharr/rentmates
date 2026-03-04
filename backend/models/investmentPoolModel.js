const mongoose = require('mongoose');

const investmentPoolSchema = new mongoose.Schema({
  // Pool Details
  name: { type: String, required: true, unique: true },
  description: { type: String },
  ltv: { type: Number, required: true }, // Loan-to-Value ratio (0.7, 0.8, 0.9)
  durationMonths: { type: Number, required: true }, // 6, 9, or 12 months
  
  // ROI Calculation Parameters
  baseRate: { type: Number, default: 4 }, // 4% annually
  riskMultiplier: { type: Number, default: 8 }, // 8% for risk premium calculation
  timePremiumRate: { type: Number, default: 0.5 }, // 0.5% per month
  
  // Investment Limits
  minInvestment: { type: Number, default: 1 }, // Minimum 1 USDT
  maxInvestment: { type: Number, default: 1000 }, // Maximum 1000 USDT
  maxCapital: { type: Number, default: 5000 }, // Maximum 5000 USDT total capital per pool
  maxInvestors: { type: Number, default: 50 }, // Deprecated: kept for backward compatibility
  
  // Pool Balance Tracking (Real-time)
  totalInvested: { type: Number, default: 0 }, // Total capital invested in pool (historical tracking, not used in share price)
  availableBalance: { type: Number, default: 0 }, // Available capital (can be withdrawn or lent)
  disbursedLoans: { type: Number, default: 0 }, // Outstanding principal on active loans
  
  // Share-Based Accounting
  totalShares: { type: Number, default: 0 }, // Total shares issued to all investors
  accruedInterest: { type: Number, default: 0 }, // Interest earned on loans (increases pool value)
  
  // Pool Status
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Method to calculate Expected ROI
investmentPoolSchema.methods.calculateROI = function() {
  // ROI = BaseRate + RiskPremium + TimePremium
  const baseRate = this.baseRate; // 4%
  const riskPremium = this.riskMultiplier * this.ltv; // 8% × LTV
  const timePremium = this.timePremiumRate * this.durationMonths; // 0.5% × T
  
  return baseRate + riskPremium + timePremium;
};

// Virtual field for ROI
investmentPoolSchema.virtual('expectedROI').get(function() {
  return this.calculateROI();
});

// Method to calculate total pool value (FULL ECONOMIC VALUE)
// Pool Value = Available Capital + Outstanding Principal + Accrued Interest
investmentPoolSchema.methods.getTotalPoolValue = function() {
  return this.availableBalance + this.disbursedLoans + this.accruedInterest;
};

// Method to calculate current share price using FULL POOL VALUE
// Share Price = Total Pool Value / Total Shares
// This ensures share price reflects ALL pool assets: cash, loans, and interest
investmentPoolSchema.methods.getSharePrice = function() {
  if (this.totalShares === 0) return 1; // Initial share price = 1 USDT
  const totalPoolValue = this.getTotalPoolValue();
  return totalPoolValue / this.totalShares;
};

const InvestmentPool = mongoose.model('InvestmentPool', investmentPoolSchema);

module.exports = InvestmentPool;
