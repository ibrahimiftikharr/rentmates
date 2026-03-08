from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import numpy as np
from typing import Optional, List
import json
import sys

try:
    import shap
except Exception:
    shap = None

app = FastAPI(title="Scam Detection API", version="1.0.0")

# Initialize model and explainer as None first
model = None
explainer = None
selected_features = None
startup_error = None

# Load the saved models and features
try:
    print("\n🔧 [STARTUP] Loading ML models...")
    
    try:
        with open('scam_detector_hybrid.pkl', 'rb') as f:
            model = pickle.load(f)
        with open('hybrid_features.pkl', 'rb') as f:
            selected_features = pickle.load(f)
        print(f"✅ [STARTUP] Loaded hybrid model with {len(selected_features)} features")
        print(f"📊 [STARTUP] Features: {selected_features[:10] if len(selected_features) > 10 else selected_features}")
    except FileNotFoundError as e:
        print(f"⚠️  [STARTUP] Model file not found: {e}")
        raise RuntimeError(f"Model file not found: {e}")
    except pickle.UnpicklingError as e:
        # fall back to the original full-feature model and warn the user
        print("\n[WARNING] [STARTUP] could not unpickle hybrid model (possible file corruption).")
        print("[NOTE] Re-run the notebook saving cell and add '*.pkl binary' to .gitattributes")
        print("[FALLBACK] Falling back to the original scam_detector.pkl for now.\n")
        with open('scam_detector.pkl', 'rb') as f:
            model = pickle.load(f)
        # Use the correct feature names that match compute_features() order
        selected_features = [
            'priceRatio',
            'depositRatio',
            'depositTooHigh',
            'landlordVerified',
            'reputationScore',
            'nationalityMismatch',
            'thumbsRatio',
            'minStayMonths',
            'description_length',
            'description_word_count',
            'has_scam_keywords',
            'review_count'
        ]
        print(f"⚠️  [STARTUP] Fallback: Using hardcoded feature names (12 features)")
        print(f"📊 [STARTUP] Features: {selected_features}")

    # Print model info after loading
    if model:
        print(f"\n🤖 [STARTUP] Model type: {type(model).__name__}")
        print(f"📋 [STARTUP] Has feature_importances_: {hasattr(model, 'feature_importances_')}")
        if hasattr(model, 'feature_importances_'):
            print(f"📊 [STARTUP] Number of importances: {len(model.feature_importances_)}")
            try:
                top_5 = sorted(model.feature_importances_, reverse=True)[:5]
                print(f"📊 [STARTUP] Top 5 importances: {top_5}")
            except Exception as imp_err:
                print(f"⚠️  [STARTUP] Could not get importances: {imp_err}")

    # Initialize SHAP
    if shap is not None and model is not None:
        try:
            explainer = shap.TreeExplainer(model)
            print("✅ [STARTUP] SHAP explainer initialized")
        except Exception as e:
            explainer = None
            print(f"⚠️  [STARTUP] SHAP not initialized, using fallback explanations: {e}")
    
    print("\n✅ [STARTUP] ML service startup complete. Model loaded and ready.\n")
    
except Exception as startup_err:
    print(f"\n❌ [STARTUP] CRITICAL ERROR during model loading: {startup_err}")
    import traceback
    print(traceback.format_exc())
    startup_error = str(startup_err)
    # Don't fail completely, let the app start but with a health endpoint that reports the error


# Define the request model
class PredictionRequest(BaseModel):
    priceRatio: float = 0.5
    depositRatio: float = 0.0
    depositTooHigh: bool = False
    landlordVerified: bool = False
    reputationScore: float = 0.0
    nationalityMismatch: bool = False
    thumbsRatio: float = 0.5
    minStayMonths: int = 12
    description_length: int = 0
    description_word_count: int = 0
    has_scam_keywords: bool = False
    review_count: int = 0
    isNewListing: Optional[bool] = False
    
    class Config:
        # Allow None values to use defaults
        validate_assignment = True


class FactorExplanation(BaseModel):
    feature: str
    score: float
    direction: str
    impact: str


class PredictionSummary(BaseModel):
    label: str
    confidence: float
    scam_probability: float
    top_factors: List[FactorExplanation]

# Define the response model
class PredictionResponse(BaseModel):
    scam_prediction: bool
    scam_probability: float
    scam_explanations: List[FactorExplanation]
    summary: PredictionSummary

def compute_features(data: PredictionRequest) -> np.ndarray:
    """Compute the feature vector from the request data."""
    # Extract features in the order of selected_features
    # Add defensive conversions to handle edge cases
    try:
        features = [
            float(data.priceRatio or 0.5),
            float(data.depositRatio or 0.0),
            int(bool(data.depositTooHigh)),
            int(bool(data.landlordVerified)),
            float(data.reputationScore or 0.0),
            int(bool(data.nationalityMismatch)),
            float(data.thumbsRatio or 0.5),
            int(data.minStayMonths or 12),
            int(data.description_length or 0),
            int(data.description_word_count or 0),
            int(bool(data.has_scam_keywords)),
            int(data.review_count or 0)
        ]
        feature_array = np.array(features, dtype=float).reshape(1, -1)
        return feature_array
    except Exception as e:
        print(f"❌ Error in compute_features: {e}")
        raise ValueError(f"Failed to compute features: {e}")


def pretty_feature_name(name: str) -> str:
    mapping = {
        'minStayMonths': 'MinStayMonths',
        'priceRatio': 'PriceRatio',
        'reputationScore': 'ReputationScore',
        'depositTooHigh': 'DepositTooHigh',
        'thumbsRatio': 'ThumbsRatio',
        'depositRatio': 'DepositRatio',
        'landlordVerified': 'LandlordVerified',
        'has_scam_keywords': 'HasScamKeywords',
        'description_length': 'DescriptionLength',
        'description_word_count': 'DescriptionWordCount',
        'review_count': 'ReviewCount',
        'nationalityMismatch': 'NationalityMismatch'
    }
    return mapping.get(name, name)


def canonical_feature_name(name: str) -> str:
    """Normalize model feature names to canonical request keys."""
    token = ''.join(ch for ch in str(name or '') if ch.isalnum()).lower()
    mapping = {
        'priceratio': 'priceRatio',
        'depositratio': 'depositRatio',
        'deposittoohigh': 'depositTooHigh',
        'landlordverified': 'landlordVerified',
        'reputationscore': 'reputationScore',
        'nationalitymismatch': 'nationalityMismatch',
        'thumbsratio': 'thumbsRatio',
        'minstaymonths': 'minStayMonths',
        'descriptionlength': 'description_length',
        'descriptionwordcount': 'description_word_count',
        'hasscamkeywords': 'has_scam_keywords',
        'reviewcount': 'review_count',
    }
    return mapping.get(token, str(name or ''))


def underpricing_risk_floor(price_ratio: float) -> float:
    """Return a minimum scam probability for extreme underpricing patterns."""
    # Ensure price_ratio is a Python float, not numpy type
    price_ratio = float(price_ratio.item() if hasattr(price_ratio, 'item') else price_ratio)
    
    if price_ratio <= 0:
        return 0.0
    if price_ratio < 0.20:
        return 0.99
    if price_ratio < 0.35:
        return 0.95
    if price_ratio < 0.50:
        return 0.85
    if price_ratio < 0.70:
        return 0.65
    return 0.0


def get_shap_scores(features: np.ndarray) -> Optional[np.ndarray]:
    """Return per-feature SHAP contributions for the positive class if available."""
    if explainer is None:
        return None
    try:
        raw_vals = explainer.shap_values(features)
        result = None
        
        if isinstance(raw_vals, list):
            # Binary-class models can return [class0, class1]
            if len(raw_vals) > 1:
                result = np.array(raw_vals[1][0], dtype=float) if len(raw_vals[1].shape) > 1 else np.array(raw_vals[1], dtype=float)
        elif isinstance(raw_vals, np.ndarray):
            if raw_vals.ndim == 3 and raw_vals.shape[2] >= 2:
                # Shape: (n_samples, n_features, n_classes)
                result = np.array(raw_vals[0, :, 1], dtype=float)
            elif raw_vals.ndim == 2:
                # Shape: (n_samples, n_features)
                result = np.array(raw_vals[0], dtype=float)
            elif raw_vals.ndim == 1:
                result = np.array(raw_vals, dtype=float)
        
        # Ensure result is always a 1D array if not None
        if result is not None:
            result = np.asarray(result, dtype=float).flatten()
        return result
    except Exception as e:
        print(f"⚠️ SHAP explanation failed, falling back to importances: {e}")
    return None

@app.post("/predict", response_model=PredictionResponse)
async def predict_scam(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model not loaded: {startup_error or 'Unknown error'}")
    
    print(f"\n📥 Received prediction request:")
    print(f"  priceRatio: {request.priceRatio}")
    print(f"  depositRatio: {request.depositRatio}")
    print(f"  isNewListing: {request.isNewListing}")
    
    try:
        # Compute features
        features = compute_features(request)
        
        # Get actual feature values for detailed explanations
        feature_values = {
            'priceRatio': request.priceRatio,
            'depositRatio': request.depositRatio,
            'depositTooHigh': int(request.depositTooHigh),
            'landlordVerified': int(request.landlordVerified),
            'reputationScore': request.reputationScore,
            'nationalityMismatch': int(request.nationalityMismatch),
            'thumbsRatio': request.thumbsRatio,
            'minStayMonths': request.minStayMonths,
            'description_length': request.description_length,
            'description_word_count': request.description_word_count,
            'has_scam_keywords': int(request.has_scam_keywords),
            'review_count': request.review_count
        }

        # Predict with better error handling
        try:
            prediction = model.predict(features)[0]
            # Ensure prediction is a Python type, not numpy
            prediction = int(prediction) if hasattr(prediction, 'item') else int(prediction)
            print(f"✅ Model prediction: {prediction}")
        except Exception as pred_err:
            print(f"❌ Model.predict failed: {pred_err}")
            raise ValueError(f"Model prediction failed: {pred_err}")
            
        try:
            proba_raw = model.predict_proba(features)[0]
            # Ensure proba is a Python list, not numpy array
            proba = [float(p.item() if hasattr(p, 'item') else p) for p in proba_raw]
            print(f"✅ Model proba: {proba}")
        except Exception as proba_err:
            print(f"❌ Model.predict_proba failed: {proba_err}")
            raise ValueError(f"Model proba calculation failed: {proba_err}")

        # Generate structured factor explanations
        explanations: List[FactorExplanation] = []
        
        try:
            print(f"📊 Getting SHAP scores...")
            shap_scores = get_shap_scores(features)
            print(f"✅ SHAP scores: type={type(shap_scores)}, value={shap_scores}")
        except Exception as shap_err:
            print(f"⚠️  SHAP scores failed: {shap_err}")
            shap_scores = None

        score_source = 'none'
        top_indices = []
        try:
            print(f"📊 Checking score source...")
            if shap_scores is not None:
                shap_len = len(shap_scores)
                selected_len = len(selected_features)
                print(f"   shap_scores length: {shap_len}, selected_features length: {selected_len}")
                if shap_len >= selected_len:
                    print(f"   Using SHAP scores as source")
                    top_indices = np.argsort(np.abs(shap_scores))[-10:][::-1]
                    score_source = 'shap'
                else:
                    print(f"   SHAP length insufficient, falling back to importances")
            
            if score_source != 'shap':
                if hasattr(model, 'feature_importances_'):
                    print(f"   Using model feature importances")
                    importances = model.feature_importances_
                    top_indices = np.argsort(importances)[-10:][::-1]
                    score_source = 'importance'
                else:
                    print(f"   No feature importances available")
                    top_indices = []
                    score_source = 'none'
        except Exception as score_src_err:
            print(f"❌ Error determining score source: {score_src_err}")
            import traceback
            traceback.print_exc()
            top_indices = []
            score_source = 'none'

        if top_indices is not None and len(top_indices) > 0:
            print(f"📋 Building explanations from {len(top_indices)} top factors...")
            for idx in top_indices:
                try:
                    idx = int(idx)
                    if idx >= len(selected_features):
                        continue
                    
                    feature_name = selected_features[idx]
                    canonical_name = canonical_feature_name(feature_name)
                    raw_val = feature_values.get(canonical_name, 0)
                    feature_value = float(raw_val.item() if hasattr(raw_val, 'item') else raw_val)
                    
                    model_score = 0.0
                    if score_source == 'shap' and shap_scores is not None:
                        shap_val = shap_scores[idx]
                        model_score = float(shap_val.item() if hasattr(shap_val, 'item') else shap_val)
                    elif score_source == 'importance' and hasattr(model, 'feature_importances_'):
                        imp_val = model.feature_importances_[idx]
                        model_score = float(imp_val.item() if hasattr(imp_val, 'item') else imp_val)
                    
                    impact_direction = "increases" if model_score > 0 else "decreases"
                    if abs(model_score) < 1e-9:
                        impact_direction = "neutral"
                    explanation_text = "Increases scam probability"
                    risk_strength = 1.0

                    if canonical_name == 'priceRatio':
                        if feature_value < 0.2:
                            explanation_text = "Price is extremely below market average (very high risk)"
                            risk_strength = 1.0
                        elif feature_value < 0.5:
                            explanation_text = "Price too low compared to market average (high risk)"
                            risk_strength = 0.8
                        elif feature_value < 0.7:
                            explanation_text = "Price below market average (increases risk)"
                            risk_strength = 0.55
                        elif feature_value > 1.6:
                            explanation_text = "Price unusually higher than market average (increases risk)"
                            risk_strength = 0.45
                        elif feature_value > 1.3:
                            explanation_text = "Price above market average (slight risk)"
                            risk_strength = 0.25
                        else:
                            explanation_text = "Price within normal range (decreases risk)"
                            impact_direction = "decreases"
                            risk_strength = 0.3

                    elif canonical_name == 'depositRatio':
                        if feature_value > 2.0:
                            explanation_text = f"Deposit extremely high ({feature_value:.2f}x rent, high risk)"
                            risk_strength = 0.9
                        elif feature_value > 1.5:
                            explanation_text = f"Deposit too high ({feature_value:.2f}x rent, increases risk)"
                            risk_strength = 0.7
                        elif feature_value > 1.0:
                            explanation_text = f"Deposit above 1 month rent (increases risk)"
                            risk_strength = 0.4
                        else:
                            explanation_text = "Deposit in normal range (decreases risk)"
                            impact_direction = "decreases"
                            risk_strength = 0.25

                    elif canonical_name == 'thumbsRatio':
                        if request.isNewListing:
                            explanation_text = "New listing - no reviews yet (neutral)"
                            impact_direction = "neutral"
                            risk_strength = 0.0
                        elif feature_value < 0.3:
                            explanation_text = "Low positive feedback ratio (increases risk)"
                            risk_strength = 0.5
                        elif feature_value > 0.7:
                            explanation_text = "High positive feedback (decreases risk)"
                            impact_direction = "decreases"
                            risk_strength = 0.35
                        else:
                            explanation_text = "Mixed feedback ratio"
                            risk_strength = 0.15

                    elif canonical_name == 'landlordVerified':
                        if feature_value == 1:
                            explanation_text = "Landlord verified with documents (decreases risk)"
                            impact_direction = "decreases"
                            risk_strength = 0.45
                        else:
                            explanation_text = "Landlord not verified (increases risk)"
                            risk_strength = 0.5

                    elif canonical_name == 'reputationScore':
                        if feature_value > 70:
                            explanation_text = f"Good reputation score ({feature_value:.0f}/100, decreases risk)"
                            impact_direction = "decreases"
                            risk_strength = 0.5
                        elif feature_value < 30:
                            explanation_text = f"Low reputation score ({feature_value:.0f}/100, increases risk)"
                            risk_strength = 0.55
                        else:
                            explanation_text = f"Average reputation score ({feature_value:.0f}/100, neutral)"
                            impact_direction = "neutral"
                            risk_strength = 0.0

                    elif canonical_name == 'has_scam_keywords':
                        if feature_value == 1:
                            explanation_text = "Suspicious keywords detected in description (increases risk)"
                            risk_strength = 0.7
                        else:
                            explanation_text = "No suspicious keywords (decreases risk)"
                            impact_direction = "decreases"
                            risk_strength = 0.35

                    elif canonical_name == 'depositTooHigh':
                        if feature_value == 1:
                            explanation_text = "Deposit exceeds normal thresholds (increases risk)"
                            risk_strength = 0.65
                        else:
                            explanation_text = "Deposit within acceptable limits"
                            impact_direction = "decreases"
                            risk_strength = 0.25

                    elif canonical_name == 'description_word_count':
                        if feature_value >= 20:
                            explanation_text = "Unusually long description for this listing type (increases risk)"
                            risk_strength = 0.35
                        elif feature_value <= 6:
                            explanation_text = "Very short description with limited detail (increases risk)"
                            risk_strength = 0.45
                        else:
                            explanation_text = "Description length appears natural"
                            impact_direction = "neutral"
                            risk_strength = 0.0

                    elif canonical_name == 'description_length':
                        if feature_value >= 140:
                            explanation_text = "Lengthy description pattern seen in higher-risk samples"
                            risk_strength = 0.2
                        elif feature_value <= 40:
                            explanation_text = "Description is too short to assess confidence"
                            impact_direction = "neutral"
                            risk_strength = 0.0
                        else:
                            explanation_text = "Description length is within a normal range"
                            impact_direction = "neutral"
                            risk_strength = 0.0

                    elif canonical_name == 'review_count':
                        if request.isNewListing:
                            explanation_text = "New listing - review count not informative yet"
                            impact_direction = "neutral"
                            risk_strength = 0.0
                        elif feature_value == 0:
                            explanation_text = "No review history available"
                            impact_direction = "neutral"
                            risk_strength = 0.0
                        else:
                            explanation_text = "Review volume is available for assessment"
                            impact_direction = "neutral"
                            risk_strength = 0.0

                    if request.isNewListing and canonical_name in {'thumbsRatio', 'review_count'}:
                        continue

                    if score_source == 'importance' and abs(model_score) <= 0.01:
                        continue

                    signed_score = float(model_score) * float(risk_strength)
                    if impact_direction == 'neutral':
                        signed_score = 0.0

                    explanations.append(FactorExplanation(
                        feature=pretty_feature_name(canonical_name),
                        score=round(signed_score, 3),
                        direction=impact_direction,
                        impact=f"{explanation_text} (value: {feature_value})"
                    ))
                    
                except Exception as factor_err:
                    print(f"❌ Error processing factor {feature_name}: {factor_err}")
                    import traceback
                    traceback.print_exc()
                    continue
        else:
            # Fallback: derive explanations from request values when model importances are unavailable.
            fallback = []

            if request.priceRatio < 0.7:
                fallback.append(FactorExplanation(
                    feature="PriceRatio",
                    score=0.6,
                    direction="increases",
                    impact=f"Price is below market baseline (value: {request.priceRatio:.2f})"
                ))
            elif request.priceRatio > 1.4:
                fallback.append(FactorExplanation(
                    feature="PriceRatio",
                    score=0.2,
                    direction="increases",
                    impact=f"Price is above typical market range (value: {request.priceRatio:.2f})"
                ))
            else:
                fallback.append(FactorExplanation(
                    feature="PriceRatio",
                    score=-0.2,
                    direction="decreases",
                    impact=f"Price is within normal market range (value: {request.priceRatio:.2f})"
                ))

            if request.depositRatio > 1.5 or request.depositTooHigh:
                fallback.append(FactorExplanation(
                    feature="DepositRatio",
                    score=0.45,
                    direction="increases",
                    impact=f"Deposit is high relative to rent (value: {request.depositRatio:.2f})"
                ))
            else:
                fallback.append(FactorExplanation(
                    feature="DepositRatio",
                    score=-0.15,
                    direction="decreases",
                    impact=f"Deposit appears normal (value: {request.depositRatio:.2f})"
                ))

            if request.landlordVerified:
                fallback.append(FactorExplanation(
                    feature="LandlordVerified",
                    score=-0.25,
                    direction="decreases",
                    impact="Landlord verification reduces scam risk"
                ))
            else:
                fallback.append(FactorExplanation(
                    feature="LandlordVerified",
                    score=0.25,
                    direction="increases",
                    impact="Landlord is not verified"
                ))

            if request.has_scam_keywords:
                fallback.append(FactorExplanation(
                    feature="HasScamKeywords",
                    score=0.35,
                    direction="increases",
                    impact="Description contains suspicious keywords"
                ))

            explanations = fallback

        explanations = sorted(explanations, key=lambda f: abs(f.score), reverse=True)
        top_factors = explanations[:5]

        model_scam_probability = float(proba[1])
        floor_probability = underpricing_risk_floor(request.priceRatio)
        scam_probability = max(model_scam_probability, floor_probability)
        is_scam = scam_probability >= 0.5
        confidence = scam_probability if is_scam else (1.0 - scam_probability)
        label = "SCAM" if is_scam else "LEGITIMATE"

        # Make sure the UI reflects why an extreme underpricing case was forced high risk.
        if floor_probability > model_scam_probability:
            top_factors.insert(0, FactorExplanation(
                feature="PriceRatio",
                score=round(float(floor_probability - model_scam_probability), 3),
                direction="increases",
                impact=(
                    f"Listing is far below area average (price ratio {request.priceRatio:.2f}); "
                    "rule-based guardrail raised risk"
                )
            ))
            top_factors = top_factors[:5]

        print(f"\n🔍 ML Prediction Complete:")
        print(f"  Prediction: {label}")
        print(f"  Scam Probability: {scam_probability:.4f} (model={model_scam_probability:.4f}, floor={floor_probability:.4f})")
        print(f"  Generated {len(top_factors)} top explanations")
        for idx, exp in enumerate(top_factors):
            print(f"    {idx+1}. {exp.feature}: score={exp.score}, direction={exp.direction}")

        return PredictionResponse(
            scam_prediction=is_scam,
            scam_probability=scam_probability,
            scam_explanations=top_factors,
            summary=PredictionSummary(
                label=label,
                confidence=round(confidence, 4),
                scam_probability=round(scam_probability, 4),
                top_factors=top_factors
            )
        )
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR in predict_scam endpoint: {error_msg}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error_msg}")

@app.get("/")
async def root():
    return {
        "message": "Scam Detection API is running",
        "model_loaded": model is not None,
        "shap_available": shap is not None and explainer is not None,
        "startup_error": startup_error
    }

@app.get("/health")
async def health():
    if model is None:
        return {
            "status": "unhealthy",
            "model_working": False,
            "error": startup_error or "Model not loaded",
            "startup_error": startup_error
        }
    
    try:
        # Test a minimal prediction to ensure everything is working
        test_features = np.array([[0.5, 0.0, 0, 0, 50.0, 0, 0.5, 12, 100, 20, 0, 0]], dtype=float)
        _ = model.predict(test_features)
        _ = model.predict_proba(test_features)
        return {
            "status": "healthy",
            "model_working": True,
            "model_type": type(model).__name__,
            "features_count": len(selected_features) if selected_features else 0
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "model_working": False,
            "error": str(e),
            "model_type": type(model).__name__ if model else "None"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)