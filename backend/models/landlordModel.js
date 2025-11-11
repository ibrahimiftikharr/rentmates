const mongoose = require('mongoose');

const landlordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Profile Information (Required for adding properties)
  phone: { type: String },
  nationality: { type: String },
  address: { type: String },
  profileImage: { type: String, default: '' }, // Cloudinary URL
  
  // Optional Documents (for reputation boost)
  governmentId: { type: String }, // ID number
  govIdDocument: { type: String, default: '' }, // Cloudinary URL for gov ID document
  
  // Reputation System
  reputationScore: { type: Number, default: 0, min: 0, max: 100 },
  
  // Property References
  properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  
  // Profile Completion
  isProfileComplete: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Method to check if profile is complete (only required fields)
landlordSchema.methods.checkProfileCompletion = function() {
  const requiredFields = [
    this.phone,
    this.nationality,
    this.address,
    this.profileImage
  ];
  
  this.isProfileComplete = requiredFields.every(field => field && field.trim() !== '');
  return this.isProfileComplete;
};

const Landlord = mongoose.model('Landlord', landlordSchema);
module.exports = Landlord;
