# ML Service Diagnostic & Setup Guide

## Quick Checklist

- [ ] ML service is running (`python main.py` in `ml-service/` directory)
- [ ] Backend is running (`npm run dev` in `backend/` directory)  
- [ ] No firewall blocking port 8000
- [ ] Both services configured to connect on `localhost`

## How to Start Everything

### Step 1: Start ML Service (in separate terminal/PowerShell)

```bash
cd c:\Users\TKIRAN\Downloads\rentmates-master\ml-service
python main.py
```

**You should see:**
```
🔧 [STARTUP] Loading ML models...
✅ [STARTUP] Loaded hybrid model with 12 features
🤖 [STARTUP] Model type: RandomForestClassifier
✅ [STARTUP] SHAP explainer initialized
✅ [STARTUP] ML service startup complete. Model loaded and ready.

INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Test ML Service Health (while ML service is running)

In a **different terminal/PowerShell**:

```bash
cd c:\Users\TKIRAN\Downloads\rentmates-master\ml-service
python test_local.py
```

**Expected output:**
```
Testing ML Service Health Endpoint
Status Code: 200
Response: {
  "status": "healthy",
  "model_working": true,
  "model_type": "RandomForestClassifier",
  "features_count": 12
}
✅ ML service is healthy!

Testing ML Service Predict Endpoint
Sending test payload:
{...payload...}
Status Code: 200
✅ Prediction successful!
Scam Prediction: True
...
✅ All tests passed!
```

### Step 3: Start Backend (in another terminal/PowerShell)

```bash
cd c:\Users\TKIRAN\Downloads\rentmates-master\backend
npm run dev
```

**You should see:**
```
✓ MongoDB is connected successfully
Market rent lookup loaded
Backend server running on http://localhost:5000
```

### Step 4: Start Frontend (in another terminal/PowerShell)

```bash
cd c:\Users\TKIRAN\Downloads\rentmates-master\frontend
npm run dev
```

## Testing the Full Flow

1. Open browser to frontend (usually `http://localhost:5173`)
2. Create a new property with:
   - Type: "Flat" (NOT "Apartment")
   - Price: £400/month
   - Location: New York, USA (2 bedrooms)
3. On property details page, click **"Refresh"** button under Risk Assessment section
4. **Expected:**
   - Should see either:
     - ✅ Green "Analysis Complete" with a HIGH scam probability (≈0.95+) because £400 is way below NYC market (~$5,750)
     - OR if ML takes a moment: 📋 "Analysis Pending" (wait a few seconds)

## If Still Getting 500 Error

### Check ML Service Console

Look at the terminal where you ran `python main.py`. You should see detailed error logs like:

```
❌ [STARTUP] CRITICAL ERROR during model loading: ...
```

or

```
❌ ERROR in predict_scam endpoint: ...
Traceback (most recent call last):
  ...
```

### Common Issues & Solutions

**Issue: "Model file not found"**
- Solution: Make sure model files exist: `ls ml-service/*.pkl`
- Files needed: `scam_detector.pkl`, `hybrid_features.pkl`, `hybrid_model.pkl`

**Issue: "Console device allocation failure"**
- Solution: Too many bash terminals open. Close several and try again.
- Or use PowerShell instead of Git Bash

**Issue: "Connection refused" when testing**
- Solution: ML service didn't start. Check Python output for errors.

**Issue: "Request failed with status code 500"** 
- Check the ML service console (where `python main.py` is running) for the actual error
- The startup logging will tell you exactly what failed

## Environment Variables

Make sure `.env` files are configured:

**backend/.env** (should have):
```
ML_API_URL=http://localhost:8000/predict
```

**backend/config/.env** or **backend/.env.local** (should have):
```
MONGODB_URI=mongodb://localhost:27017/rentmates
```

## If Models Won't Load

The most common issue is corrupted `.pkl` files. If you see:
```
[WARNING] could not unpickle hybrid model (possible file corruption).
[FALLBACK] Falling back to the original scam_detector.pkl...
```

This is OK - it means the hybrid model is corrupted but the service fell back to the original model. The service should still work.

To regenerate models, run the notebook:
```bash
cd ml-service
jupyter notebook Rental_scam_final.ipynb
# Run all cells through the model training section
```

## Debugging Individual Piece

### Test just the backend (no ML service needed):
```bash
cd backend
npm test  # or curl http://localhost:5000/api/health
```

### Test just the ML service:
```bash
cd ml-service
python test_local.py  # independent of backend
```

### Test frontend builds:
```bash
cd frontend
npm run build  # check for build errors
```
