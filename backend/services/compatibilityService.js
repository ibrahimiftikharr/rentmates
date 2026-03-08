/**
 * Compatibility Service
 * Calculates compatibility scores between students using:
 * 1. Python ML Service (primary) - Machine Learning model with semantic analysis
 *    - Can be deployed locally (Flask) or on Modal.com (serverless)
 * 2. JavaScript fallback (backup) - Rule-based scoring if ML service unavailable
 * 
 * The ML service provides superior accuracy through:
 * - Sentence transformers for semantic text understanding
 * - Gradient boosting regression trained on compatibility patterns
 * - Advanced feature engineering (17+ features)
 */

const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://ibrahimiftikharr--rentmates-compatibility-predict-endpoint.modal.run';
const ML_TIMEOUT = parseInt(process.env.ML_TIMEOUT) || 10000; // 10 seconds for serverless
const USE_ML_SERVICE = process.env.USE_ML_SERVICE !== 'false'; // Default to true

// Modal endpoint configuration
const MODAL_ENDPOINTS = {
    predict: 'https://ibrahimiftikharr--rentmates-compatibility-predict-endpoint.modal.run',
    batchPredict: 'https://ibrahimiftikharr--rentmates-compatibility-predict-batch--ced605.modal.run',
    health: 'https://ibrahimiftikharr--rentmates-compatibility-health-endpoint.modal.run',
    train: 'https://ibrahimiftikharr--rentmates-compatibility-train-endpoint.modal.run'
};

// Check if using Modal.com deployment (serverless endpoints have different paths)
const IS_MODAL = ML_SERVICE_URL.includes('modal.run');

// Modal endpoint URLs are structured differently than local Flask
// Modal: https://username--app-name-endpoint-name.modal.run
// Flask: http://localhost:5001/endpoint-name
const getEndpointUrl = (endpoint) => {
  if (IS_MODAL) {
    // Use predefined Modal endpoints
    switch(endpoint) {
      case 'predict-endpoint':
      case 'predict':
        return MODAL_ENDPOINTS.predict;
      case 'predict-batch-endpoint':
      case 'predict-batch':
        return MODAL_ENDPOINTS.batchPredict;
      case 'health-endpoint':
      case 'health':
        return MODAL_ENDPOINTS.health;
      case 'train-endpoint':
      case 'train':
        return MODAL_ENDPOINTS.train;
      default:
        return `${ML_SERVICE_URL}/${endpoint}`;
    }
  } else {
    // Flask local development
    return `${ML_SERVICE_URL}/${endpoint}`;
  }
};

// Simple cosine similarity for text vectors (fallback only)
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
};

// Simple text to vector conversion (bag of words approach)
const textToVector = (text, vocabulary) => {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  return vocabulary.map(word => words.filter(w => w === word).length);
};

// Calculate structured attributes similarity
const calculateStructuredSimilarity = (student1, student2) => {
  let score = 0;
  let totalWeight = 0;

  // Budget overlap (weight: 3)
  if (student1.housingPreferences?.budgetMin && student2.housingPreferences?.budgetMin) {
    const budget1 = {
      min: student1.housingPreferences.budgetMin,
      max: student1.housingPreferences.budgetMax
    };
    const budget2 = {
      min: student2.housingPreferences.budgetMin,
      max: student2.housingPreferences.budgetMax
    };
    
    // Calculate overlap percentage
    const overlapMin = Math.max(budget1.min, budget2.min);
    const overlapMax = Math.min(budget1.max, budget2.max);
    const overlap = Math.max(0, overlapMax - overlapMin);
    const range1 = budget1.max - budget1.min;
    const range2 = budget2.max - budget2.min;
    const avgRange = (range1 + range2) / 2;
    
    if (avgRange > 0) {
      const budgetScore = Math.min(1, overlap / avgRange);
      score += budgetScore * 3;
    }
    totalWeight += 3;
  }

  // University match (weight: 2)
  if (student1.university && student2.university) {
    if (student1.university === student2.university) {
      score += 2;
    }
    totalWeight += 2;
  }

  // Course similarity (weight: 1.5)
  if (student1.course && student2.course) {
    const course1 = student1.course.toLowerCase();
    const course2 = student2.course.toLowerCase();
    
    // Exact match
    if (course1 === course2) {
      score += 1.5;
    }
    // Partial match (same field)
    else if (course1.includes(course2) || course2.includes(course1)) {
      score += 0.75;
    }
    totalWeight += 1.5;
  }

  // Year of study proximity (weight: 1)
  if (student1.yearOfStudy && student2.yearOfStudy) {
    const year1 = parseInt(student1.yearOfStudy.match(/\d+/)?.[0] || '0');
    const year2 = parseInt(student2.yearOfStudy.match(/\d+/)?.[0] || '0');
    const yearDiff = Math.abs(year1 - year2);
    
    // Same year: 1.0, 1 year diff: 0.7, 2 years: 0.4, 3+: 0
    const yearScore = yearDiff === 0 ? 1.0 : yearDiff === 1 ? 0.7 : yearDiff === 2 ? 0.4 : 0;
    score += yearScore * 1;
    totalWeight += 1;
  }

  // Nationality match (weight: 1)
  if (student1.nationality && student2.nationality) {
    if (student1.nationality === student2.nationality) {
      score += 1;
    }
    totalWeight += 1;
  }

  // Property type overlap (weight: 2)
  if (student1.housingPreferences?.propertyType?.length && student2.housingPreferences?.propertyType?.length) {
    const types1 = student1.housingPreferences.propertyType;
    const types2 = student2.housingPreferences.propertyType;
    const commonTypes = types1.filter(type => types2.includes(type));
    const unionSize = new Set([...types1, ...types2]).size;
    
    if (unionSize > 0) {
      const propertyScore = commonTypes.length / unionSize;
      score += propertyScore * 2;
    }
    totalWeight += 2;
  }

  // Housing preferences boolean matches (weight: 0.5 each)
  const booleanPrefs = ['furnished', 'billsIncluded', 'petsAllowed', 'smokingAllowed'];
  booleanPrefs.forEach(pref => {
    if (student1.housingPreferences?.[pref] !== undefined && 
        student2.housingPreferences?.[pref] !== undefined) {
      if (student1.housingPreferences[pref] === student2.housingPreferences[pref]) {
        score += 0.5;
      }
      totalWeight += 0.5;
    }
  });

  return totalWeight > 0 ? score / totalWeight : 0;
};

// Calculate text similarity (bio + interests)
const calculateTextSimilarity = (student1, student2) => {
  // Combine bio and interests into single text
  const text1 = [
    student1.bio || '',
    ...(student1.interests || [])
  ].join(' ').toLowerCase();

  const text2 = [
    student2.bio || '',
    ...(student2.interests || [])
  ].join(' ').toLowerCase();

  if (!text1 || !text2) return 0;

  // Build vocabulary from both texts
  const words1 = text1.split(/\W+/).filter(w => w.length > 2);
  const words2 = text2.split(/\W+/).filter(w => w.length > 2);
  const vocabulary = [...new Set([...words1, ...words2])];

  if (vocabulary.length === 0) return 0;

  // Convert to vectors and calculate similarity
  const vec1 = textToVector(text1, vocabulary);
  const vec2 = textToVector(text2, vocabulary);

  return cosineSimilarity(vec1, vec2);
};

/**
 * Calculate compatibility score between two students
 * Tries ML service first, falls back to rule-based calculation
 * 
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {Promise<Number>} Compatibility score (0-100)
 */
const calculateCompatibility = async (student1, student2) => {
  // Try ML service first
  const mlScore = await callMLService(student1, student2);
  
  if (mlScore !== null) {
    return mlScore;
  }

  // Fallback to rule-based calculation
  const structuredScore = calculateStructuredSimilarity(student1, student2);
  const textScore = calculateTextSimilarity(student1, student2);
  
  // Weighted average (70% structured, 30% text)
  const finalScore = (structuredScore * 0.7 + textScore * 0.3) * 100;
  
  return Math.round(Math.max(0, Math.min(100, finalScore)));
};

/**
 * Call ML Service for compatibility prediction
 * Works with both local Flask and Modal.com deployments
 * 
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {Promise<Number>} Compatibility score (0-100) or null if service unavailable
 */
const callMLService = async (student1, student2) => {
  if (!USE_ML_SERVICE) {
    return null;
  }

  try {
    const endpoint = IS_MODAL ? 'predict-endpoint' : 'predict';
    const url = getEndpointUrl(endpoint);

    const response = await axios.post(
      url,
      {
        student1: student1,
        student2: student2
      },
      {
        timeout: ML_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.success) {
      return response.data.compatibilityScore;
    }

    return null;
  } catch (error) {
    // ML service unavailable - will fallback to rule-based
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn('ML Service not available at', ML_SERVICE_URL);
    } else if (error.code === 'ETIMEDOUT') {
      console.warn('ML Service timeout at', ML_SERVICE_URL);
    } else {
      console.error('ML Service error:', error.message);
    }
    return null;
  }
};

/**
 * Call ML Service for batch predictions (more efficient)
 * Works with both local Flask and Modal.com deployments
 * 
 * @param {Object} currentStudent - The logged-in student
 * @param {Array} allStudents - Array of all other students
 * @returns {Promise<Object|null>} Map of studentId -> score, or null if service unavailable
 */
const callMLServiceBatch = async (currentStudent, allStudents) => {
  if (!USE_ML_SERVICE) {
    return null;
  }

  try {
    const endpoint = IS_MODAL ? 'predict-batch-endpoint' : 'predict-batch';
    const url = getEndpointUrl(endpoint);

    const response = await axios.post(
      url,
      {
        currentStudent: currentStudent,
        otherStudents: allStudents.map(s => s.toObject ? s.toObject() : s)
      },
      {
        timeout: ML_TIMEOUT * 2, // More time for batch
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.success) {
      // Convert array to map for easy lookup
      const scoreMap = {};
      response.data.scores.forEach(item => {
        scoreMap[item.studentId] = item.compatibilityScore;
      });
      return scoreMap;
    }

    return null;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn('ML Service not available for batch prediction');
    } else if (error.code === 'ETIMEDOUT') {
      console.warn('ML Service batch prediction timeout');
    } else {
      console.error('ML Service batch error:', error.message);
    }
    return null;
  }
};

/**
 * Calculate compatibility scores for a student against all other students
 * Tries ML service batch prediction first, falls back to individual calculations
 * 
 * @param {Object} currentStudent - The logged-in student
 * @param {Array} allStudents - Array of all other students
 * @returns {Promise<Array>} Students with compatibility scores, sorted by score
 */
const calculateCompatibilityScores = async (currentStudent, allStudents) => {
  // Filter out current student
  const otherStudents = allStudents.filter(
    student => student._id.toString() !== currentStudent._id.toString()
  );

  // Try batch prediction first
  const mlScores = await callMLServiceBatch(currentStudent, otherStudents);

  if (mlScores) {
    // Use ML scores
    return otherStudents
      .map(student => {
        const studentId = student._id.toString();
        return {
          ...student.toObject(),
          compatibilityScore: mlScores[studentId] || 50 // Default if missing
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  // Fallback: Calculate individually using rule-based
  const studentsWithScores = await Promise.all(
    otherStudents.map(async student => ({
      ...student.toObject(),
      compatibilityScore: await calculateCompatibility(currentStudent, student)
    }))
  );

  return studentsWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
};

module.exports = {
  calculateCompatibility,
  calculateCompatibilityScores,
  callMLService,
  callMLServiceBatch
};
