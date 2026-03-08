const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'landlord', 'investor'], required: true },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  walletAddress: { type: String, default: null },
  offChainBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  notificationPreferences: {
    // Loan notifications (for students and investors)
    loanActivity: { type: Boolean, default: true },
    repayments: { type: Boolean, default: true },
    defaults: { type: Boolean, default: true },
    profits: { type: Boolean, default: true },
    
    // Property notifications (for students and landlords)
    propertyUpdates: { type: Boolean, default: true },
    visitRequests: { type: Boolean, default: true },
    joinRequests: { type: Boolean, default: true },
    
    // Investment pool notifications (for investors)
    poolUpdates: { type: Boolean, default: true },
    
    // General notifications
    systemAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
