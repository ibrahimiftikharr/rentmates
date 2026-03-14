import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/card';
import { Button } from '../../../../shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../shared/ui/avatar';
import { Badge } from '../../../../shared/ui/badge';
import { Textarea } from '../../../../shared/ui/textarea';
import { 
  createReview, 
  getPropertyReviews, 
  checkReviewStatus, 
  updateReview, 
  deleteReview,
  type ReviewData, 
  type ReviewStats 
} from '../../../../shared/services/reviewService';
import { toast } from '../../../../shared/utils/toast';

interface PropertyReviewSectionProps {
  propertyId: string;
  onReviewChanged?: () => Promise<void> | void;
  onStatsChange?: (stats: ReviewStats) => void;
}

export const PropertyReviewSection: React.FC<PropertyReviewSectionProps> = ({ propertyId, onReviewChanged, onStatsChange }) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    thumbsUp: 0,
    thumbsDown: 0
  });
  const [hasReviewed, setHasReviewed] = useState(false);
  const [currentUserReview, setCurrentUserReview] = useState<ReviewData | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [thumbsUpDown, setThumbsUpDown] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (propertyId) {
      loadReviews();
      checkUserReviewStatus();
    }
  }, [propertyId]);

  const loadReviews = async () => {
    try {
      const data = await getPropertyReviews(propertyId);
      setReviews(data.reviews);
      setStats(data.stats);
      onStatsChange?.(data.stats);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      toast.error(error.response?.data?.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserReviewStatus = async () => {
    try {
      const data = await checkReviewStatus(propertyId);
      setHasReviewed(data.hasReviewed);
      setCurrentUserReview(data.review);
      setCurrentStudentId(data.currentStudentId);

      if (data.hasReviewed && data.review) {
        setRating(data.review.rating);
        setReviewText(data.review.reviewText);
        setThumbsUpDown(data.review.thumbsUpDown);
      }
    } catch (error: any) {
      console.error('Error checking review status:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (reviewText.trim().length === 0) {
      toast.error('Please write a review');
      return;
    }
    if (reviewText.length > 500) {
      toast.error('Review must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        propertyId,
        rating,
        reviewText: reviewText.trim(),
        thumbsUpDown
      });

      toast.success('Review submitted successfully!');

      // Reset form
      setRating(0);
      setReviewText('');
      setThumbsUpDown('up');

      // Reload reviews/status and trigger risk refresh in parent.
      await loadReviews();
      await checkUserReviewStatus();
      if (onReviewChanged) {
        await onReviewChanged();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = () => {
    if (currentUserReview) {
      setIsEditing(true);
      setRating(currentUserReview.rating);
      setReviewText(currentUserReview.reviewText);
      setThumbsUpDown(currentUserReview.thumbsUpDown);
    }
  };

  const handleUpdateReview = async () => {
    if (!currentUserReview) return;

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (reviewText.trim().length === 0) {
      toast.error('Please write a review');
      return;
    }
    if (reviewText.length > 500) {
      toast.error('Review must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateReview(currentUserReview._id, {
        rating,
        reviewText: reviewText.trim(),
        thumbsUpDown
      });

      toast.success('Review updated successfully!');
      setIsEditing(false);

      // Reload reviews/status and trigger risk refresh in parent.
      await loadReviews();
      await checkUserReviewStatus();
      if (onReviewChanged) {
        await onReviewChanged();
      }
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error(error.response?.data?.message || 'Failed to update review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentUserReview) return;

    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteReview(currentUserReview._id);

      toast.success('Review deleted successfully!');

      // Reset form and state
      setRating(0);
      setReviewText('');
      setThumbsUpDown('up');
      setIsEditing(false);

      // Reload reviews/status and trigger risk refresh in parent.
      await loadReviews();
      await checkUserReviewStatus();
      if (onReviewChanged) {
        await onReviewChanged();
      }
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (currentUserReview) {
      setRating(currentUserReview.rating);
      setReviewText(currentUserReview.reviewText);
      setThumbsUpDown(currentUserReview.thumbsUpDown);
    }
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= (interactive ? (hoveredRating || rating) : count)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Property Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.thumbsUp}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                Thumbs Up
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats.thumbsDown}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <ThumbsDown className="h-4 w-4" />
                Thumbs Down
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {(!hasReviewed || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit Your Review' : 'Write a Review'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Rating<span className="text-red-500">*</span>
              </label>
              {renderStars(rating, true)}
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Review<span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Share your experience with this property..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="text-sm text-gray-500 mt-1">
                {reviewText.length}/500 characters
              </div>
            </div>

            {/* Thumbs Up/Down */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Would you recommend this property?
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={thumbsUpDown === 'up' ? 'default' : 'outline'}
                  onClick={() => setThumbsUpDown('up')}
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={thumbsUpDown === 'down' ? 'default' : 'outline'}
                  onClick={() => setThumbsUpDown('down')}
                  className="flex items-center gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </Button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleUpdateReview} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Review'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleSubmitReview} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Existing Review (when not editing) */}
      {hasReviewed && !isEditing && currentUserReview && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Review</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditReview}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteReview}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={currentUserReview.student.profilePicture} />
                  <AvatarFallback>
                    {currentUserReview.student.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{currentUserReview.student.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(currentUserReview.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(currentUserReview.rating)}
                {currentUserReview.thumbsUpDown === 'up' ? (
                  <Badge variant="default" className="bg-green-500">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Not Recommended
                  </Badge>
                )}
              </div>
              <p className="text-gray-700">{currentUserReview.reviewText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Be the first to review this property!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const isCurrentUser = currentStudentId && review.student._id === currentStudentId;
                
                return (
                  <div
                    key={review._id}
                    className={`border rounded-lg p-4 ${isCurrentUser ? 'border-blue-300 bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.student.profilePicture} />
                          <AvatarFallback>
                            {review.student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.student.name}</span>
                            {isCurrentUser && (
                              <Badge variant="secondary">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.thumbsUpDown === 'up' ? (
                          <ThumbsUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ThumbsDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      {renderStars(review.rating)}
                    </div>
                    <p className="mt-2 text-gray-700">{review.reviewText}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
