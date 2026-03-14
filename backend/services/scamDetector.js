import pickle
import numpy as np
import pandas as pd
import shap
from typing import Dict, List, Tuple
from .schemas import RentalListing


# Scam keywords for detection
SCAM_KEYWORDS = ['urgent', 'overseas', 'no viewing', 'wire transfer', 'amazing', 'discount', 'deal', 'only today', 'limited time']


class AreaPriceCalculator:
    """Calculate average area prices for price ratio feature"""
    
    def __init__(self, db):
        """Initialize with database connection"""
        self.db = db
    
    async def get_average_price_by_city(self, city: str, property_type: str = None) -> float:
        """
        Calculate average price for properties in the same city
        This is used to compute price_ratio for scam detection
        """
        try:
            query = {'status': 'active'}
            
            # Add city filter if provided
            if city:
                # Try to match city in address or city field
                query['$or'] = [
                    {'city': {'$regex': city, '$options': 'i'}},
                    {'address': {'$regex': city, '$options': 'i'}}
                ]
            
            # Add property type filter if provided
            if property_type:
                query['type'] = property_type
            
            # Get all matching properties
            properties = await self.db.Property.find(query).select('price').limit(100)
            
            if properties and len(properties) > 0:
                prices = [p.price for p in properties if p.price]
                if prices:
                    return sum(prices) / len(prices)
            
            # Default average if no data available (common rental price)
            return 500.0  # Default fallback
            
        except Exception as e:
            print(f"Error calculating area average price: {e}")
            return 500.0  # Default fallback
    
    async def get_average_price_by_region(self, region: str) -> float:
        """Calculate average price by broader region"""
        try:
            properties = await self.db.Property.find({
                'status': 'active',
                '$or': [
                    {'address': {'$regex': region, '$options': 'i'}},
                    {'city': {'$regex': region, '$options': 'i'}}
                ]
            }).select('price').limit(50)
            
            if properties and len(properties) > 0:
                prices = [p.price for p in properties if p.price]
                if prices:
                    return sum(prices) / len(prices)
            
            return 500.0
            
        except Exception as e:
            print(f"Error calculating region average price: {e}")
            return 500.0


class ScamDetector:
    """Scam detection model with SHAP explanations"""
    
    def __init__(self, model_path: str, tfidf_description_path: str, 
                 tfidf_reviews_path: str, feature_names_path: str):
        """Initialize detector with model and TF-IDF vectorizers"""
        # Load model
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        # Load TF-IDF vectorizers
        with open(tfidf_description_path, 'rb') as f:
            self.tfidf_description = pickle.load(f)
        
        with open(tfidf_reviews_path, 'rb') as f:
            self.tfidf_reviews = pickle.load(f)
        
        # Load feature names
        with open(feature_names_path, 'rb') as f:
            self.feature_names = pickle.load(f)
        
        # Create SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)
        
        print("✅ Model loaded successfully")
        print(f"   - Model: {type(self.model).__name__}")
        print(f"   - Description TF-IDF features: {len(self.tfidf_description.get_feature_names_out())}")
        print(f"   - Reviews TF-IDF features: {len(self.tfidf_reviews.get_feature_names_out())}")
        print(f"   - Total features: {len(self.feature_names)}")
    
    def _count_scam_keywords(self, text: str) -> int:
        """Count scam keywords in text"""
        if not text:
            return 0
        text_lower = text.lower()
        count = 0
        for keyword in SCAM_KEYWORDS:
            if keyword in text_lower:
                count += 1
        return count
    
    async def preprocess(self, listing: RentalListing, area_avg_price: float = None) -> np.ndarray:
        """Convert listing to feature vector matching training format EXACTLY"""
        
        # Get values from listing
        price = listing.price
        deposit = listing.deposit_amount
        avg_rating = listing.average_review_rating
        reputation = listing.reputation_score
        min_stay = listing.min_stay_months
        amenities = listing.amenities_count
        bills = listing.included_bills_total
        thumbs_up = listing.thumbs_up_count
        thumbs_down = listing.thumbs_down_count
        # FLATMATES REMOVED - no longer used
        landlord_verified = listing.landlord_verified
        nationality_mismatch = listing.nationality_mismatch
        has_pic = listing.has_profile_pic
        
        # Use rental_description or property_description
        description = listing.rental_description or getattr(listing, 'property_description', '')
        reviews_text = listing.reviews or ''
        
        # Use provided area_avg_price or calculate price ratio with default
        if area_avg_price is None:
            area_avg_price = 500.0  # Default average
        
        # Calculate engineered features
        price_ratio = price / (area_avg_price + 1)
        # DepositRatio must be relative to market monthly rent, not listed price.
        deposit_ratio = deposit / (area_avg_price + 1)
        thumbs_ratio = thumbs_up / (thumbs_up + thumbs_down + 1)
        scam_keyword_count = self._count_scam_keywords(description + ' ' + reviews_text)
        deposit_too_high = 1 if deposit_ratio > 1.5 else 0
        has_reviews = 1 if reviews_text and len(reviews_text) > 0 else 0
        is_new_listing = 1 if thumbs_up == 0 else 0
        
        # EXACT order matching feature_names.pkl 
        # 19 numerical features (flatmates removed)
        numerical_features = [
            price,                    # 'Price'
            deposit,                 # 'DepositAmount'
            avg_rating,              # 'AverageReviewRating'
            reputation,               # 'ReputationScore'
            min_stay,                # 'MinStayMonths'
            amenities,               # 'AmenitiesCount'
            bills,                   # 'IncludedBillsTotal'
            thumbs_up,               # 'ThumbsUpCount'
            thumbs_down,             # 'ThumbsDownCount'
            price_ratio,             # 'PriceRatio'
            deposit_ratio,           # 'DepositRatio'
            thumbs_ratio,            # 'ThumbsRatio'
            scam_keyword_count,      # 'ScamKeywordCount'
            landlord_verified,       # 'LandlordVerified'
            nationality_mismatch,   # 'NationalityMismatch'
            has_pic,                # 'HasProfilePic'
            deposit_too_high,        # 'DepositTooHigh'
            has_reviews,             # 'HasReviews'
            is_new_listing           # 'IsNewListing'
        ]
        
        # Text Features (TF-IDF) - 50 description + 20 reviews = 70
        description_tfidf = self.tfidf_description.transform([description]).toarray()[0]
        reviews_tfidf = self.tfidf_reviews.transform([reviews_text]).toarray()[0]
        
        # Combine all features: 19 + 50 + 20 = 89
        X = np.concatenate([
            numerical_features,
            description_tfidf,
            reviews_tfidf
        ])
        
        X = X.reshape(1, -1)
        
        return X
    
    async def predict(self, listing: RentalListing, area_avg_price: float = None) -> Tuple[str, float, float, List[Dict]]:
        """Make prediction with explanations"""
        
        X = await self.preprocess(listing, area_avg_price)
        
        prediction_proba = self.model.predict_proba(X)[0]
        scam_probability = prediction_proba[1] * 100
        legit_probability = prediction_proba[0] * 100
        
        prediction = "SCAM" if scam_probability > 50 else "LEGITIMATE"
        confidence = max(scam_probability, legit_probability)
        
        shap_values = self.explainer.shap_values(X)
        
        if isinstance(shap_values, list):
            shap_values_scam = shap_values[1][0]
        else:
            shap_values_scam = shap_values[0]
        
        reasons = self._create_explanations(shap_values_scam, X[0], prediction)
        
        return prediction, confidence, scam_probability, reasons
    
    def _create_explanations(self, shap_values: np.ndarray, 
                            feature_values: np.ndarray,
                            prediction: str) -> List[Dict]:
        """Generate human-readable explanations"""
        
        feature_importance = [
            (feat, shap_val, feat_val) 
            for feat, shap_val, feat_val in zip(self.feature_names, shap_values, feature_values)
        ]
        feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
        
        top_features = feature_importance[:5]
        
        reasons = []
        for feature, shap_value, feature_value in top_features:
            impact = "increase" if shap_value > 0 else "decrease"
            description = self._explain_feature(feature, shap_value, feature_value, prediction)
            
            reasons.append({
                "feature": feature,
                "impact": impact,
                "contribution": round(float(shap_value), 3),
                "description": description
            })
        
        return reasons
    
    def _explain_feature(self, feature: str, shap_value: float, 
                        feature_value: float, prediction: str) -> str:
        """Generate human-readable explanation for a feature"""
        
        impact = "increases" if shap_value > 0 else "decreases"
        feature_lower = feature.lower()
        
        if 'priceratio' in feature_lower:
            return f"Price is {feature_value:.1%} of market average - {impact} scam risk"
        elif 'depositratio' in feature_lower or 'deposit_too_high' in feature_lower:
            return f"Deposit ratio: {feature_value:.2f} - {impact} scam risk"
        elif 'landlord_verified' in feature_lower:
            status = "verified" if feature_value > 0.5 else "not verified"
            return f"Landlord {status} - {impact} scam risk"
        elif 'reputation' in feature_lower:
            return f"Reputation score: {feature_value:.0f}/100 - {impact} scam risk"
        elif 'nationality_mismatch' in feature_lower:
            status = "mismatch detected" if feature_value > 0.5 else "no mismatch"
            return f"Location {status} - {impact} scam risk"
        elif 'thumbs_up' in feature_lower or 'thumbsratio' in feature_lower:
            return f"Positive reactions ratio: {feature_value:.2f} - {impact} scam risk"
        elif 'scam_keyword' in feature_lower:
            return f"Scam keywords found: {int(feature_value)} - {impact} scam risk"
        elif 'tfidf' in feature_lower or 'text_' in feature_lower:
            if shap_value > 0:
                return f"Suspicious keywords in text - {impact} scam risk"
            else:
                return f"Text appears legitimate - {impact} scam risk"
        
        return f"{feature} - {impact} scam probability"
    
    def get_risk_level(self, scam_probability: float) -> str:
        """Determine risk level"""
        if scam_probability >= 80:
            return "CRITICAL"
        elif scam_probability >= 60:
            return "HIGH"
        elif scam_probability >= 30:
            return "MEDIUM"
        else:
            return "LOW"
    
    def get_recommendation(self, prediction: str, scam_probability: float) -> str:
        """Generate recommendation"""
        
        if prediction == "SCAM":
            if scam_probability >= 80:
                return "⛔ DO NOT PROCEED - High risk scam detected. Report this listing immediately."
            else:
                return "⚠️ CAUTION - Suspicious patterns detected. Verify landlord identity thoroughly before proceeding."
        else:
            if scam_probability < 20:
                return "✅ SAFE - Listing appears legitimate. Proceed with standard verification procedures."
            else:
                return "✓ LIKELY SAFE - Listing appears legitimate but exercise normal caution and verify details."

