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

// Method to calculate Annual Percentage Rate (APR)
// This is used for loan interest calculation
investmentPoolSchema.methods.calculateAPR = function() {
  // APR = BaseRate + RiskPremium + TimePremium
  const baseRate = this.baseRate; // 4%
  const riskPremium = this.riskMultiplier * this.ltv; // 8% × LTV
  const timePremium = this.timePremiumRate * this.durationMonths; // 0.5% × T
  
  return baseRate + riskPremium + timePremium;
};

// DEPRECATED: Use calculateAPR() instead
// Kept for backward compatibility
investmentPoolSchema.methods.calculateROI = function() {
  return this.calculateAPR();
};

// Calculate the actual total interest that will be earned from a loan
// using amortized repayment formula
investmentPoolSchema.methods.calculateLoanInterest = function(principal) {
  const annualRate = this.calculateAPR();
  const months = this.durationMonths;
  const monthlyRate = annualRate / 100 / 12;
  
  // Handle edge case: 0% interest
  if (monthlyRate === 0) {
    return 0;
  }
  
  // Calculate monthly payment using amortization formula
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  const monthlyPayment = principal * (numerator / denominator);
  
  // Total interest = Total payments - Principal
  const totalRepayment = monthlyPayment * months;
  const totalInterest = totalRepayment - principal;
  
  return totalInterest;
};

// Calculate the effective ROI for the loan duration (not annualized)
// This shows the actual percentage return investors will earn
investmentPoolSchema.methods.calculateEffectiveROI = function(principal) {
  const totalInterest = this.calculateLoanInterest(principal);
  const effectiveROI = (totalInterest / principal) * 100;
  return effectiveROI;
};

// Virtual field for APR (backward compatibility)
investmentPoolSchema.virtual('expectedROI').get(function() {
  return this.calculateAPR();
});

// Method to calculate total pool value (FULL ECONOMIC VALUE)
// Pool Value = Available Capital + Outstanding Principal
// Note: Interest is included in availableBalance when loans are repaid
// Do NOT add accruedInterest separately as it would double-count
investmentPoolSchema.methods.getTotalPoolValue = function() {
  return this.availableBalance + this.disbursedLoans;
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
