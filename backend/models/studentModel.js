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
  governmentId: { type: String }, // Government ID number
  
  // Interests
  interests: [{ type: String }],
  
  // Housing Preferences
  housingPreferences: {
    propertyType: [{ type: String }], // ['studio', 'apartment', 'shared']
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    moveInDate: { type: Date },
    furnished: { type: Boolean, default: false },
    billsIncluded: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false }
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

// Method to verify and update profile steps based on current data
studentSchema.methods.verifyProfileSteps = function() {
  // Check basic info completion
  const basicInfoComplete = !!(
    this.university && this.university.trim() !== '' &&
    this.course && this.course.trim() !== '' &&
    this.yearOfStudy && this.yearOfStudy.trim() !== '' &&
    this.nationality && this.nationality.trim() !== '' &&
    this.phone && this.phone.trim() !== '' &&
    this.dateOfBirth
  );
  
  // Check housing preferences completion
  const prefs = this.housingPreferences;
  const prefsComplete = !!(
    prefs &&
    prefs.budgetMin !== undefined && prefs.budgetMin > 0 &&
    prefs.budgetMax !== undefined && prefs.budgetMax > 0 &&
    prefs.moveInDate
  );
  
  // Check documents uploaded
  const docsComplete = !!(this.documents.nationalId || this.documents.passport);
  
  // Check bio completed
  const bioComplete = !!(this.bio && this.bio.trim().length > 0);
  
  // Update profile steps
  this.profileSteps.basicInfo = basicInfoComplete;
  this.profileSteps.housingPreferences = prefsComplete;
  this.profileSteps.documentsUploaded = docsComplete;
  this.profileSteps.bioCompleted = bioComplete;
  
  return {
    basicInfo: basicInfoComplete,
    housingPreferences: prefsComplete,
    documentsUploaded: docsComplete,
    bioCompleted: bioComplete
  };
};

// Method to calculate reputation score dynamically
studentSchema.methods.calculateReputationScore = function() {
  let score = 0;
  
  // Email verified (already given at signup)
  if (this.isEmailVerified) score += 25;
  
  // Profile completion - give points for each step (7.5 points per step = 30 total)
  if (this.profileSteps.basicInfo) score += 7.5;
  if (this.profileSteps.housingPreferences) score += 7.5;
  if (this.profileSteps.documentsUploaded) score += 7.5;
  if (this.profileSteps.bioCompleted) score += 7.5;
  
  // Documents uploaded (National ID or Passport) - 25 points
  if (this.documents.nationalId || this.documents.passport) score += 25;
  
  // Wallet linked - 20 points
  if (this.walletLinked) score += 20;
  
  return Math.round(score);
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
  const oldScore = this.reputationScore;
  this.reputationScore = this.calculateReputationScore();
  
  // Log score changes
  if (oldScore !== this.reputationScore) {
    console.log(`📊 Reputation score updated: ${oldScore} → ${this.reputationScore}`);
    console.log('Profile steps:', this.profileSteps);
  }
  
  // Check if profile is complete (all 4 steps must be true)
  const allStepsComplete = 
    this.profileSteps.basicInfo === true &&
    this.profileSteps.housingPreferences === true &&
    this.profileSteps.documentsUploaded === true &&
    this.profileSteps.bioCompleted === true;
  
  this.isProfileComplete = allStepsComplete;
  
  if (allStepsComplete) {
    console.log('✅ Profile is now complete!');
  }
  
  next();
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
