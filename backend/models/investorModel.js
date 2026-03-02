const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  // Reference to User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Profile Information
  phone: { type: String },
  profileImage: { type: String, default: '' }, // Cloudinary URL

  // Reputation System
  reputationScore: { type: Number, default: 20, min: 0, max: 100 }, // Start with 20 pts for email verification

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;
