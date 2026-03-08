# Roommate Compatibility ML Model - Modal.com Deployment

This folder contains the ML model optimized for serverless deployment on Modal.com.

## 📁 Files

- **modal_app.py** - Main Modal application with web endpoints
- **model.py** - ML model implementation (Gradient Boosting)
- **features.py** - Feature engineering (17 features)
- **training_data.csv** - Professional training dataset with 64 realistic student compatibility pairs
- **requirements.txt** - Modal dependencies
- **test-data.json** - Sample test data for endpoint testing
- **README.md** - Deployment guide
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment checklist

## � Training Data

The model is trained on `training_data.csv`, which contains **64 realistic student compatibility pairs** featuring:

- **Diverse student profiles** across NTU, NUS, and SMU
- **Varied courses** - Computer Science, Medicine, Business, Engineering, Arts, etc.
- **Meaningful, unique bios** - Each student has a detailed, realistic description (not just mixed attributes)
- **Real compatibility patterns** - Scores based on actual compatibility factors like:
  - Lifestyle alignment (quiet studious vs social party-goers)
  - Budget compatibility (similar budget ranges)
  - Study habits (early bird vs night owl, clean vs moderate)
  - Course and university matches
  - Personality traits (introverted vs extroverted)

**Example pairs:**
- High compatibility (92): Two CS students, both quiet, clean, non-smoking, similar budgets
- Low compatibility (38): CS student (quiet, organized) vs Business student (party lover, messy)
- Mixed compatibility (68): Law student (structured) vs Accounting student (similar work ethic, different interests)

To expand the dataset, add more rows to `training_data.csv` following the same format.

## �🚀 Quick Deployment

### 1. Install Modal CLI

```bash
pip install modal
```

### 2. Authenticate with Modal

```bash
modal token new
```

This will open your browser to authenticate. Create a free account if needed.

### 3. Deploy the App

```bash
cd modal-deployment
modal deploy modal_app.py
```

The deployment will:
- Build a container with all dependencies
- Create persistent storage for the model
- Deploy web endpoints
- Give you a public URL

### 4. Train the Model (First Time)

After deployment, train the model:

```bash
modal run modal_app.py::train_model
```

Or call the training endpoint:

```bash
curl -X POST https://your-app-url.modal.run/train
```

### 5. Test the Deployment

```bash
# Test locally first
modal run modal_app.py::test_prediction

# Test health endpoint
curl https://your-app-url.modal.run/health
```

## 🔌 API Endpoints

Once deployed, Modal gives you public URLs for each endpoint:

### Health Check
```http
GET https://<your-username>--rentmates-compatibility-health-endpoint.modal.run
```

### Single Prediction
```http
POST https://<your-username>--rentmates-compatibility-predict-endpoint.modal.run
Content-Type: application/json

{
  "student1": { ...profile... },
  "student2": { ...profile... }
}
```

### Batch Prediction (Recommended)
```http
POST https://<your-username>--rentmates-compatibility-predict-batch-endpoint.modal.run
Content-Type: application/json

{
  "currentStudent": { ...profile... },
  "otherStudents": [ {...}, {...} ]
}
```

### Train Model
```http
POST https://<your-username>--rentmates-compatibility-train-endpoint.modal.run
Content-Type: application/json

{}
```

## 🔧 Configure Your Backend

After deployment, update your Node.js backend `.env`:

```env
USE_ML_SERVICE=true
ML_SERVICE_URL=https://<your-username>--rentmates-compatibility
```

The backend will automatically append the correct endpoint names:
- `/predict-endpoint` for single predictions
- `/predict-batch-endpoint` for batch predictions

## 📊 Modal Dashboard

View your deployment at: https://modal.com/apps

You can:
- See logs in real-time
- Monitor usage and costs
- View container status
- Manage volumes (stored models)

## 💰 Pricing

Modal.com Free Tier includes:
- **$30/month** in free credits
- Good for ~10,000-50,000 predictions/month
- Auto-scales to zero when not in use (no idle costs)

Perfect for FYP projects!

## 🧪 Testing

### Local Testing (Before Deployment)

```bash
# Test the functions locally
modal run modal_app.py::test_prediction
```

### Production Testing

```bash
# Test health
curl https://your-url.modal.run/health

# Test prediction
curl -X POST https://your-url.modal.run/predict-endpoint \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

## 📈 Performance

Modal.com provides:
- **Cold start**: ~2-5 seconds (first request)
- **Warm requests**: ~100-500ms
- **Auto-scaling**: Handles traffic spikes automatically
- **Persistent storage**: Model stays loaded in memory

## 🔄 Updating the Model

### Option 1: Redeploy

```bash
# Make changes to code
modal deploy modal_app.py

# Retrain
modal run modal_app.py::train_model
```

### Option 2: Live Training

Call the `/train` endpoint with new data:

```json
{
  "trainingData": [
    {
      "student1": {...},
      "student2": {...},
      "score": 85
    }
  ]
}
```

## 🐛 Troubleshooting

### Deployment Fails

```bash
# Check logs
modal app logs rentmates-compatibility

# Verify authentication
modal token verify
```

### Model Not Found

Train the model after deployment:
```bash
modal run modal_app.py::train_model
```

### Endpoints Not Working

1. Check deployment status in Modal dashboard
2. Verify URLs are correct (check Modal dashboard for exact URLs)
3. Ensure model is trained

### Backend Can't Connect

Update backend `.env` with correct Modal URL from dashboard.

## 📝 Environment Variables

Modal automatically handles:
- Container isolation
- Dependency management  
- GPU/CPU allocation (if needed in future)
- Persistent storage
- HTTPS certificates

No manual configuration needed!

## 🚀 Production Checklist

- [ ] Deploy app: `modal deploy modal_app.py`
- [ ] Train model: Call `/train` endpoint
- [ ] Test health: GET `/health`
- [ ] Test prediction: POST `/predict-endpoint`
- [ ] Update backend `.env` with Modal URLs
- [ ] Test integration from your app
- [ ] Monitor logs in Modal dashboard

## 📚 Learn More

- Modal Docs: https://modal.com/docs
- Modal Examples: https://modal.com/docs/examples
- Support: https://modal.com/slack

## 🎉 Benefits of Modal vs Local Hosting

| Feature | Local Flask | Modal.com |
|---------|-------------|-----------|
| Setup | Manual venv, pip install | One command deploy |
| Scaling | Single server | Auto-scales |
| Maintenance | You manage | Modal manages |
| SSL/HTTPS | Need reverse proxy | Built-in |
| Costs | Always running | Pay per use |
| Deployment | Complex | `modal deploy` |
| Monitoring | DIY | Built-in dashboard |

---

**Your ML model is now production-ready on serverless infrastructure! 🚀**
