"""
Feature Engineering for Student Flatmate Compatibility Prediction

Extracts and encodes structured and textual profile features for the ML model
"""
import numpy as np
from typing import Dict, List, Tuple
from sentence_transformers import SentenceTransformer
import re


class FeatureEngineer:
    """Transforms raw student data into ML-ready features"""
    
    def __init__(self, encoder_model='all-MiniLM-L6-v2'):
        """
        Initialize feature engineer with sentence transformer
        
        Args:
            encoder_model: HuggingFace model for text embeddings
        """
        self.text_encoder = SentenceTransformer(encoder_model)
        self.embedding_dim = 384  # Dimension of all-MiniLM-L6-v2 embeddings
        
    def extract_features(self, student1: Dict, student2: Dict) -> np.ndarray:
        """
        Extract comprehensive features from two student profiles
        
        Returns:
            Combined feature vector for compatibility prediction
        """
        # Extract structured features
        structured_features = self._extract_structured_features(student1, student2)
        
        # Extract text-based features
        text_features = self._extract_text_features(student1, student2)
        
        # Combine all features
        all_features = np.concatenate([structured_features, text_features])
        
        return all_features
    
    def _extract_structured_features(self, s1: Dict, s2: Dict) -> np.ndarray:
        """Extract rule-based and categorical features"""
        features = []
        
        # Handle both nested (API) and flat (CSV) formats
        budget1 = s1.get('budget', s1.get('housingPreferences', {}))
        budget2 = s2.get('budget', s2.get('housingPreferences', {}))
        
        # 1. Budget Compatibility (0-1)
        budget_score = self._calculate_budget_overlap_direct(budget1, budget2)
        features.append(budget_score)
        
        # 2. University Match (binary)
        university1 = str(s1.get('university', '')) if s1.get('university') else ''
        university2 = str(s2.get('university', '')) if s2.get('university') else ''
        university_match = float(university1.lower() == university2.lower())
        features.append(university_match)
        
        # 3. Course Similarity (0-1)
        course_sim = self._calculate_course_similarity(
            s1.get('course', ''),
            s2.get('course', '')
        )
        features.append(course_sim)
        
        # 4. Year of Study Proximity (0-1)
        year_proximity = self._calculate_year_proximity(
            s1.get('yearOfStudy', ''),
            s2.get('yearOfStudy', '')
        )
        features.append(year_proximity)
        
        # 5. Age Difference (normalized)
        age1 = s1.get('age', 20)
        age2 = s2.get('age', 20)
        age_diff = abs(age1 - age2)
        age_score = 1.0 / (1.0 + age_diff)
        features.append(age_score)
        
        # 6. Nationality Match (binary)
        nationality1 = str(s1.get('nationality', '')) if s1.get('nationality') else ''
        nationality2 = str(s2.get('nationality', '')) if s2.get('nationality') else ''
        nationality_match = float(nationality1.lower() == nationality2.lower())
        features.append(nationality_match)
        
        # 7. Property Type Overlap (0-1 Jaccard)
        prop1 = s1.get('propertyType', s1.get('housingPreferences', {}).get('propertyType', []))
        prop2 = s2.get('propertyType', s2.get('housingPreferences', {}).get('propertyType', []))
        property_overlap = self._calculate_set_overlap(prop1, prop2)
        features.append(property_overlap)
        
        # 8. Lifestyle Compatibility Score
        lifestyle_score = self._calculate_lifestyle_compatibility(s1, s2)
        features.append(lifestyle_score)
        
        # 9. Smoking Match
        smoking_score = self._calculate_smoking_compatibility(
            s1.get('smoking', s1.get('housingPreferences', {}).get('smokingAllowed')),
            s2.get('smoking', s2.get('housingPreferences', {}).get('smokingAllowed'))
        )
        features.append(smoking_score)
        
        # 10. Pet Compatibility
        pet_score = self._calculate_pet_compatibility(
            s1.get('petFriendly', s1.get('housingPreferences', {}).get('petsAllowed')),
            s2.get('petFriendly', s2.get('housingPreferences', {}).get('petsAllowed'))
        )
        features.append(pet_score)
        
        # 11. Cleanliness Match
        clean_score = self._calculate_cleanliness_match(
            s1.get('cleanliness', ''),
            s2.get('cleanliness', '')
        )
        features.append(clean_score)
        
        # 12. Noise Tolerance Match
        noise_score = self._calculate_noise_match(
            s1.get('noiseTolerance', ''),
            s2.get('noiseTolerance', '')
        )
        features.append(noise_score)
        
        return np.array(features, dtype=np.float32)
    
    def _extract_text_features(self, s1: Dict, s2: Dict) -> np.ndarray:
        """Extract semantic features from text using embeddings"""
        
        # Combine bio and interests into comprehensive text
        text1 = self._prepare_text(s1)
        text2 = self._prepare_text(s2)
        
        # Generate embeddings
        emb1 = self.text_encoder.encode(text1, convert_to_numpy=True)
        emb2 = self.text_encoder.encode(text2, convert_to_numpy=True)
        
        # Calculate various similarity metrics
        features = []
        
        # 1. Cosine similarity
        cosine_sim = self._cosine_similarity(emb1, emb2)
        features.append(cosine_sim)
        
        # 2. Euclidean distance (normalized)
        euclidean_dist = np.linalg.norm(emb1 - emb2)
        normalized_dist = 1 / (1 + euclidean_dist)  # Convert to similarity
        features.append(normalized_dist)
        
        # 3. Element-wise absolute difference (mean)
        abs_diff_mean = np.mean(np.abs(emb1 - emb2))
        features.append(1 - min(abs_diff_mean, 1.0))
        
        # 4-5. Individual embeddings statistics
        features.append(np.mean(emb1))
        features.append(np.mean(emb2))
        
        return np.array(features, dtype=np.float32)
    
    def _prepare_text(self, student: Dict) -> str:
        """Prepare comprehensive text from student profile"""
        parts = []
        
        # Bio
        if student.get('bio'):
            parts.append(student['bio'])
        
        # Interests
        interests = student.get('interests', [])
        if interests:
            parts.append(' '.join(interests))
        
        # Course (for context)
        if student.get('course'):
            parts.append(f"Studying {student['course']}")
        
        # Lifestyle preferences as text
        prefs = student.get('housingPreferences', {})
        lifestyle = []
        if prefs.get('petsAllowed'):
            lifestyle.append("pet friendly")
        if prefs.get('smokingAllowed'):
            lifestyle.append("smoking allowed")
        if not prefs.get('smokingAllowed'):
            lifestyle.append("non-smoking")
        
        if lifestyle:
            parts.append(' '.join(lifestyle))
        
        return ' '.join(parts) if parts else "No information provided"
    
    def _calculate_budget_overlap(self, prefs1: Dict, prefs2: Dict) -> float:
        """Calculate budget range overlap (0-1)"""
        min1 = prefs1.get('budgetMin', 0)
        max1 = prefs1.get('budgetMax', 0)
        min2 = prefs2.get('budgetMin', 0)
        max2 = prefs2.get('budgetMax', 0)
        
        if not all([min1, max1, min2, max2]):
            return 0.5  # Neutral if data missing
        
        overlap_min = max(min1, min2)
        overlap_max = min(max1, max2)
        overlap = max(0, overlap_max - overlap_min)
        
        range1 = max1 - min1
        range2 = max2 - min2
        avg_range = (range1 + range2) / 2
        
        return min(1.0, overlap / avg_range) if avg_range > 0 else 0.0
    
    def _calculate_budget_difference(self, prefs1: Dict, prefs2: Dict) -> float:
        """Calculate normalized budget difference"""
        mid1 = (prefs1.get('budgetMin', 0) + prefs1.get('budgetMax', 0)) / 2
        mid2 = (prefs2.get('budgetMin', 0) + prefs2.get('budgetMax', 0)) / 2
        
        if mid1 == 0 or mid2 == 0:
            return 0.5
        
        diff = abs(mid1 - mid2)
        avg = (mid1 + mid2) / 2
        
        return 1.0 - min(1.0, diff / avg)
    
    def _calculate_course_similarity(self, course1, course2) -> float:
        """Calculate course similarity"""
        if not course1 or not course2:
            return 0.5
        
        # Ensure strings
        c1 = str(course1).lower().strip()
        c2 = str(course2).lower().strip()
        
        # Exact match
        if c1 == c2:
            return 1.0
        
        # Partial match (one contains other)
        if c1 in c2 or c2 in c1:
            return 0.75
        
        # Check for common keywords (STEM, Business, Arts, etc.)
        stem_keywords = ['computer', 'engineering', 'science', 'mathematics', 'physics', 'chemistry']
        business_keywords = ['business', 'management', 'finance', 'economics', 'accounting']
        arts_keywords = ['art', 'design', 'music', 'literature', 'history', 'language']
        
        def get_category(course):
            course_lower = course.lower()
            if any(kw in course_lower for kw in stem_keywords):
                return 'stem'
            if any(kw in course_lower for kw in business_keywords):
                return 'business'
            if any(kw in course_lower for kw in arts_keywords):
                return 'arts'
            return 'other'
        
        if get_category(c1) == get_category(c2):
            return 0.5
        
        return 0.25
    
    def _calculate_year_proximity(self, year1: str, year2: str) -> float:
        """Calculate year of study proximity (0-1)"""
        if not year1 or not year2:
            return 0.5
        
        # Convert to string if integer, then extract numeric year
        year1_str = str(year1) if isinstance(year1, (int, float)) else year1
        year2_str = str(year2) if isinstance(year2, (int, float)) else year2
        
        num1 = int(re.search(r'\d+', year1_str).group()) if re.search(r'\d+', year1_str) else 0
        num2 = int(re.search(r'\d+', year2_str).group()) if re.search(r'\d+', year2_str) else 0
        
        if num1 == 0 or num2 == 0:
            return 0.5
        
        diff = abs(num1 - num2)
        
        # Same year: 1.0, 1 year diff: 0.7, 2 years: 0.4, 3+: 0.1
        if diff == 0:
            return 1.0
        elif diff == 1:
            return 0.7
        elif diff == 2:
            return 0.4
        else:
            return 0.1
    
    def _calculate_set_overlap(self, set1: List, set2: List) -> float:
        """Calculate Jaccard similarity for sets"""
        if not set1 or not set2:
            return 0.5
        
        s1 = set(set1)
        s2 = set(set2)
        
        intersection = len(s1 & s2)
        union = len(s1 | s2)
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_budget_overlap_direct(self, budget1: Dict, budget2: Dict) -> float:
        """Calculate budget range overlap for flat format (0-1)"""
        min1 = budget1.get('min', 0)
        max1 = budget1.get('max', 0)
        min2 = budget2.get('min', 0)
        max2 = budget2.get('max',0)
        
        if not all([min1, max1, min2, max2]):
            return 0.5
        
        overlap_start = max(min1, min2)
        overlap_end = min(max1, max2)
        overlap = max(0, overlap_end - overlap_start)
        
        range1 = max1 - min1
        range2 = max2 - min2
        avg_range = (range1 + range2) / 2
        
        return min(1.0, overlap / avg_range) if avg_range > 0 else 0.0
    
    def _calculate_lifestyle_compatibility(self, s1: Dict, s2: Dict) -> float:
        """Calculate overall lifestyle compatibility"""
        scores = []
        
        # Cleanliness
        clean1 = s1.get('cleanliness', '')
        clean2 = s2.get('cleanliness', '')
        if clean1 and clean2:
            scores.append(self._calculate_cleanliness_match(clean1, clean2))
        
        # Noise tolerance
        noise1 = s1.get('noiseTolerance', '')
        noise2 = s2.get('noiseTolerance', '')
        if noise1 and noise2:
            scores.append(self._calculate_noise_match(noise1, noise2))
        
        return np.mean(scores) if scores else 0.5
    
    def _calculate_smoking_compatibility(self, smoke1, smoke2) -> float:
        """Calculate smoking compatibility"""
        if smoke1 == smoke2:
            return 1.0
        
        # Convert to strings for comparison
        s1 = str(smoke1).lower() if smoke1 is not None else 'no'
        s2 = str(smoke2).lower() if smoke2 is not None else 'no'
        
        if s1 == s2:
            return 1.0
        elif 'no' in [s1, s2] and 'yes' in [s1, s2]:
            return 0.0
        else:
            return 0.5
    
    def _calculate_pet_compatibility(self, pet1, pet2) -> float:
        """Calculate pet compatibility"""
        if pet1 == pet2:
            return 1.0
        
        # Convert to strings for comparison
        p1 = str(pet1).lower() if pet1 is not None else 'no'
        p2 = str(pet2).lower() if pet2 is not None else 'no'
        
        if p1 == p2:
            return 1.0
        elif 'no' in [p1, p2] and 'yes' in [p1, p2]:
            return 0.3
        else:
            return 0.7
    
    def _calculate_cleanliness_match(self, clean1, clean2) -> float:
        """Calculate cleanliness preference match - handles both numeric (1-10) and string values"""
        # If numeric, use directly (scale 1-10)
        if isinstance(clean1, (int, float)):
            c1 = clean1
        else:
            # String mapping
            clean_map = {'very clean': 10, 'clean': 8, 'moderate': 5, 'messy': 2}
            c1 = clean_map.get(str(clean1).lower(), 5)
        
        if isinstance(clean2, (int, float)):
            c2 = clean2
        else:
            clean_map = {'very clean': 10, 'clean': 8, 'moderate': 5, 'messy': 2}
            c2 = clean_map.get(str(clean2).lower(), 5)
        
        # Normalize to 0-1 scale, diff of 0 = 1.0, diff of 10 = 0.0
        diff = abs(c1 - c2)
        return max(0, 1.0 - (diff / 10.0))
    
    def _calculate_noise_match(self, noise1, noise2) -> float:
        """Calculate noise tolerance match - handles both numeric (1-10) and string values"""
        # If numeric, use directly (scale 1-10)
        if isinstance(noise1, (int, float)):
            n1 = noise1
        else:
            # String mapping
            noise_map = {'very low': 2, 'low': 4, 'moderate': 6, 'high': 8, 'very high': 10}
            n1 = noise_map.get(str(noise1).lower(), 6)
        
        if isinstance(noise2, (int, float)):
            n2 = noise2
        else:
            noise_map = {'very low': 2, 'low': 4, 'moderate': 6, 'high': 8, 'very high': 10}
            n2 = noise_map.get(str(noise2).lower(), 6)
        
        # Normalize to 0-1 scale
        diff = abs(n1 - n2)
        return max(0, 1.0 - (diff / 10.0))
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def get_feature_dimension(self) -> int:
        """Return total feature dimension"""
        # 12 structured features + 5 text features
        return 17
