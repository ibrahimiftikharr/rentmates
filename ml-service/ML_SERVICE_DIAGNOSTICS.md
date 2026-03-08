# ML Service - Issues & Solutions

## Issue 1: scikit-learn Version Mismatch

### Problem
```
InconsistentVersionWarning: Trying to unpickle estimator DecisionTreeClassifier 
from version 1.6.1 when using version 1.8.0
```

### Cause
- The pickled models (`scam_detector.pkl`, `scam_detector_hybrid.pkl`) were trained with scikit-learn v1.6.1
- Your current environment has scikit-learn v1.8.0 installed
- When unpickling, sklearn detects the version mismatch and warns that results may be invalid

### Solution
Fix the scikit-learn version to match requirements.txt:
```bash
cd ml-service
pip install scikit-learn==1.5.0
```

The `requirements.txt` specifies: `scikit-learn==1.5.0`, so your environment should match this.

### Verification
After installing, the version warnings should disappear when you restart the service.

---

## Issue 2: 422 Error on /predict Endpoint

### Problem
```
POST /predict HTTP/1.1" 422 Unprocessable Content
```

### Cause
The endpoint received a request that doesn't match the expected `PredictionRequest` schema. 
This happens when:
1. **Missing required fields** - Not all 12 required fields were sent
2. **Wrong data types** - Sending string when float expected, etc.
3. **Malformed JSON** - JSON structure doesn't match schema

### Expected Request Format
The `/predict` endpoint requires **ALL** of these fields:
```json
{
  "priceRatio": 1.2,                    // float
  "depositRatio": 0.5,                 // float
  "depositTooHigh": false,              // bool
  "landlordVerified": true,             // bool
  "reputationScore": 4.5,               // float
  "nationalityMismatch": false,         // bool
  "thumbsRatio": 0.8,                   // float
  "minStayMonths": 12,                  // int
  "description_length": 500,            // int
  "description_word_count": 80,         // int
  "has_scam_keywords": false,           // bool
  "review_count": 25                    // int
}
```

### Expected Response (on success)
```json
{
  "scam_prediction": false,
  "scam_probability": 0.15,
  "scam_explanations": [
    {
      "feature": "reputationScore",
      "impact": "decreases scam probability"
    },
    ...
  ]
}
```

### Solution
When calling the endpoint from your backend, ensure you send:
1. All 12 fields
2. Correct data types (int, float, bool)
3. Proper JSON formatting
4. Content-Type header: `application/json`

### Testing
A test script has been created at: `ml-service/test_predict_endpoint.py`

To test the endpoint:
```bash
# Terminal 1: Start the ML service
cd ml-service
source venv/Scripts/activate
python main.py

# Terminal 2: Run the test
cd ml-service
pip install requests
python test_predict_endpoint.py
```

---

## Quick Fixes Checklist
- [ ] Install scikit-learn==1.5.0 to fix version warnings
- [ ] Ensure all 12 required fields are sent to /predict endpoint
- [ ] Verify data types match (int, float, bool)
- [ ] Test using the provided test script
- [ ] Update backend code to send properly formatted requests

---

## Model Details
The service uses two models (fallback if primary fails):
1. **Primary**: `scam_detector_hybrid.pkl` + `hybrid_features.pkl` (more accurate)
2. **Fallback**: `scam_detector.pkl` + `feature_names.pkl` (if hybrid fails)

Current status: Using fallback model due to file corruption during git operations.
To fix: Ensure `*.pkl binary` is in `.gitattributes` to prevent text conversion.
