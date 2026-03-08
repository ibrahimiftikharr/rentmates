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
    type: String, // Format: "HH:mm" (e.g., "14:30") - stored in UTC
    required: true
  },

  visitTimeEnd: {
    type: String, // Format: "HH:mm" for end of 30-minute slot - stored in UTC
    required: false
  },

  // Time zone information
  studentTimeZone: {
    type: String, // IANA time zone (e.g., "America/New_York")
    required: false
  },

  landlordTimeZone: {
    type: String, // IANA time zone
    required: false
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
    type: String // stored in UTC
  },

  rescheduledTimeEnd: {
    type: String // end time of rescheduled slot in UTC
  },

  // Rejection reason
  rejectionReason: {
    type: String
  },

  // Landlord notes
  landlordNotes: {
    type: String
  },

  // Completion timestamp
  completedAt: {
    type: Date
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
