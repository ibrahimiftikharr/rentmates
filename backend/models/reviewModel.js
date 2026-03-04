const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    reviewText: {
      type: String,
      required: true,
      maxlength: 500
    },
    thumbsUpDown: {
      type: String,
      enum: ['up', 'down'],
      required: true
    }
  },
  { timestamps: true }
);

// Ensure a student can only review a property once
reviewSchema.index({ student: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
