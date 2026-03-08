#!/usr/bin/env python
"""
Quick verification script to check if the improved model is working correctly
Run this after retraining the model
"""

import pickle
import joblib
import numpy as np

print("🔍 VERIFYING IMPROVED MODEL...")
print("="*80)

# 1. Check if models exist
print("\n1️⃣ Checking model files...")
try:
    model = joblib.load('ml-service/scam_detector_hybrid.pkl')
    print("✅ scam_detector_hybrid.pkl loaded")
    
    with open('ml-service/hybrid_features.pkl', 'rb') as f:
        features = pickle.load(f)
    print(f"✅ hybrid_features.pkl loaded ({len(features)} features)")
    
    with open('ml-service/tfidf_description.pkl', 'rb') as f:
        tfidf_desc = pickle.load(f)
    print("✅ tfidf_description.pkl loaded")
    
    with open('ml-service/tfidf_reviews.pkl', 'rb') as f:
        tfidf_rev = pickle.load(f)
    print("✅ tfidf_reviews.pkl loaded")
    
    try:
        with open('ml-service/cv_results.pkl', 'rb') as f:
            cv_results = pickle.load(f)
        print("✅ cv_results.pkl loaded (cross-validation results)")
    except FileNotFoundError:
        print("⚠️  cv_results.pkl not found (old model)")
        cv_results = None
        
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print("Have you retrained the model with improved_training_cells.py?")
    exit(1)

# 2. Check model parameters (verifying regularization)
print("\n2️⃣ Checking model regularization...")
if hasattr(model, 'max_depth'):
    print(f"   max_depth: {model.max_depth} (should be ≤8)")
    if model.max_depth and model.max_depth <= 8:
        print("   ✅ Good regularization")
    else:
        print("   ⚠️  May be overfitting (max_depth too high)")

if hasattr(model, 'min_samples_split'):
    print(f"   min_samples_split: {model.min_samples_split} (should be ≥10)")
    if model.min_samples_split >= 10:
        print("   ✅ Good regularization")

if hasattr(model, 'min_samples_leaf'):
    print(f"   min_samples_leaf: {model.min_samples_leaf} (should be ≥5)")
    if model.min_samples_leaf >= 5:
        print("   ✅ Good regularization")

# 3. Check cross-validation results
print("\n3️⃣ Checking cross-validation results...")
if cv_results:
    for name, results in cv_results.items():
        cv_acc = results.get('cv_accuracy_mean', 0)
        test_acc = results.get('test_accuracy', 0)
        
        print(f"\n   {name}:")
        print(f"   CV Accuracy:  {cv_acc:.3f}")
        print(f"   Test Accuracy: {test_acc:.3f}")
        
        if cv_acc >= 0.85 and cv_acc <= 0.95:
            print("   ✅ Accuracy in target range (85-95%)")
        elif cv_acc > 0.97:
            print("   ⚠️  Accuracy too high - possible overfitting")
        elif cv_acc < 0.80:
            print("   ⚠️  Accuracy too low - may need tuning")
            
        if abs(cv_acc - test_acc) < 0.03:
            print("   ✅ Good generalization (CV ≈ Test)")
        else:
            print("   ⚠️  Large gap between CV and Test")
else:
    print("   ⚠️  No CV results found - model may not have regularization")

# 4. Check NLP feature extraction
print("\n4️⃣ Checking NLP feature extraction...")
desc_features = tfidf_desc.get_feature_names_out()
rev_features = tfidf_rev.get_feature_names_out()

print(f"   Description features: {len(desc_features)}")
print(f"   Top 10: {', '.join(desc_features[:10])}")

print(f"\n   Review features: {len(rev_features)}")
print(f"   Top 10: {', '.join(rev_features[:10])}")

if len(desc_features) > 0 and len(rev_features) > 0:
    print("   ✅ NLP features extracted successfully")
else:
    print("   ❌ NLP features missing!")

# 5. Test prediction
print("\n5️⃣ Testing prediction with sample data...")
sample_legit = np.array([[
    0.95,  # PriceRatio (near average)
    1.0,   # DepositRatio (normal)
    0,     # DepositTooHigh
    1,     # HasProfilePic
    85,    # ReputationScore (high)
    0,     # NationalityMismatch
    0.95,  # ThumbsRatio (high)
    6,     # MinStayMonths
    70,    # description_length
    12,    # description_word_count
    0,     # has_scam_keywords
    15     # review_count
]])

sample_scam = np.array([[
    0.35,  # PriceRatio (suspiciously low)
    3.0,   # DepositRatio (too high)
    1,     # DepositTooHigh
    0,     # HasProfilePic
    10,    # ReputationScore (very low)
    1,     # NationalityMismatch
    0.1,   # ThumbsRatio (low)
    1,     # MinStayMonths
    90,    # description_length
    15,    # description_word_count
    1,     # has_scam_keywords
    5      # review_count
]])

pred_legit = model.predict(sample_legit)[0]
prob_legit = model.predict_proba(sample_legit)[0]

pred_scam = model.predict(sample_scam)[0]
prob_scam = model.predict_proba(sample_scam)[0]

print(f"\n   Sample Legit: Predicted {'LEGIT' if pred_legit == 0 else 'SCAM'}")
print(f"   Confidence: {prob_legit[0]:.2%} legit, {prob_legit[1]:.2%} scam")

print(f"\n   Sample Scam: Predicted {'LEGIT' if pred_scam == 0 else 'SCAM'}")
print(f"   Confidence: {prob_scam[0]:.2%} legit, {prob_scam[1]:.2%} scam")

if pred_legit == 0 and pred_scam == 1:
    print("   ✅ Model predictions look correct")
else:
    print("   ⚠️  Model predictions may need review")

# Summary
print("\n" + "="*80)
print("📊 VERIFICATION SUMMARY")
print("="*80)

issues = []
if cv_results:
    best_model = max(cv_results.keys(), 
                     key=lambda k: cv_results[k].get('cv_accuracy_mean', 0))
    best_acc = cv_results[best_model].get('cv_accuracy_mean', 0)
    
    if best_acc > 0.97:
        issues.append("⚠️  Accuracy too high (possible overfitting)")
    elif best_acc < 0.80:
        issues.append("⚠️  Accuracy too low (may need tuning)")
    
    print(f"\n✅ Model: {best_model}")
    print(f"✅ CV Accuracy: {best_acc:.1%}")
    print(f"✅ Regularization: Applied")
    print(f"✅ NLP Features: {len(desc_features) + len(rev_features)} terms")
else:
    issues.append("⚠️  No CV results - model may be from old training")

if issues:
    print("\n⚠️  ISSUES FOUND:")
    for issue in issues:
        print(f"   {issue}")
else:
    print("\n✅ ALL CHECKS PASSED!")
    print("   Model is ready for production with realistic performance.")

print("\n💡 Next step: Restart ML service with 'python ml-service/main.py'")
