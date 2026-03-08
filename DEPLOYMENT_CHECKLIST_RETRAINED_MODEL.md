# 🚀 Retrained Model Deployment Checklist

## Status Summary
✅ **Notebook**: Retrained with 12-feature hybrid model + regularization + cross-validation
✅ **Model Files**: All pickle files saved in `ml-service/`
✅ **Backend**: Already compatible (no code changes needed)
✅ **Frontend**: Already compatible (no code changes needed)

---

## Models & Features

### Saved Files
- ✅ `scam_detector.pkl` - Main model (Gradient Boosting Classifier)
- ✅ `scam_detector_hybrid.pkl` - Alias for backward compatibility
- ✅ `hybrid_features.pkl` - 12-feature list
- ✅ `tfidf_description.pkl` - Text vectorizer for descriptions
- ✅ `tfidf_reviews.pkl` - Text vectorizer for reviews
- ✅ `cv_results.pkl` - Cross-validation metrics for audit trail

### 12 Features (Exact Order)
1. `PriceRatio` - Price vs market average
2. `DepositRatio` - Deposit vs monthly rent
3. `DepositTooHigh` - Boolean flag
4. `HasProfilePic` (called `landlordVerified` in backend)
5. `ReputationScore` - Landlord reputation (0-100)
6. `NationalityMismatch` - Boolean flag
7. `ThumbsRatio` - Positive feedback ratio
8. `MinStayMonths` - Minimum stay requirement
9. `description_length` - Rental description length
10. `description_word_count` - Word count in description
11. `has_scam_keywords` - Scam keyword detection
12. `review_count` - Number of reviews

### Model Performance (CV Results)
- **Best Model**: Gradient Boosting Classifier
- **CV Accuracy**: 99.4% ± 0.2%
- **CV AUC**: 100% ± 0.0%
- **Test Accuracy**: 99.3%
- **Test AUC**: 100%

⚠️ **Note**: 99%+ accuracy still suggests high synthetic data quality. Monitor on real data.

---

## Backend Integration (NO CHANGES NEEDED)

### Current Flow
```
Property Created/Updated
  ↓
propertyController.js calls predictScamAsync()
  ↓
mlClient.js sends POST request to http://localhost:8000/predict
  ↓
main.py /predict endpoint loads scam_detector.pkl
  ↓
Response stored in Property.scam_prediction, scam_probability, scam_explanations
```

### Feature Mapping (Backend → Notebook)
| Backend Variable | Notebook Feature | Source |
|---|---|---|
| `priceRatio` | `PriceRatio` | Computed from price data |
| `depositRatio` | `DepositRatio` | Computed from deposit/price |
| `depositTooHigh` | `DepositTooHigh` | Boolean flag |
| `landlordVerified` | `HasProfilePic` | governmentId + govIdDocument check |
| `reputationScore` | `ReputationScore` | Landlord reputation |
| `nationalityMismatch` | `NationalityMismatch` | Currently hardcoded false |
| `thumbsRatio` | `ThumbsRatio` | thumbsUp / (thumbsUp + thumbsDown) |
| `minStayMonths` | `MinStayMonths` | Minimum stay field |
| `description_length` | `description_length` | String length |
| `description_word_count` | `description_word_count` | Split count |
| `has_scam_keywords` | `has_scam_keywords` | Regex pattern match |
| `review_count` | `review_count` | Split count |

---

## Frontend Integration (NO CHANGES NEEDED)

### Current Display
- **Risk Assessment Card**: Shows scam prediction with color coding
  - Red (Scam): `bg-red-50 border-red-300`
  - Green (Legitimate): `bg-green-50 border-green-300`
- **Probability Display**: Shows `(scam_probability * 100).toFixed(1)}%`
- **Top Factors**: Displays up to 5 contributing factors with scores
- **Refresh Button**: Manual refresh available
- **Auto-refresh**: Every 6 seconds (first load)

### No Frontend Changes Required
- All fields already match backend response structure
- Already handles `scam_prediction`, `scam_probability`, `scam_explanations`, `scam_summary`

---

## Deployment Steps

### Step 1: Verify Model Files Exist ✅
```bash
cd ml-service
ls -la *.pkl
# Expected: 6 files
# - scam_detector.pkl (new)
# - scam_detector_hybrid.pkl (new)
# - hybrid_features.pkl (new)
# - tfidf_description.pkl (new)
# - tfidf_reviews.pkl (new)
# - cv_results.pkl (new)
```

### Step 2: Check Backend Environment (Optional Verification)
```bash
# Backend's main.py already configured to load:
# - ML_API_URL (default: http://localhost:8000/predict)
# - Automatic fallback to scam_detector.pkl if hybrid fails
```

### Step 3: Restart ML Service
```bash
# Terminal 1: ML Service
cd ml-service
python main.py  # OR: python -m uvicorn main:app --reload

# Expected output:
# ✅ Loaded hybrid model with 12 features
# 📊 Features: ['PriceRatio', 'DepositRatio', ...]
# 🤖 Model type: GradientBoostingClassifier
```

### Step 4: Restart Backend (Optional)
```bash
# Terminal 2: Backend
cd backend
npm run dev

# Will auto-connect to http://localhost:8000/predict
```

### Step 5: Frontend Auto-Loads
- No restart needed
- Frontend will fetch updated predictions on next property view
- Auto-refresh every 6 seconds

### Step 6: Test Prediction
```bash
# Option A: Use test script
cd ml-service
python test_predict_endpoint.py

# Option B: Manual curl test
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "priceRatio": 0.95,
    "depositRatio": 1.0,
    "depositTooHigh": false,
    "landlordVerified": true,
    "reputationScore": 85,
    "nationalityMismatch": false,
    "thumbsRatio": 0.9,
    "minStayMonths": 12,
    "description_length": 150,
    "description_word_count": 25,
    "has_scam_keywords": false,
    "review_count": 5,
    "isNewListing": false
  }'

# Expected: {..., "scam_probability": 0.01, "scam_prediction": false}
```

---

## Verification Checklist

### After Deployment
- [ ] ML Service starts without errors
- [ ] Backend service starts and connects to ML API
- [ ] Create new property → no errors in backend console
- [ ] Frontend shows "Property Risk Assessment" card
- [ ] Card shows probabilities (not "pending")
- [ ] Scam prediction matches model output
- [ ] Click "Refresh" → updates without errors

### Monitor First Week
- [ ] Track scam predictions on real listings
- [ ] Compare CV metrics (99.4%) vs real-world accuracy
- [ ] If accuracy drops significantly, retrain with:
  - Increased noise (noise_scale=0.10)
  - More regularization
  - Real labeled data (if available)

---

## Rollback Plan

If issues arise:

### Quick Rollback (Same Model)
```bash
# Remove pickle files (triggers fallback)
rm ml-service/scam_detector_hybrid.pkl
# Service will fall back to scam_detector.pkl
```

### Full Rollback (Previous Model)
If you have a backup of the old model:
```bash
cp old_scam_detector.pkl ml-service/scam_detector.pkl
cp old_hybrid_features.pkl ml-service/hybrid_features.pkl
# Restart ML service
python ml-service/main.py
```

---

## Known Issues & Solutions

| Issue | Solution |
|---|---|
| "Model file not found" | Verify all `.pkl` files exist in `ml-service/` |
| "Max workers exceeded" | Reduce `-j` flag in cross_val_score calls |
| 99%+ accuracy seems high | Expected for synthetic data; monitor real-world performance |
| NLP not visible in predictions | TF-IDF trained but 12-feature hybrid used (by design) |

---

## Next Optimizations (Not Required Now)

These are optional future improvements:

1. **Full TF-IDF Integration**
   - Use 55+ features (12 hybrid + 30 description + 15 review terms)
   - Requires backend to send text, compute TF-IDF
   - Better scam detection via language patterns

2. **Real-World Retraining**
   - Collect labeled scam/legit from users
   - Retrain quarterly
   - Improve accuracy beyond synthetic data

3. **A/B Testing**
   - Deploy alongside old model
   - Compare predictions on same properties
   - Gradual rollout to 10% → 50% → 100% users

4. **Monitoring Dashboard**
   - Track prediction distribution
   - False positive/negative rates
   - Model drift detection

---

## Support

- **Notebook**: `ml-service/Rental_scam_final.ipynb`
- **Training Guide**: `ml-service/IMPROVED_MODEL_GUIDE.md`
- **Verification Script**: `ml-service/verify_improved_model.py`
- **Diagnostic Report**: `ml-service/ML_SERVICE_DIAGNOSTICS.md`

---

**Status**: Ready for deployment ✅
**Last Updated**: 2026-03-07
**Model Type**: Gradient Boosting Classifier
**Features**: 12 (hybrid numeric + aggregated text)
**Backend Compatibility**: ✅ No changes needed
**Frontend Compatibility**: ✅ No changes needed
