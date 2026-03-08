const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'Landlord', required: true },
  
  // Basic Information
  title: { type: String, required: true },
  description: { type: String, required: true },
  // Keep in sync with frontend Add/Edit Property type options.
  type: { type: String, enum: ['flat', 'house', 'studio'], required: true },
  
  // Location
  address: { type: String },
  city: { type: String },
  country: { type: String },
  
  // Property Details
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  area: { type: Number }, // Square feet/meters
  furnished: { type: Boolean, default: false },
  
  // Pricing
  price: { type: Number, required: true }, // Monthly rent
  currency: { type: String, default: 'USD' },
  deposit: { type: Number }, // Security deposit
  areaAverageRent: { type: Number }, // Market average rent for comparison
  
  // Amenities & Bills
  amenities: [{ type: String }], // ['WiFi', 'Parking', 'Gym', etc.]
  amenitiesCount: { type: Number, default: 0 }, // Number of amenities for fraud detection
  billsIncluded: [{ type: String }], // ['Water', 'Gas', 'Electricity', etc.] - bills covered in base rent
  billsIncludedCount: { type: Number, default: 0 }, // Number of bills included in rent for fraud detection
  billsCost: {
    // Cost of bills NOT included in rent (extra monthly costs)
    wifi: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    electricity: { type: Number, default: 0 },
    gas: { type: Number, default: 0 },
    councilTax: { type: Number, default: 0 }
  },
  billsExtraCost: { type: Number, default: 0 }, // Total monthly cost of bills NOT included (for fraud detection)
  
  // Images
  images: [{ type: String }], // Cloudinary URLs
  mainImage: { type: String }, // Primary image URL
  
  // Availability
  availableFrom: { type: Date },
  minimumStay: { type: Number }, // In months
  maximumStay: { type: Number }, // In months
  availabilityDates: [{ type: Date }], // Specific dates when property is available for viewing
  moveInBy: { type: Date }, // Deadline for moving in
  
  // House Rules
  houseRules: {
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    guestsAllowed: { type: Boolean, default: true }
  },
  
  // Fraud Detection Fields
  priceRatio: { type: Number }, // price / area_average_rent - values > 1.3 or < 0.7 are suspicious
  depositRatio: { type: Number }, // deposit amount divided by monthly price
  depositFlag: { type: Boolean, default: false }, // true if depositRatio outside normal range

  // scam inspection results
  scam_prediction: { type: Boolean },
  scam_probability: { type: Number },
  scam_explanations: [{
    feature: { type: String },
    impact: { type: String },
    score: { type: Number },
    direction: { type: String }
  }],
  scam_summary: {
    label: { type: String },
    confidence: { type: Number },
    scam_probability: { type: Number },
    top_factors: [{
      feature: { type: String },
      score: { type: Number },
      direction: { type: String },
      impact: { type: String }
    }]
  },
  scam_checked_at: { type: Date },
  
  // Status
  status: { type: String, enum: ['active', 'inactive', 'rented'], default: 'active' },
  
  // Stats
  views: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;
