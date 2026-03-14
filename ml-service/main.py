from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import numpy as np
import json
from typing import Optional, List, Dict
import re
from scam_runtime_logic import (
    set_runtime_context,
    compute_description_scam_score,
    infer_risk_direction,
    explanation_for_feature,
)

try:
    import shap
except Exception:
    shap = None

try:
    from property_assessment import PropertyAssessment, MarketPriceLookup
except ImportError:
    PropertyAssessment = None
    MarketPriceLookup = None
    print("[STARTUP] property_assessment module not available (optional)")

app = FastAPI(title="Scam Detection API", version="2.0.0")

# Initialize model and explainer as None first
model = None
explainer = None
selected_features = None
startup_error = None
property_assessor = None
model_metadata = {}
scaler_mean = None
scaler_scale = None

desc_vectorizer = None
desc_text_model = None

def _safe_float(value, default=0.0):
    try:
        v = float(value)
        if np.isnan(v) or np.isinf(v):
            return default
        return v
    except Exception:
        return default


def _safe_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def _apply_model_scaling(features: np.ndarray) -> np.ndarray:
    """Apply training-time scaling if scaler params are available from notebook metadata."""
    if features is None:
        return features
    if scaler_mean is None or scaler_scale is None:
        return features
    try:
        arr = np.asarray(features, dtype=float)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        if arr.shape[1] != scaler_mean.shape[0] or arr.shape[1] != scaler_scale.shape[0]:
            return arr

        safe_scale = np.where(np.abs(scaler_scale) < 1e-12, 1.0, scaler_scale)
        return (arr - scaler_mean.reshape(1, -1)) / safe_scale.reshape(1, -1)
    except Exception:
        return features


try:
    print("[STARTUP] Loading ML artifacts...")

    with open("scam_detector_hybrid.pkl", "rb") as f:
        model = pickle.load(f)

    with open("hybrid_features.pkl", "rb") as f:
        selected_features = pickle.load(f)

    try:
        with open("model_metadata.json", "r", encoding="utf-8") as f:
            model_metadata = json.load(f)
        scaler_mean = np.asarray(model_metadata.get("scaler_mean", []), dtype=float)
        scaler_scale = np.asarray(model_metadata.get("scaler_scale", []), dtype=float)
        if scaler_mean.size == 0 or scaler_scale.size == 0:
            scaler_mean = None
            scaler_scale = None
            print("[STARTUP] Metadata loaded without scaler params")
        else:
            print("[STARTUP] Loaded scaler params from model_metadata.json")
    except FileNotFoundError:
        model_metadata = {}
        scaler_mean = None
        scaler_scale = None
        print("[STARTUP] model_metadata.json not found. Using unscaled inference.")
    except Exception as e:
        model_metadata = {}
        scaler_mean = None
        scaler_scale = None
        print(f"[STARTUP] Failed loading metadata/scaler: {e}")

    print(f"[STARTUP] Loaded model: {type(model).__name__}")
    print(f"[STARTUP] Loaded {len(selected_features)} features: {selected_features}")

    # Better NLP signal from trained text classifier on listing descriptions.
    try:
        with open("description_tfidf.pkl", "rb") as f:
            desc_vectorizer = pickle.load(f)
        with open("description_text_model.pkl", "rb") as f:
            desc_text_model = pickle.load(f)
        print("[STARTUP] Loaded description NLP artifacts")
    except FileNotFoundError:
        print("[STARTUP] Description NLP artifacts not found. Falling back to heuristic description scoring.")

    # Configure runtime scoring/explanation logic from notebook metadata.
    runtime_rules = model_metadata.get("runtime_rules") if isinstance(model_metadata, dict) else None
    set_runtime_context(
        desc_vectorizer=desc_vectorizer,
        desc_text_model=desc_text_model,
        runtime_rules=runtime_rules,
    )

    if shap is not None and model is not None:
        try:
            explainer = shap.TreeExplainer(model)
            print("[STARTUP] SHAP explainer initialized")
        except Exception as e:
            explainer = None
            print(f"[STARTUP] SHAP unavailable: {e}")

    # Initialize property assessment module (for calculate price at publish time)
    if PropertyAssessment is not None:
        try:
            market_lookup = MarketPriceLookup("rent_lookup.csv")
            property_assessor = PropertyAssessment(market_lookup)
            print("[STARTUP] Property assessment module initialized")
        except Exception as e:
            property_assessor = None
            print(f"[STARTUP] Property assessment unavailable: {e}")

    print("[STARTUP] Service ready")
except Exception as e:
    startup_error = str(e)
    print(f"[STARTUP] Failed: {startup_error}")


# Define the request model
class PredictionRequest(BaseModel):
    priceRatio: float = 1.0
    depositRatio: float = 0.0
    reputationScore: float = 50.0
    nationalityMismatch: bool = False
    thumbsRatio: float = 0.5
    averageReviewRating: float = 3.0
    isNewListing: Optional[bool] = False
    description: Optional[str] = ""
    reviews: Optional[str] = ""


class PropertyPublishRequest(BaseModel):
    """Request model for landlord publishing a property."""
    country: str
    city: str
    propertyType: str
    bedrooms: int = 2
    listedPrice: float
    depositAmount: float
    landlordReputationScore: float = 50.0
    landlordNationalityMatch: Optional[bool] = True
    positiveReviews: Optional[int] = 0
    negativeReviews: Optional[int] = 0
    description: Optional[str] = ""
    reviewsText: Optional[str] = ""


class FactorExplanation(BaseModel):
    feature: str
    score: float
    direction: str
    impact: str
    contribution_percent: Optional[float] = None  # Percentage contribution to prediction


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

def compute_features(data: PredictionRequest) -> tuple:
    """Compute the feature vector from the request data."""
    is_new = bool(data.isNewListing)
    description_scam_score = compute_description_scam_score(data.description or "", data.reviews or "")

    # For new listings, thumbs/rating are weak signals. Keep neutral defaults.
    thumbs_ratio = 0.5 if is_new else _safe_float(data.thumbsRatio, 0.5)
    avg_rating = 3.0 if is_new else _safe_float(data.averageReviewRating, 3.0)

    feature_values: Dict[str, float] = {
        "priceRatio": _safe_float(data.priceRatio, 1.0),
        "depositRatio": _safe_float(data.depositRatio, 0.0),
        "reputationScore": _safe_float(data.reputationScore, 50.0),
        "nationalityMismatch": float(1 if data.nationalityMismatch else 0),
        "thumbsRatio": thumbs_ratio,
        "averageReviewRating": avg_rating,
        "descriptionScamScore": description_scam_score,
    }

    values = []
    for feat in selected_features:
        canonical = canonical_feature_name(feat)
        values.append(_safe_float(feature_values.get(canonical, 0.0), 0.0))

    return np.array(values, dtype=float).reshape(1, -1), feature_values


def canonical_feature_name(name: str) -> str:
    """Normalize model feature names to canonical request keys."""
    token = "".join(ch for ch in str(name or "") if ch.isalnum()).lower()
    mapping = {
        "priceratio": "priceRatio",
        "depositratio": "depositRatio",
        "reputationscore": "reputationScore",
        "nationalitymismatch": "nationalityMismatch",
        "thumbsratio": "thumbsRatio",
        "averagereviewrating": "averageReviewRating",
        "descriptionscamscore": "descriptionScamScore",
        # Backward-compat aliases
        "hasscamkeywords": "descriptionScamScore",
        "descriptionwordcount": "descriptionScamScore",
        "descriptionlength": "descriptionScamScore",
        "reviewcount": "averageReviewRating",
    }
    return mapping.get(token, str(name or ""))


def pretty_feature_name(name: str) -> str:
    mapping = {
        "priceRatio": "PriceRatio",
        "depositRatio": "DepositRatio",
        "reputationScore": "ReputationScore",
        "nationalityMismatch": "NationalityMismatch",
        "thumbsRatio": "ThumbsRatio",
        "averageReviewRating": "AverageReviewRating",
        "descriptionScamScore": "DescriptionScamScore",
    }
    return mapping.get(name, name)


def _clamp01(value: float) -> float:
    return float(min(1.0, max(0.0, _safe_float(value, 0.0))))


def _price_risk_component(price_ratio: float) -> float:
    pr = _safe_float(price_ratio, 1.0)
    if pr <= 0:
        return 0.45

    safe_low = 0.90
    safe_high = 1.05
    if safe_low <= pr <= safe_high:
        return -0.08

    # Use symmetric distance from the safe band edge so low/high outliers
    # get the same fixed risk score for the same margin.
    if pr < safe_low:
        distance = safe_low - pr
    else:
        distance = pr - safe_high

    if distance <= 0.15:
        return 0.12
    if distance <= 0.35:
        return 0.20
    if distance <= 0.75:
        return 0.25
    return 0.45


def _deposit_risk_component(deposit_ratio: float) -> float:
    dr = _safe_float(deposit_ratio, 1.0)
    if dr < 0.85 or dr > 2.70:
        return 0.35
    if dr < 1.00 or dr > 2.50:
        return 0.25
    return 0.10


def _reputation_component(reputation_score: float) -> float:
    rs = _safe_float(reputation_score, 50.0)
    if rs >= 50.0:
        # Good reputation reduces risk up to 10%.
        return -0.10 * min(1.0, (rs - 50.0) / 50.0)
    # Low reputation increases risk up to 10%.
    return 0.10 * min(1.0, (50.0 - rs) / 50.0)


def _description_component(description_score: float, description_text: str) -> float:
    base = 0.10 * _clamp01(description_score)
    text = (description_text or "").lower()
    keyword_patterns = [
        r"\bwire transfer\b",
        r"\bwestern union\b",
        r"\bcrypto\b",
        r"\bbitcoin\b",
        r"\boutside the country\b",
        r"\boverseas\b",
        r"\bdeposit before (viewing|visit|visiting)\b",
        r"\bsend deposit first\b",
        r"\bpay first\b",
    ]
    hits = sum(1 for p in keyword_patterns if re.search(p, text))
    if hits >= 3:
        bonus = 0.10
    elif hits >= 1:
        bonus = 0.05
    else:
        bonus = 0.0
    return base + bonus


def _reviews_component(average_rating: float, thumbs_ratio: float, reviews_text: str = "", is_new_listing: bool = False) -> float:
    if bool(is_new_listing):
        return 0.0

    rating = _safe_float(average_rating, 3.0)
    thumbs = _safe_float(thumbs_ratio, 0.5)

    score = 0.0
    if rating >= 4.5 and thumbs >= 0.70:
        score = -0.10
    elif rating >= 4.0 and thumbs >= 0.60:
        score = -0.05
    elif rating < 2.5 or thumbs < 0.40:
        score = 0.12
    elif rating < 3.0 or thumbs < 0.45:
        score = 0.10
    elif rating < 3.5 or thumbs < 0.55:
        score = 0.06

    text = (reviews_text or "").lower()
    if text.strip():
        negative_patterns = [
            r"\bscam\b",
            r"\bfraud\b",
            r"\bfake\b",
            r"\bunsafe\b",
            r"\bno reply\b",
            r"\bpayment first\b",
            r"\bdid not return deposit\b",
        ]
        positive_patterns = [
            r"\breliable\b",
            r"\bprofessional\b",
            r"\bsafe\b",
            r"\bas described\b",
            r"\breturned deposit\b",
            r"\bsmooth\b",
        ]

        negative_hits = sum(1 for p in negative_patterns if re.search(p, text))
        positive_hits = sum(1 for p in positive_patterns if re.search(p, text))

        if negative_hits >= 2:
            score += 0.05
        elif negative_hits == 1:
            score += 0.03

        if positive_hits >= 2:
            score -= 0.05
        elif positive_hits == 1:
            score -= 0.03

    return float(min(0.15, max(-0.12, score)))


def _new_listing_component(is_new_listing: bool) -> float:
    # Fixed neutral uncertainty for new listings.
    return 0.05 if bool(is_new_listing) else 0.0


def compute_weighted_scam_probability(request: PredictionRequest, feature_values: Dict[str, float]):
    price_component = _price_risk_component(request.priceRatio)
    deposit_component = _deposit_risk_component(request.depositRatio)
    reputation_component = _reputation_component(request.reputationScore)
    description_component = _description_component(
        feature_values.get("descriptionScamScore", 0.0),
        request.description or "",
    )
    reviews_component = _reviews_component(
        request.averageReviewRating,
        request.thumbsRatio,
        request.reviews or "",
        bool(request.isNewListing),
    )
    new_listing_component = _new_listing_component(request.isNewListing)

    raw_probability = (
        price_component
        + deposit_component
        + reputation_component
        + description_component
        + reviews_component
        + new_listing_component
    )

    components = {
        "price": price_component,
        "deposit": deposit_component,
        "reputation": reputation_component,
        "description": description_component,
        "reviews": reviews_component,
        "new_listing": new_listing_component,
    }
    return _clamp01(raw_probability), components


def get_shap_scores(features: np.ndarray) -> Optional[np.ndarray]:
    """Return per-feature SHAP contributions for the positive class if available."""
    if explainer is None:
        return None
    try:
        raw_vals = explainer.shap_values(features)
        if isinstance(raw_vals, list) and len(raw_vals) > 1:
            return np.asarray(raw_vals[1][0], dtype=float).flatten()
        if isinstance(raw_vals, np.ndarray):
            if raw_vals.ndim == 3 and raw_vals.shape[2] >= 2:
                return np.asarray(raw_vals[0, :, 1], dtype=float).flatten()
            if raw_vals.ndim == 2:
                return np.asarray(raw_vals[0], dtype=float).flatten()
            if raw_vals.ndim == 1:
                return np.asarray(raw_vals, dtype=float).flatten()
    except Exception as e:
        print(f"[PREDICT] SHAP failed: {e}")
    return None


@app.post("/predict", response_model=PredictionResponse)
async def predict_scam(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model not loaded: {startup_error or 'Unknown startup error'}")

    try:
        features, feature_values = compute_features(request)
        model_input = _apply_model_scaling(features)
        prediction = int(model.predict(model_input)[0])
        proba = model.predict_proba(model_input)[0]
        model_scam_probability = float(proba[1])

        shap_scores = get_shap_scores(model_input)

        top_indices = []
        score_source = "none"
        if shap_scores is not None and len(shap_scores) >= len(selected_features):
            top_indices = np.argsort(np.abs(shap_scores))[-10:][::-1]
            score_source = "shap"
        elif hasattr(model, "feature_importances_"):
            importances = np.asarray(model.feature_importances_, dtype=float)
            top_indices = np.argsort(importances)[-10:][::-1]
            score_source = "importance"

        explanations: List[FactorExplanation] = []
        seen = set()
        
        # Calculate total absolute contribution for percentage conversion
        total_abs_contribution = 0.0
        if score_source == "shap" and shap_scores is not None:
            total_abs_contribution = np.sum(np.abs(shap_scores))
        elif score_source == "importance" and hasattr(model, "feature_importances_"):
            total_abs_contribution = np.sum(np.abs(model.feature_importances_))

        for idx in top_indices:
            idx = int(idx)
            if idx >= len(selected_features):
                continue

            original_name = selected_features[idx]
            canonical = canonical_feature_name(original_name)
            value = _safe_float(feature_values.get(canonical, 0.0), 0.0)

            score = 0.0
            if score_source == "shap" and shap_scores is not None:
                score = float(shap_scores[idx])
            elif score_source == "importance" and hasattr(model, "feature_importances_"):
                score = float(model.feature_importances_[idx])

            # Show user-facing direction from feature semantics to avoid contradictory messaging.
            direction = infer_risk_direction(canonical, value, bool(request.isNewListing))
            
            # Calculate percentage contribution
            contribution_percent = None
            if total_abs_contribution > 0:
                contribution_percent = round((abs(score) / total_abs_contribution) * 100, 1)

            pretty = pretty_feature_name(canonical)
            if pretty in seen:
                continue
            seen.add(pretty)

            explanations.append(FactorExplanation(
                feature=pretty,
                score=round(score, 3),
                direction=direction,
                impact=explanation_for_feature(canonical, value, direction, bool(request.isNewListing)),
                contribution_percent=contribution_percent,
            ))

        if not explanations:
            fallback_price_direction = "decreases" if 0.9 <= request.priceRatio <= 1.05 else "increases"
            fallback_price_distance = (
                (0.9 - request.priceRatio)
                if request.priceRatio < 0.9
                else (request.priceRatio - 1.05)
            )
            fallback_price_score = (
                -0.2
                if 0.9 <= request.priceRatio <= 1.05
                else (0.6 if fallback_price_distance > 0.75 else 0.2)
            )
            explanations = [
                FactorExplanation(
                    feature="PriceRatio",
                    score=fallback_price_score,
                    direction=fallback_price_direction,
                    impact=explanation_for_feature(
                        "priceRatio",
                        _safe_float(request.priceRatio, 1.0),
                        fallback_price_direction,
                        bool(request.isNewListing),
                    ),
                    contribution_percent=60.0,
                ),
                FactorExplanation(
                    feature="DescriptionScamScore",
                    score=0.4,
                    direction="increases",
                    impact=explanation_for_feature(
                        "descriptionScamScore",
                        feature_values.get("descriptionScamScore", 0.0),
                        "increases",
                        bool(request.isNewListing),
                    ),
                    contribution_percent=40.0,
                ),
            ]

        explanations = sorted(explanations, key=lambda f: abs(f.score), reverse=True)
        top_factors = explanations[:5]

        scam_probability, weighted_components = compute_weighted_scam_probability(request, feature_values)
        is_scam = scam_probability >= 0.5
        # Confidence reflects certainty in the chosen label (distance from 0.5 threshold).
        confidence = min(1.0, max(0.0, abs(scam_probability - 0.5) * 2.0))
        label = "SCAM" if is_scam else "LEGITIMATE"

        component_rows = [
            (
                "PriceRatio",
                float(weighted_components.get("price", 0.0)),
                "priceRatio",
                _safe_float(request.priceRatio, 1.0),
            ),
            (
                "DepositRatio",
                float(weighted_components.get("deposit", 0.0)),
                "depositRatio",
                _safe_float(request.depositRatio, 1.0),
            ),
            (
                "ReputationScore",
                float(weighted_components.get("reputation", 0.0)),
                "reputationScore",
                _safe_float(request.reputationScore, 50.0),
            ),
            (
                "DescriptionScamScore",
                float(weighted_components.get("description", 0.0)),
                "descriptionScamScore",
                _safe_float(feature_values.get("descriptionScamScore", 0.0), 0.0),
            ),
            (
                "AverageReviewRating",
                float(weighted_components.get("reviews", 0.0)),
                "averageReviewRating",
                _safe_float(request.averageReviewRating, 3.0),
            ),
        ]

        if bool(request.isNewListing):
            component_rows.append((
                "NewListing",
                float(weighted_components.get("new_listing", 0.0)),
                "averageReviewRating",
                _safe_float(request.averageReviewRating, 3.0),
            ))

        total_component_weight = sum(abs(row[1]) for row in component_rows)
        weighted_factors: List[FactorExplanation] = []
        for feature_name, score, canonical_name, value in component_rows:
            direction = "increases" if score > 0 else ("decreases" if score < 0 else "neutral")
            if feature_name == "NewListing":
                impact = "New listing baseline uncertainty adds a fixed neutral risk weight"
            elif feature_name == "AverageReviewRating":
                impact = (
                    f"Combined review quality signal uses rating={_safe_float(request.averageReviewRating, 3.0):.1f} "
                    f"and thumbs ratio={_safe_float(request.thumbsRatio, 0.5):.2f}"
                )
            else:
                impact = explanation_for_feature(canonical_name, value, direction, bool(request.isNewListing))

            contribution_percent = 0.0
            if total_component_weight > 0:
                contribution_percent = round((abs(score) / total_component_weight) * 100.0, 1)

            weighted_factors.append(FactorExplanation(
                feature=feature_name,
                score=round(score, 3),
                direction=direction,
                impact=impact,
                contribution_percent=contribution_percent,
            ))

        top_factors = sorted(weighted_factors, key=lambda f: abs(f.score), reverse=True)[:5]

        return PredictionResponse(
            scam_prediction=is_scam,
            scam_probability=scam_probability,
            scam_explanations=top_factors,
            summary=PredictionSummary(
                label=label,
                confidence=round(confidence, 4),
                scam_probability=round(scam_probability, 4),
                top_factors=top_factors,
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.post("/publish-property")
async def publish_property(request: PropertyPublishRequest):
    """
    Assess property for scam risk when landlord publishes listing.
    
    Calculates PriceRatio based on market baseline for the area,
    then runs full scam detection on all 7 features.
    
    Returns assessment with red flags and scam probability.
    """
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model not loaded: {startup_error or 'Unknown startup error'}")
    
    if property_assessor is None:
        raise HTTPException(status_code=503, detail="Property assessment module not initialized")
    
    try:
        # Step 1: Assess property and calculate all features
        assessment = property_assessor.assess_property_on_publish(
            country=request.country,
            city=request.city,
            property_type=request.propertyType,
            bedrooms=request.bedrooms,
            listed_price=request.listedPrice,
            deposit_amount=request.depositAmount,
            landlord_reputation_score=request.landlordReputationScore,
            landlord_nationality_match=request.landlordNationalityMatch or True,
            positive_reviews=request.positiveReviews or 0,
            negative_reviews=request.negativeReviews or 0,
            description=request.description or "",
            reviews_text=request.reviewsText or "",
        )
        
        # Step 2: Create prediction request from computed features
        feature_dict = assessment['features']
        pred_request = PredictionRequest(
            priceRatio=feature_dict['PriceRatio'],
            depositRatio=feature_dict['DepositRatio'],
            reputationScore=feature_dict['ReputationScore'],
            nationalityMismatch=bool(feature_dict['NationalityMismatch']),
            thumbsRatio=feature_dict['ThumbsRatio'],
            averageReviewRating=feature_dict['AverageReviewRating'],
            isNewListing=True,
            description=request.description or "",
            reviews=request.reviewsText or "",
        )
        
        # Step 3: Get scam prediction using weighted feature logic
        features_array, feature_values = compute_features(pred_request)
        model_input = _apply_model_scaling(features_array)
        prediction = int(model.predict(model_input)[0])
        proba = model.predict_proba(model_input)[0]
        model_scam_probability = float(proba[1])

        price_ratio = assessment['price_ratio']
        scam_probability, weighted_components = compute_weighted_scam_probability(pred_request, feature_values)
        is_scam = scam_probability >= 0.5
        
        # Step 4: Format response
        return {
            "status": "assessment_complete",
            "property": {
                "country": request.country,
                "city": request.city,
                "propertyType": request.propertyType,
                "bedrooms": request.bedrooms,
                "listedPrice": request.listedPrice,
                "marketPrice": assessment['market_price'],
            },
            "scam_detection": {
                "is_scam": is_scam,
                "scam_probability": round(scam_probability, 4),
                "model_probability": round(model_scam_probability, 4),
                "weighted_components": {
                    "price": round(float(weighted_components.get("price", 0.0)), 4),
                    "deposit": round(float(weighted_components.get("deposit", 0.0)), 4),
                    "reputation": round(float(weighted_components.get("reputation", 0.0)), 4),
                    "description": round(float(weighted_components.get("description", 0.0)), 4),
                    "reviews": round(float(weighted_components.get("reviews", 0.0)), 4),
                    "new_listing": round(float(weighted_components.get("new_listing", 0.0)), 4),
                },
                "confidence": round(scam_probability if is_scam else (1.0 - scam_probability), 4),
            },
            "price_analysis": {
                "price_ratio": round(price_ratio, 3),
                "deposit_ratio": round(assessment['deposit_ratio'], 3),
                "price_risk_level": assessment['price_risk_level'],
                "price_summary": assessment['summary'],
            },
            "red_flags": assessment['red_flags'],
            "recommendation": (
                "🚫 BLOCK THIS LISTING" if is_scam else "✅ ALLOW PUBLICATION"
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Property assessment failed: {e}")


@app.get("/")
async def root():
    return {
        "message": "Scam Detection API is running",
        "model_loaded": model is not None,
        "shap_available": shap is not None and explainer is not None,
        "startup_error": startup_error,
    }


@app.get("/health")
async def health():
    if model is None:
        return {
            "status": "unhealthy",
            "model_working": False,
            "error": startup_error or "Model not loaded",
        }

    try:
        neutral = {
            "priceRatio": 1.0,
            "depositRatio": 1.0,
            "reputationScore": 50.0,
            "nationalityMismatch": 0.0,
            "thumbsRatio": 0.5,
            "averageReviewRating": 3.0,
            "descriptionScamScore": 0.2,
        }
        vector = []
        for feat in selected_features:
            vector.append(neutral.get(canonical_feature_name(feat), 0.0))
        test_features = np.array([vector], dtype=float)
        test_features = _apply_model_scaling(test_features)

        _ = model.predict(test_features)
        _ = model.predict_proba(test_features)

        return {
            "status": "healthy",
            "model_working": True,
            "model_type": type(model).__name__,
            "features_count": len(selected_features) if selected_features else 0,
            "features": selected_features,
            "nlp_model_loaded": desc_vectorizer is not None and desc_text_model is not None,
            "metadata_loaded": bool(model_metadata),
            "scaler_loaded": scaler_mean is not None and scaler_scale is not None,
            "target_accuracy_band": model_metadata.get("target_accuracy_band") if model_metadata else None,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "model_working": False,
            "error": str(e),
            "model_type": type(model).__name__ if model else "None",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)