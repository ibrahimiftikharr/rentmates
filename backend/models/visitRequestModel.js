const mongoose = require('mongoose');

const visitRequestSchema = new mongoose.Schema({
  // Student who requested the visit
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },

  // Property to visit
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },

  // Landlord who owns the property
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landlord',
    required: true
  },

  // Visit details
  visitType: {
    type: String,
    enum: ['virtual', 'in-person'],
    required: true
  },

  visitDate: {
    type: Date,
    required: true
  },

  visitTime: {
    type: String, // Format: "HH:mm" (e.g., "14:30")
    required: true
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rescheduled', 'rejected', 'completed'],
    default: 'pending'
  },

  // For virtual visits
  meetLink: {
    type: String
  },

  // Reschedule information
  rescheduledDate: {
    type: Date
  },

  rescheduledTime: {
    type: String
  },

  // Rejection reason
  rejectionReason: {
    type: String
  },

  // Landlord notes
  landlordNotes: {
    type: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
visitRequestSchema.index({ student: 1, status: 1 });
visitRequestSchema.index({ landlord: 1, status: 1 });
visitRequestSchema.index({ property: 1 });

const VisitRequest = mongoose.model('VisitRequest', visitRequestSchema);

module.exports = VisitRequest;
