const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'Landlord', required: true },
  
  // Basic Information
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['flat', 'house', 'studio', 'apartment'], required: true },
  
  // Location
  address: { type: String },
  
  // Property Details
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  area: { type: Number }, // Square feet/meters
  furnished: { type: Boolean, default: false },
  
  // Pricing
  price: { type: Number, required: true }, // Monthly rent
  currency: { type: String, default: 'USD' },
  deposit: { type: Number }, // Security deposit
  
  // Amenities & Bills
  amenities: [{ type: String }], // ['WiFi', 'Parking', 'Gym', etc.]
  billsIncluded: [{ type: String }], // ['Water', 'Gas', 'Electricity', etc.]
  billPrices: {
    wifi: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    electricity: { type: Number, default: 0 },
    gas: { type: Number, default: 0 },
    councilTax: { type: Number, default: 0 }
  },
  
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
