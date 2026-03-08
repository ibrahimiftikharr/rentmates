# Scam Detection ML Service

This is a FastAPI service for detecting rental scams using a trained machine learning model.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   python main.py
   ```

   Or with uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

The service will be available at http://localhost:8000

## API Endpoint

### POST /predict

Predicts if a rental listing is a scam.

**Request Body:**
```json
{
  "price": 1000.0,
  "depositAmount": 1000.0,
  "areaAverageRent": 1050.0,
  "landlordVerified": true,
  "reputationScore": 90.0,
  "nationalityMismatch": false,
  "minStayMonths": 6,
  "amenitiesCount": 8,
  "includedBillsTotal": 100.0,
  "thumbsUpCount": 40,
  "thumbsDownCount": 2,
  "averageReviewRating": 5.0,
  "rentalDescription": "Spacious apartment near city center...",
  "reviews": "Responsive landlord...",
  "priceRatio": 0.952,
  "depositRatio": 1.0,
  "depositFlag": false,
  "billsExtraCost": 0.0,
  "thumbsRatio": 0.952,
  "hasReviews": true,
  "isNewListing": false,
  "scamKeywordCount": 0
}
```

**Response:**
```json
{
  "scam_prediction": false,
  "scam_probability": 0.123,
  "scam_explanations": [
    {
      "feature": "priceRatio",
      "impact": "decreases scam probability"
    }
  ]
}
```

## Model Files

The service loads the following files from `../artifacts/`:
- `scam_detector.pkl`: Trained Random Forest model
- `tfidf_description.pkl`: TF-IDF vectorizer for rental descriptions
- `tfidf_reviews.pkl`: TF-IDF vectorizer for reviews
- `feature_names.pkl`: List of feature names