#  Modal.com Deployment Checklist

## Pre-Deployment

- [ ] Python 3.8+ installed
- [ ] pip package manager available
- [ ] Modal account created (free at https://modal.com)
- [ ] All files in `modal-deployment/` folder present:
  - [ ] `modal_app.py`
  - [ ] `model.py`
  - [ ] `features.py`
  - [ ] `requirements.txt`
  - [ ] `test-data.json`

---

## Deployment Steps

### 1. Modal Setup
- [ ] Install Modal CLI: `pip install modal`
- [ ] Authenticate: `modal token new`
- [ ] Browser opens and login succeeds
- [ ] Token saved confirmation message appears

### 2. Deploy Application
- [ ] Navigate to modal-deployment folder: `cd modal-deployment`
- [ ] Run deployment: `modal deploy modal_app.py`
- [ ] Wait for image build (first time: 5-10 minutes)
- [ ] Deployment success message appears
- [ ] Copy all 4 endpoint URLs for reference

### 3. Train Model
- [ ] Run training: `modal run modal_app.py::train_model`
- [ ] Training completes successfully (~2-3 minutes)
- [ ] See "Model trained successfully" message
- [ ] Model saved to persistent volume

---

## Backend Integration

### 4. Configure Backend Environment
- [ ] Open `backend/.env` file
- [ ] Add or update these lines:
  ```env
  USE_ML_SERVICE=true
  ML_SERVICE_URL=https://your-username--rentmates-compatibility-predict-endpoint.modal.run
  ML_TIMEOUT=10000
  ```
- [ ] Replace `your-username` with your actual Modal username
- [ ] Save the file

### 5. Restart Backend Server
- [ ] Stop your backend server (Ctrl+C)
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Check logs for "ML Service" connection messages

---

## Testing

### 6. Test Modal Endpoints
- [ ] **Health Check:**
  ```powershell
  curl https://your-username--rentmates-compatibility-health-endpoint.modal.run
  ```
  Expected: `{"status": "healthy", "model_trained": true}`

- [ ] **Test Prediction:**
  ```powershell
  $body = Get-Content modal-deployment/test-data.json -Raw
  curl -X POST https://your-username--rentmates-compatibility-predict-endpoint.modal.run -H "Content-Type: application/json" -d $body
  ```
  Expected: `{"success": true, "compatibilityScore": 85-95}`

### 7. Test Backend Integration
- [ ] Start your frontend: `cd frontend && npm run dev`
- [ ] Log in to your app
- [ ] Navigate to student flatmate compatibility prediction page
- [ ] View compatibility scores
- [ ] Verify scores are different from old JS-based scores (ML is smarter!)

### 8. Verify Logs
- [ ] Check Modal logs: `modal app logs rentmates-compatibility`
- [ ] Check backend logs for successful ML service calls
- [ ] No errors or timeouts in logs

---

## Post-Deployment

### 9. Monitor Dashboard
- [ ] Open Modal dashboard: https://modal.com/apps
- [ ] Find your `rentmates-compatibility` app
- [ ] Check endpoint status (all green)
- [ ] Review recent requests and latency
- [ ] Verify within free tier ($30/month credits)

### 10. Documentation
- [ ] Save your endpoint URLs in a secure location
- [ ] Note your Modal username for future reference
- [ ] Keep a copy of this checklist for redeployment

---

## Optional: Advanced Configuration

### 11. Cold Start Optimization (Optional)
If you want to reduce cold start time, edit `modal_app.py`:

```python
@stub.function(
    image=image,
    volumes={MODELS_DIR: volume},
    timeout=300,
    keep_warm=1  # Keep 1 container warm (costs ~$5/month)
)
```

### 12. Production Hardening (Optional)
- [ ] Add authentication to train endpoint
- [ ] Set up monitoring alerts
- [ ] Configure custom domain (Modal supports this)
- [ ] Enable request rate limiting

---

## Troubleshooting Common Issues

### [ERROR] "Token not found" Error
**Solution:** Run `modal token new` again

### [ERROR] "Model not trained" Error
**Solution:** Run `modal run modal_app.py::train_model`

### [ERROR] Backend can't connect to Modal
**Solution:** Check `ML_SERVICE_URL` in backend/.env matches exactly

### [ERROR] Slow first request (5+ seconds)
**Solution:** This is normal cold start. Subsequent requests are fast.

### [ERROR] Import errors during deployment
**Solution:** Check Python version is 3.10 as specified in `modal_app.py`

---

## Deployment Commands Quick Reference

```powershell
# Install Modal
pip install modal

# Authenticate
modal token new

# Deploy
cd modal-deployment
modal deploy modal_app.py

# Train model
modal run modal_app.py::train_model

# Check logs
modal app logs rentmates-compatibility

# View apps
modal app list

# Delete app (if needed)
modal app delete rentmates-compatibility
```

---

## Success Criteria

[OK] **Deployment Successful When:**
1. All 4 endpoints accessible via HTTPS
2. Health check returns `"status": "healthy"`
3. Test prediction returns score between 0-100
4. Backend logs show ML service calls
5. Frontend displays compatibility scores
6. No errors in Modal or backend logs
7. Modal dashboard shows green status

---

## Next Steps After Deployment

1.  **Expand Training Data** - Add more pairs to `training_data.csv` from real user feedback
2.  **Retrain Model** - Weekly/monthly retraining with updated CSV data
3. **A/B Testing** - Compare ML scores vs old rule-based scores
4.  **Monitor Accuracy** - Track user feedback on match quality
5.  **Optimize** - Fine-tune features and add more diverse training examples

---

**Estimated Total Time:** 20-30 minutes (including first-time image build)

**Cost:** FREE (within $30/month Modal credits)

**You're ready to deploy! Follow the checklist step by step.**
