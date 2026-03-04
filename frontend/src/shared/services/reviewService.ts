import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reviews';

export interface ReviewData {
  _id: string;
  rating: number;
  reviewText: string;
  thumbsUpDown: 'up' | 'down';
  createdAt: string;
  student: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  thumbsUp: number;
  thumbsDown: number;
}

export interface ReviewFormData {
  propertyId: string;
  rating: number;
  reviewText: string;
  thumbsUpDown: 'up' | 'down';
}

// Create a new review
export const createReview = async (reviewData: ReviewFormData): Promise<{ message: string; review: ReviewData }> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, reviewData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get all reviews for a property
export const getPropertyReviews = async (propertyId: string): Promise<{ reviews: ReviewData[]; stats: ReviewStats }> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/property/${propertyId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Check if user has reviewed a property
export const checkReviewStatus = async (propertyId: string): Promise<{ hasReviewed: boolean; review: ReviewData | null; currentStudentId: string | null }> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/check/${propertyId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Update a review
export const updateReview = async (reviewId: string, reviewData: Omit<ReviewFormData, 'propertyId'>): Promise<{ message: string; review: ReviewData }> => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/${reviewId}`, reviewData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<{ message: string }> => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
