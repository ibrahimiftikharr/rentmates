# Modal.com Deployment - Complete Guide

## 🎯 Overview
Your roommate compatibility ML model is now packaged and ready for **serverless deployment** on Modal.com. This means:
- ✅ **No server management** - Modal handles all infrastructure
- ✅ **Auto-scaling** - Handles 1 or 1000 requests automatically
- ✅ **Pay-per-use** - Only charged when model is running
- ✅ **HTTPS built-in** - Secure endpoints out of the box
- ✅ **Free tier available** - $30/month credits for FYP projects

---

## 📁 What's Ready
The `modal-deployment/` folder contains everything needed:

```
modal-deployment/
├── modal_app.py         # Main Modal application (serverless functions)
├── model.py             # ML model (Gradient Boosting + feature engineering)
├── features.py          # Feature extraction (17 features + Sentence-BERT)
├── requirements.txt     # Dependencies (modal>=0.55.0)
├── README.md           # Detailed deployment guide
├── test-data.json      # Sample data for testing endpoints
└── .gitignore          # Python/Modal artifacts
```

---

## 🚀 Quick Deployment (4 Steps)

### Step 1: Install Modal CLI
```powershell
pip install modal
```

### Step 2: Authenticate with Modal
```powershell
modal token new
```
This opens a browser window. Log in with GitHub, Google, or email.

### Step 3: Deploy the Application
```powershell
cd modal-deployment
modal deploy modal_app.py
```

**What happens:**
- Modal creates container image with all dependencies
- Sets up persistent storage for model weights
- Deploys 4 web endpoints (predict, predict-batch, health, train)
- Provides you with HTTPS URLs

**Expected output:**
```
✓ Created deployment...
✓ Building image im-xxx...
✓ App deployed!

Endpoints:
  https://your-username--rentmates-compatibility-predict-endpoint.modal.run
  https://your-username--rentmates-compatibility-predict-batch-endpoint.modal.run
  https://your-username--rentmates-compatibility-health-endpoint.modal.run
  https://your-username--rentmates-compatibility-train-endpoint.modal.run
```

### Step 4: Train Your Model
```powershell
# Option A: Using Modal CLI (recommended for first time)
modal run modal_app.py::train_model

# Option B: Using HTTP POST (from Postman or curl)
curl -X POST https://your-username--rentmates-compatibility-train-endpoint.modal.run
```

**Training details:**
- Loads 64 realistic student compatibility pairs from CSV
- Each pair has unique, meaningful bios and varied attributes
- Trains Gradient Boosting model
- Saves to persistent volume (`/models/roommate_matcher.pkl`)
- Takes ~2-3 minutes on first run

---

## 🔧 Backend Configuration

After deployment, update your backend to use Modal endpoints:

### 1. Update `backend/.env`
```env
# ML Service Configuration
USE_ML_SERVICE=true
ML_SERVICE_URL=https://your-username--rentmates-compatibility-predict-endpoint.modal.run
ML_TIMEOUT=10000
```

**Important:**
- Replace `your-username` with your actual Modal username (shown in deployment output)
- The backend automatically detects Modal URLs and handles endpoint routing
- Timeout set to 10 seconds (serverless cold starts can take 2-5 seconds)

### 2. How Backend Handles Modal vs Flask

The updated [backend/services/compatibilityService.js](backend/services/compatibilityService.js) now intelligently detects deployment type:

**Modal Detection:**
```javascript
const IS_MODAL = ML_SERVICE_URL.includes('modal.run');
```

**URL Routing:**
- **Modal**: Each endpoint is a separate subdomain
  - Predict: `https://user--app-predict-endpoint.modal.run`
  - Batch: `https://user--app-predict-batch-endpoint.modal.run`
  - Health: `https://user--app-health-endpoint.modal.run`
  
- **Flask (local)**: Traditional path-based routing
  - Predict: `http://localhost:5001/predict`
  - Batch: `http://localhost:5001/predict-batch`
  - Health: `http://localhost:5001/health`

The backend automatically uses the correct format!

---

## 🧪 Testing Your Deployment

### Test 1: Health Check
```powershell
curl https://your-username--rentmates-compatibility-health-endpoint.modal.run
```

**Expected response:**
```json
{
  "status": "healthy",
  "model_trained": true,
  "service": "RentMates Compatibility ML Service",
  "version": "2.0.0"
}
```

### Test 2: Single Prediction
```powershell
$body = Get-Content modal-deployment/test-data.json -Raw
curl -X POST https://your-username--rentmates-compatibility-predict-endpoint.modal.run `
  -H "Content-Type: application/json" `
  -d $body
```

**Expected response:**
```json
{
  "success": true,
  "compatibilityScore": 87.5,
  "student1_id": "507f1f77bcf86cd799439011",
  "student2_id": "507f191e810c19729de860ea",
  "inference_time_ms": 45
}
```

### Test 3: Batch Prediction
Use the `/predict-batch-endpoint` with the batch test data format.

---

## 📊 Monitoring & Logs

### View Logs
```powershell
modal app logs rentmates-compatibility
```

### View Dashboard
https://modal.com/apps

From the dashboard you can:
- See all your endpoints and URLs
- Monitor request volume and latency
- View detailed logs for each function call
- Check billing and usage

---

## 🔄 Model Updates

### Retrain with New Data
```powershell
# Update train_model() function in modal_app.py with real data
modal deploy modal_app.py
modal run modal_app.py::train_model
```

### Switch Back to Local Development
```env
# In backend/.env
USE_ML_SERVICE=true
ML_SERVICE_URL=http://localhost:5001
ML_TIMEOUT=5000
```

Then run local Flask service:
```powershell
cd ml-service
python app.py
```

---

## 💰 Pricing

**Free Tier:** $30/month credits (perfect for FYP)

**Typical Usage:**
- Model prediction: ~0.1-0.5 seconds compute time
- Cold start: ~2-5 seconds (first request after idle)
- Idle timeout: 5 minutes (configurable)

**Estimated Costs for FYP:**
- 1000 predictions/day: ~$2-5/month
- Model training (1x/week): ~$1/month
- **Total: Well within free tier**

---

## ⚠️ Troubleshooting

### "Model not found" Error
**Cause:** Model hasn't been trained yet  
**Fix:** Run training:
```powershell
modal run modal_app.py::train_model
```

### Slow First Request
**Cause:** Cold start (Modal spinning up container)  
**Fix:** This is normal. Subsequent requests are fast (~50-200ms)

### 401 Unauthorized
**Cause:** Modal token expired  
**Fix:** Re-authenticate:
```powershell
modal token new
```

### Backend Connection Refused
**Cause:** Wrong ML_SERVICE_URL in .env  
**Fix:** Copy exact URL from Modal dashboard, ensure it ends with `-predict-endpoint.modal.run`

### Dependencies Installation Failed
**Cause:** PyTorch/transformers version conflicts  
**Fix:** The container image is pinned to working versions. If issues persist, check [modal_app.py](modal-deployment/modal_app.py) image definition.

---

## 🔐 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_ML_SERVICE` | `true` | Enable ML predictions (set to `false` to use JS fallback) |
| `ML_SERVICE_URL` | `http://localhost:5001` | Base URL for ML service |
| `ML_TIMEOUT` | `10000` | Request timeout in milliseconds |

---

## 📖 API Endpoints

### 1. **POST /predict-endpoint**
Single student compatibility prediction

**Request:**
```json
{
  "student1": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "budget": { "min": 500, "max": 800 },
    "university": "NTU",
    "course": "Computer Science",
    "yearOfStudy": 2,
    ...
  },
  "student2": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "compatibilityScore": 87.5,
  "student1_id": "507f1f77bcf86cd799439011",
  "student2_id": "507f191e810c19729de860ea",
  "inference_time_ms": 45
}
```

### 2. **POST /predict-batch-endpoint**
Batch predictions for multiple students

**Request:**
```json
{
  "currentStudent": { ... },
  "otherStudents": [ {...}, {...}, ... ]
}
```

**Response:**
```json
{
  "success": true,
  "scores": [
    {
      "studentId": "507f191e810c19729de860ea",
      "compatibilityScore": 87.5
    },
    ...
  ],
  "total_students": 10,
  "inference_time_ms": 250
}
```

### 3. **GET /health-endpoint**
Health check and model status

**Response:**
```json
{
  "status": "healthy",
  "model_trained": true,
  "service": "RentMates Compatibility ML Service",
  "version": "2.0.0"
}
```

### 4. **POST /train-endpoint**
Trigger model training (admin only in production)

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully",
  "training_samples": 1000,
  "training_time_seconds": 45.2
}
```

---

## 🎓 Next Steps

1. ✅ **Deploy to Modal** - Follow Quick Deployment steps above
2. ✅ **Train Initial Model** - Run `modal run modal_app.py::train_model`
3. ✅ **Update Backend .env** - Configure `ML_SERVICE_URL` with your Modal URL
4. ✅ **Test Integration** - Check health endpoint, make test predictions
5. ✅ **Frontend Testing** - Use your app's roommate matching feature
6. 📊 **Expand Training Data** - Add more student pairs to `training_data.csv` with real compatibility ratings
7. 🔄 **Retrain Model** - Periodically retrain as you collect more user feedback

---

## 🆘 Support Resources

- **Modal Documentation**: https://modal.com/docs
- **Modal Community**: https://modal.com/community
- **Sentence-BERT Docs**: https://www.sbert.net/
- **Scikit-learn Gradient Boosting**: https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting

---

## 📝 Summary

Your ML model is production-ready and optimized for serverless deployment. The Modal.com platform provides:

✅ **Enterprise-grade infrastructure** without DevOps overhead  
✅ **Automatic scaling** from 0 to thousands of requests  
✅ **Cost-effective** pay-per-use pricing within free tier  
✅ **Simple deployment** with one command  
✅ **Built-in monitoring** and logs

Deploy now and focus on your FYP features, not server management! 🚀
