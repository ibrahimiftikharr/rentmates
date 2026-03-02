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
  maxInvestors: { type: Number, default: 50 }, // Maximum 50 investors per pool
  
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

const InvestmentPool = mongoose.model('InvestmentPool', investmentPoolSchema);

module.exports = InvestmentPool;
