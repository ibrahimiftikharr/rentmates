const Review = require('../models/reviewModel');
const Student = require('../models/studentModel');
const Property = require('../models/propertyModel');
const Notification = require('../models/notificationModel');
const mongoose = require('mongoose');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { propertyId, rating, reviewText, thumbsUpDown } = req.body;
    const userId = req.user.id;

    // Find the student by user ID
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if student has already reviewed this property
    const existingReview = await Review.findOne({
      student: student._id,
      property: propertyId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this property' });
    }

    // Create the review
    const review = new Review({
      student: student._id,
      property: propertyId,
      rating,
      reviewText,
      thumbsUpDown
    });

    await review.save();

    // Create notification for property owner
    const notification = new Notification({
      recipient: property.landlord,
      recipientModel: 'Landlord',
      type: 'property_update',
      title: 'New Review',
      message: `New review received for ${property.title}`,
      relatedId: propertyId,
      relatedModel: 'Property',
      metadata: {
        reviewId: review._id,
        rating: rating
      }
    });

    await notification.save();

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(property.landlord.toString()).emit('notification', {
        type: 'property_update',
        title: 'New Review',
        message: notification.message,
        propertyId: propertyId,
        reviewId: review._id,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reviews for a property with stats
exports.getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Get all reviews for the property with nested populate
    const reviews = await Review.find({ property: propertyId })
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name profilePicture'
        }
      })
      .sort({ createdAt: -1 });

    // Transform reviews to flatten the user data
    const transformedReviews = reviews
      .filter(review => review.student && review.student.user) // Filter out null students
      .map(review => ({
        _id: review._id,
        rating: review.rating,
        reviewText: review.reviewText,
        thumbsUpDown: review.thumbsUpDown,
        createdAt: review.createdAt,
        student: {
          _id: review.student._id,
          name: review.student.user.name,
          profilePicture: review.student.user.profilePicture
        }
      }));

    // Calculate stats
    const stats = await Review.aggregate([
      { $match: { property: new mongoose.Types.ObjectId(propertyId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          thumbsUp: {
            $sum: { $cond: [{ $eq: ['$thumbsUpDown', 'up'] }, 1, 0] }
          },
          thumbsDown: {
            $sum: { $cond: [{ $eq: ['$thumbsUpDown', 'down'] }, 1, 0] }
          }
        }
      }
    ]);

    const reviewStats = stats.length > 0 ? stats[0] : {
      averageRating: 0,
      totalReviews: 0,
      thumbsUp: 0,
      thumbsDown: 0
    };

    res.status(200).json({
      reviews: transformedReviews,
      stats: reviewStats
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if current user has reviewed a property
exports.checkReviewStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Find the student by user ID
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(200).json({ 
        hasReviewed: false, 
        review: null,
        currentStudentId: null
      });
    }

    // Check if student has reviewed this property
    const review = await Review.findOne({
      student: student._id,
      property: propertyId
    }).populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name profilePicture'
      }
    });

    if (review) {
      const transformedReview = {
        _id: review._id,
        rating: review.rating,
        reviewText: review.reviewText,
        thumbsUpDown: review.thumbsUpDown,
        createdAt: review.createdAt,
        student: {
          _id: review.student._id,
          name: review.student.user.name,
          profilePicture: review.student.user.profilePicture
        }
      };

      return res.status(200).json({
        hasReviewed: true,
        review: transformedReview,
        currentStudentId: student._id.toString()
      });
    }

    res.status(200).json({ 
      hasReviewed: false, 
      review: null,
      currentStudentId: student._id.toString()
    });
  } catch (error) {
    console.error('Error checking review status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText, thumbsUpDown } = req.body;
    const userId = req.user.id;

    // Find the student by user ID
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the review belongs to the current student
    if (review.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this review' });
    }

    // Update the review
    review.rating = rating;
    review.reviewText = reviewText;
    review.thumbsUpDown = thumbsUpDown;
    await review.save();

    res.status(200).json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find the student by user ID
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the review belongs to the current student
    if (review.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this review' });
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
