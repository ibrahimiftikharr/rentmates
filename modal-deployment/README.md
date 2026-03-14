# Student Flatmate Compatibility Prediction Using Structured and Textual Profile Features

This folder contains the ML part of my FYP module for matching students with compatible flatmates.

## Purpose

Finding a suitable flatmate is often uncertain, relying primarily on brief interactions and initial impressions. This module transforms that uncertainty into a data-driven decision-making process by integrating structured profile attributes (such as budget, lifestyle, and study habits) with textual analysis of personal bios. The primary objective is to minimize avoidable flatmate mismatch, enhance long-term compatibility, and enable students to secure living arrangements that snhance both academic success and social well-being.

## Files in This Folder

- `modal_app.py`: deployment app and HTTP endpoints
- `model.py`: core model code and step-by-step training pipeline
- `features.py`: feature engineering (structured + text features)
- `train_pipeline.py`: local pipeline runner for reproducible training/evaluation
- `training_data.csv`: training dataset
- `requirements.txt`: deployment dependencies
- `requirements-ml.txt`: local ML dependencies
- `test-data.json`: sample request payload
- `DEPLOYMENT_CHECKLIST.md`: quick deployment checklist

## Dataset

The model is trained using `training_data.csv`.

- Student pairs include university, course, budget, lifestyle, and bio text
- Labels are compatibility scores
- Data includes both high-compatibility and low-compatibility examples

## Step-by-Step Local Pipeline

Run the local training pipeline:

```bash
python train_pipeline.py --csv training_data.csv --seed 42
```

Artifacts generated:

- `artifacts/roommate_matcher.pkl`
- `artifacts/pipeline_report.json`
- `artifacts/final_validation_log.txt`

## Deployed Microservice

This model is deployed as a microservice. The backend calls these HTTP endpoints directly for health checks, scoring, and retraining.

Microservice owner username: ibrahimiftikharr

### Endpoint List and Purpose

1. Health endpoint

Purpose: confirms service availability and whether a trained model file exists.

```http
GET https://ibrahimiftikharr--rentmates-compatibility-health-endpoint.modal.run
```

2. Single prediction endpoint

Purpose: returns one compatibility score for one student pair.

```http
POST https://ibrahimiftikharr--rentmates-compatibility-predict-endpoint.modal.run
Content-Type: application/json

{
  "student1": { ...profile... },
  "student2": { ...profile... }
}
```

3. Batch prediction endpoint

Purpose: returns ranked compatibility scores for one current student against multiple other students.

```http
POST https://ibrahimiftikharr--rentmates-compatibility-predict-batch-endpoint.modal.run
Content-Type: application/json

{
  "currentStudent": { ...profile... },
  "otherStudents": [{...}, {...}]
}
```

4. Train endpoint

Purpose: triggers model training/retraining for this microservice deployment.

```http
POST https://ibrahimiftikharr--rentmates-compatibility-train-endpoint.modal.run
Content-Type: application/json

{}
```

## Backend Configuration

In backend `.env`:

```env
USE_ML_SERVICE=true
ML_SERVICE_URL=https://ibrahimiftikharr--rentmates-compatibility
ML_TIMEOUT=10000
```

The backend appends endpoint suffixes like `/predict-endpoint` and `/predict-batch-endpoint` automatically.

## Quick Test Commands

```bash
# health
curl https://ibrahimiftikharr--rentmates-compatibility-health-endpoint.modal.run

# single prediction
curl -X POST https://ibrahimiftikharr--rentmates-compatibility-predict-endpoint.modal.run \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

## Notes

- If prediction fails because the model is missing, run training once.
- If endpoint URL changes after redeploy, update backend `.env`.
