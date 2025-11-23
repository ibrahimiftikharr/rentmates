/**
 * Compatibility Service
 * Calculates compatibility scores between students based on:
 * 1. Structured attributes (budget, housing preferences, university, etc.)
 * 2. Text similarity (bio and interests)
 */

// Simple cosine similarity for text vectors
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
 * Calculate overall compatibility score between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @param {Number} alpha - Weight for structured score (0-1), default 0.6
 * @returns {Number} Compatibility score (0-100)
 */
const calculateCompatibility = (student1, student2, alpha = 0.6) => {
  // Calculate both components
  const structuredScore = calculateStructuredSimilarity(student1, student2);
  const textScore = calculateTextSimilarity(student1, student2);

  // Weighted combination
  const finalScore = (alpha * structuredScore) + ((1 - alpha) * textScore);

  // Convert to percentage (0-100)
  return Math.round(finalScore * 100);
};

/**
 * Calculate compatibility scores for a student against all other students
 * @param {Object} currentStudent - The logged-in student
 * @param {Array} allStudents - Array of all other students
 * @returns {Array} Students with compatibility scores, sorted by score
 */
const calculateCompatibilityScores = (currentStudent, allStudents) => {
  return allStudents
    .filter(student => student._id.toString() !== currentStudent._id.toString())
    .map(student => ({
      ...student.toObject(),
      compatibilityScore: calculateCompatibility(currentStudent, student)
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
};

module.exports = {
  calculateCompatibility,
  calculateCompatibilityScores
};
