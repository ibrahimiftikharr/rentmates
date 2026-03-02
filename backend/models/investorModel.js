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
  
  // Verification Documents
  govIdDocument: { type: String, default: '' }, // Cloudinary URL for government ID or driver's license
  
  // Verification Status
  isVerified: { type: Boolean, default: false }, // True if govIdDocument is uploaded

  // Reputation System
  reputationScore: { type: Number, default: 20, min: 0, max: 100 }, // Start with 20 pts for email verification

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Method to check verification status based on document upload
investorSchema.methods.updateVerificationStatus = function() {
  this.isVerified = !!this.govIdDocument;
};

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;
