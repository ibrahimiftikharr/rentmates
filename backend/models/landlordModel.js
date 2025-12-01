const mongoose = require('mongoose');

const landlordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Profile Information (Required for adding properties)
  phone: { type: String },
  nationality: { type: String },
  address: { type: String },
  profileImage: { type: String, default: '' }, // Cloudinary URL
  
  // Required Documents
  governmentId: { type: String }, // Government ID number (required for accepting join requests)
  govIdDocument: { type: String, default: '' }, // Cloudinary URL for gov ID document
  
  // Reputation System
  reputationScore: { type: Number, default: 20, min: 0, max: 100 }, // Start with 20 pts for email verification
  
  // Property References
  properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  
  // Profile Completion
  isProfileComplete: { type: Boolean, default: false },
  
  // Notification Preferences (all enabled by default)
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    rentalBidsAlerts: { type: Boolean, default: true }, // Join request alerts
    messageAlerts: { type: Boolean, default: true }
  },
  
  // Privacy Settings (all visible by default)
  privacySettings: {
    showNationality: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: true }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Method to check if basic profile is complete (for adding properties)
landlordSchema.methods.checkBasicProfileCompletion = function() {
  const requiredFields = [
    this.phone,
    this.nationality,
    this.address,
    this.profileImage
  ];
  
  const isComplete = requiredFields.every(field => field && field.toString().trim() !== '');
  this.isProfileComplete = isComplete;
  return isComplete;
};

// Method to check if profile is complete (including govt ID for accepting join requests)
landlordSchema.methods.checkProfileCompletion = function() {
  const requiredFields = [
    this.phone,
    this.nationality,
    this.address,
    this.profileImage,
    this.governmentId,
    this.govIdDocument
  ];
  
  return requiredFields.every(field => field && field.toString().trim() !== '');
};

// Method to calculate reputation score
landlordSchema.methods.calculateReputationScore = async function() {
  let score = 0;
  
  console.log('--- Starting reputation calculation ---');
  console.log('Landlord user ID:', this.user);
  
  // Email Verified: 20 pts (check user model)
  const User = mongoose.model('User');
  const user = await User.findById(this.user);
  console.log('User found:', !!user);
  console.log('User isVerified:', user?.isVerified);
  
  if (user && user.isVerified) {
    score += 20;
    console.log('✓ Email verified: +20 pts');
  } else {
    console.log('✗ Email NOT verified');
  }
  
  // Profile Completed: 30 pts (phone, nationality, address, profileImage all filled)
  const profileFields = [
    this.phone,
    this.nationality,
    this.address,
    this.profileImage
  ];
  const isProfileComplete = profileFields.every(field => field && field.toString().trim() !== '');
  console.log('Profile complete:', isProfileComplete);
  
  if (isProfileComplete) {
    score += 30;
    console.log('✓ Profile completed: +30 pts');
  }
  
  // Government ID Uploaded: 25 pts (governmentId number AND document both uploaded)
  console.log('Gov ID:', !!this.governmentId, 'Gov Doc:', !!this.govIdDocument);
  
  if (this.governmentId && this.governmentId.trim() !== '' && 
      this.govIdDocument && this.govIdDocument.trim() !== '') {
    score += 25;
    console.log('✓ Government ID uploaded: +25 pts');
  }
  
  // Wallet Connected: 25 pts (check user model)
  console.log('Wallet address:', user?.walletAddress);
  
  if (user && user.walletAddress && user.walletAddress.trim() !== '') {
    score += 25;
    console.log('✓ Wallet connected: +25 pts');
  }
  
  console.log('--- Total score:', score, '---');
  
  this.reputationScore = Math.min(score, 100); // Cap at 100
  return this.reputationScore;
};

const Landlord = mongoose.model('Landlord', landlordSchema);
module.exports = Landlord;
