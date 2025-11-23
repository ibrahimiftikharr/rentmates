const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Reference to User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Personal Information
  university: { type: String },
  course: { type: String },
  yearOfStudy: { type: String },
  nationality: { type: String },
  dateOfBirth: { type: Date },
  phone: { type: String },
  
  // Housing Preferences
  housingPreferences: {
    propertyType: [{ type: String }], // ['studio', 'apartment', 'shared']
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    moveInDate: { type: Date },
    stayDuration: { type: Number }, // in months
    preferredAreas: [{ type: String }],
    requireFurnished: { type: Boolean, default: false },
    petsRequired: { type: Boolean, default: false }
  },

  // Documents
  documents: {
    profileImage: { type: String }, // Cloudinary URL
    nationalId: { type: String }, // Cloudinary URL
    passport: { type: String }, // Cloudinary URL
    studentId: { type: String }, // Cloudinary URL
    proofOfEnrollment: { type: String }, // Cloudinary URL
  },

  // Bio
  bio: { type: String, maxlength: 500 },

  // Reputation & Trust
  reputationScore: { type: Number, default: 25 }, // Starts with email verified points
  
  // Profile Completion Tracking
  profileSteps: {
    basicInfo: { type: Boolean, default: false },
    housingPreferences: { type: Boolean, default: false },
    documentsUploaded: { type: Boolean, default: false },
    bioCompleted: { type: Boolean, default: false }
  },

  // Verification Status
  isEmailVerified: { type: Boolean, default: true }, // Set during signup
  isProfileComplete: { type: Boolean, default: false },
  
  // Wallet (for future implementation)
  walletLinked: { type: Boolean, default: false },

  // Wishlist
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],

  // Visit Requests
  visitRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisitRequest'
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Method to calculate reputation score dynamically
studentSchema.methods.calculateReputationScore = function() {
  let score = 0;
  
  // Email verified (already given at signup)
  if (this.isEmailVerified) score += 25;
  
  // Profile completion
  const allStepsComplete = Object.values(this.profileSteps).every(step => step === true);
  if (allStepsComplete) score += 30;
  
  // Documents uploaded (National ID or Passport)
  if (this.documents.nationalId || this.documents.passport) score += 25;
  
  // Wallet linked
  if (this.walletLinked) score += 20;
  
  return score;
};

// Method to get trust level based on reputation score
studentSchema.methods.getTrustLevel = function() {
  const score = this.reputationScore;
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very Low';
};

// Method to get number of completed tasks
studentSchema.methods.getCompletedTasks = function() {
  let count = 0;
  if (this.isEmailVerified) count++;
  if (this.profileSteps.basicInfo) count++;
  if (this.profileSteps.housingPreferences) count++;
  if (this.profileSteps.documentsUploaded) count++;
  if (this.profileSteps.bioCompleted) count++;
  if (this.walletLinked) count++;
  return count;
};

// Method to get number of documents uploaded
studentSchema.methods.getDocumentsCount = function() {
  const docs = this.documents;
  let count = 0;
  if (docs.profileImage) count++;
  if (docs.nationalId) count++;
  if (docs.passport) count++;
  if (docs.studentId) count++;
  if (docs.proofOfEnrollment) count++;
  return count;
};

// Pre-save hook to update reputation score and profile completion
studentSchema.pre('save', function(next) {
  // Recalculate reputation score
  this.reputationScore = this.calculateReputationScore();
  
  // Check if profile is complete
  const allStepsComplete = Object.values(this.profileSteps).every(step => step === true);
  this.isProfileComplete = allStepsComplete;
  
  next();
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
