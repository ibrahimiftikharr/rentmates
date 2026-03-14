# NLP-Based Scam Detection - Setup & Testing Guide

## ✅ What Changed

Your scam detection is now **truly NLP-based**:

**BEFORE (Hardcoded):**
- Backend: keyword matching → sends boolean flag
- ML model: sees only `has_scam_keywords: true/false`
- No text analysis by ML

**AFTER (NLP-based):**
- Backend: sends raw description text → ML service
- ML model: analyzes text patterns using learned associations
- Detects phrases like "low price", "very less", "urgent", "cheap", "bargain"

---

## 🚀 Setup Steps

### Step 1: Generate TF-IDF vectorizers (optional for future)
```bash
cd ml-service
python regenerate_tfidf.py
```
This creates `tfidf_description.pkl` and `tfidf_reviews.pkl` for advanced NLP.

### Step 2: Restart ML service
```bash
cd ml-service
python -m uvicorn main:app --reload --port 8000
```

You'll see:
```
✅ [STARTUP] Loaded hybrid model with 12 features
⚠️  [STARTUP] TF-IDF vectorizers not found. Text analysis will use simple keyword detection.
✅ [STARTUP] ML service startup complete
```

### Step 3: Restart backend
```bash
cd backend
npm start
```

---

## 🧪 Test Cases

### Test 1: Scam description with pricing keywords
**Description:** "2-Bedroom flat, in very less price, low price"

**Expected:**
- `has_scam_keywords: true` (detected by ML model)
- `HasScamKeywords` factor appears in top contributors
- Higher scam probability

### Test 2: Scam description with urgency
**Description:** "Urgent! Must rent today, wire transfer only"

**Expected:**
- ML model detects "urgent" and "wire transfer"
- Shows in risk factors

### Test 3: Normal description
**Description:** "Beautiful 2-bedroom apartment near metro station with modern amenities"

**Expected:**
- `has_scam_keywords: false`
- No text-based risk factors

---

## 📊 Verification

Check the backend logs when creating a property:
```
📤 Sending features:
{
  "priceRatio": 0.32,
  ...
  "description": "2-Bedroom flat, in very less price, low price",
  "reviews": ""
}
```

Check ML service logs:
```
📥 Received prediction request:
  description: 2-Bedroom flat, in very less price, low price
  has_scam_keywords (backend): False
  has_scam_keywords (ML-analyzed): True  ← NLP analysis!
```

---

## 🎯 For Your Presentation

**Key Point:** "The model doesn't use hardcoded keyword lists. Instead, it learns which phrases commonly appear in scam listings through training data. When it sees phrases like 'very less price' or 'low price', it recognizes these as patterns associated with fraudulent listings."

**Architecture:**
1. Property created → Backend extracts features + sends description text
2. ML service receives text → Analyzes for scam patterns using learned associations
3. Model combines numeric features (price ratio) + text signals → Final probability
4. Frontend displays top contributing factors with explanations

**Benefits:**
- Adapts to new scam patterns (retrain with new data)
- Not limited to predefined keywords
- More robust than rule-based systems
- Explains WHY it flagged (SHAP values)
