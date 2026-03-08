"""
Full Model Evaluation including NLP Bio Text Analysis
Note: First run will download Sentence-BERT model (~90MB, 2-5 minutes)
"""
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import sys
import time

print("=" * 75)
print("ROOMMATE COMPATIBILITY MODEL - FULL EVALUATION (WITH NLP)")
print("=" * 75)
print()

# Step 1: Load data
print("[1/5] Loading training data from CSV...")
sys.stdout.flush()

try:
    from model import load_training_data_from_csv
    training_data, labels = load_training_data_from_csv('training_data.csv')
    print(f"      [OK] Loaded {len(training_data)} training pairs")
    print(f"      Compatibility score range: {min(labels):.0f} - {max(labels):.0f}")
    print(f"      Average compatibility: {np.mean(labels):.2f}")
except Exception as e:
    print(f"      [ERROR] Error loading data: {e}")
    sys.exit(1)

print()

# Step 2: Initialize model
print("[2/5] Initializing model with NLP feature extraction...")
print("      Downloading Sentence-BERT model (first run only, ~90MB)...")
print("      This may take 2-5 minutes depending on internet speed...")
sys.stdout.flush()

try:
    start_time = time.time()
    from model import RoommateCompatibilityModel
    model = RoommateCompatibilityModel(model_type='gradient_boosting')
    load_time = time.time() - start_time
    print(f"      [OK] Model initialized in {load_time:.1f}s")
except Exception as e:
    print(f"      [ERROR] Error: {e}")
    print()
    print("      Common issues:")
    print("         - No internet connection (needed for model download)")
    print("         - Firewall blocking Hugging Face model hub")
    print("         - Run: pip install sentence-transformers --upgrade")
    sys.exit(1)

print()

# Step 3: Extract features
print("[3/5] Extracting features including NLP bio text analysis...")
print(f"      Processing {len(training_data)} pairs...")
print("      This includes semantic analysis of student bios...")
sys.stdout.flush()

try:
    X = []
    start_time = time.time()
    
    for i, data_point in enumerate(training_data):
        if (i + 1) % 200 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed
            remaining = (len(training_data) - i - 1) / rate
            print(f"      Progress: {i+1}/{len(training_data)} ({100*(i+1)/len(training_data):.1f}%) - ETA: {remaining:.0f}s", end='\r')
            sys.stdout.flush()
        
        features = model.feature_engineer.extract_features(
            data_point['student1'],
            data_point['student2']
        )
        X.append(features)
    
    X = np.array(X)
    y = np.array(labels)
    extract_time = time.time() - start_time
    
    print(f"\n      [OK] Extracted {X.shape[1]} features in {extract_time:.1f}s")
    print(f"      Features include: budget, university, course, lifestyle, AND")
    print(f"                        NLP bio text similarity (Sentence-BERT)")
except Exception as e:
    print(f"\n      [ERROR] Error extracting features: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Step 4: Split and train
print("[4/5] Training Gradient Boosting model...")
sys.stdout.flush()

try:
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=True
    )
    
    # Scale features
    model.scaler.fit(X_train)
    X_train_scaled = model.scaler.transform(X_train)
    X_test_scaled = model.scaler.transform(X_test)
    
    # Train
    start_time = time.time()
    model.model.fit(X_train_scaled, y_train)
    train_time = time.time() - start_time
    model.is_trained = True
    
    print(f"      [OK] Training complete in {train_time:.1f}s")
    print(f"      Train samples: {len(X_train)}, Test samples: {len(X_test)}")
except Exception as e:
    print(f"      [ERROR] Error training: {e}")
    sys.exit(1)

print()

# Step 5: Evaluate
print("[5/5] Evaluating performance with NLP features...")
sys.stdout.flush()

try:
    # Predictions
    y_train_pred = model.model.predict(X_train_scaled)
    y_test_pred = model.model.predict(X_test_scaled)
    
    # Metrics
    train_r2 = r2_score(y_train, y_train_pred)
    test_r2 = r2_score(y_test, y_test_pred)
    test_mae = mean_absolute_error(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    
    # Accuracy within tolerance
    errors = np.abs(y_test - y_test_pred)
    within_5 = (np.sum(errors <= 5) / len(errors)) * 100
    within_10 = (np.sum(errors <= 10) / len(errors)) * 100
    within_15 = (np.sum(errors <= 15) / len(errors)) * 100
    
    print("      [OK] Evaluation complete")
except Exception as e:
    print(f"      [ERROR] Error evaluating: {e}")
    sys.exit(1)

print()
print("=" * 75)
print("PERFORMANCE RESULTS (WITH NLP BIO TEXT ANALYSIS)")
print("=" * 75)
print()

# Display results
print("MODEL ACCURACY:")
if test_r2 > 0.75:
    status = "[EXCELLENT]"
elif test_r2 > 0.6:
    status = "[GOOD]"
else:
    status = "[NEEDS WORK]"
print(f"   R² Score (Test):         {test_r2:.4f}  {status}")
print(f"   Mean Absolute Error:     {test_mae:.2f} points")
print(f"   Root Mean Squared Error: {test_rmse:.2f} points")
print()

print("PREDICTION ACCURACY:")
print(f"   Within ±5 points:   {within_5:.1f}%")
print(f"   Within ±10 points:  {within_10:.1f}%")
print(f"   Within ±15 points:  {within_15:.1f}%")
print()

print("OVERFITTING CHECK:")
overfitting_gap = train_r2 - test_r2
print(f"   Train R²: {train_r2:.4f}")
print(f"   Test R²:  {test_r2:.4f}")
if overfitting_gap < 0.1:
    overfit_status = "[NO OVERFITTING]"
elif overfitting_gap < 0.2:
    overfit_status = "[SLIGHT OVERFITTING]"
else:
    overfit_status = "[HIGH OVERFITTING]"
print(f"   Gap:      {overfitting_gap:.4f}  {overfit_status}")
print()

# Top features
print("TOP 10 MOST IMPORTANT FEATURES:")
if hasattr(model.model, 'feature_importances_'):
    importances = model.model.feature_importances_
    feature_names = [
        'budget_overlap', 'university_match', 'course_similarity', 
        'year_proximity', 'age_difference', 'nationality_match',
        'property_overlap', 'lifestyle_compat', 'smoking_match',
        'pet_compat', 'cleanliness', 'noise_compat',
        'bio_cosine_sim', 'bio_euclidean', 'bio_diff_mean',
        'bio_emb1_mean', 'bio_emb2_mean'
    ]
    
    indices = np.argsort(importances)[::-1][:10]
    for rank, idx in enumerate(indices, 1):
        name = feature_names[idx] if idx < len(feature_names) else f'feature_{idx}'
        bar = '|' * int(importances[idx] * 40)
        print(f"   {rank:2d}. {name:20s} {importances[idx]:.4f}  {bar}")

print()

# Sample predictions
print("SAMPLE PREDICTIONS (Random Test Set Examples):")
print(f"{'Actual':>8} | {'Predicted':>10} | {'Error':>8} | {'Result':>12}")
print("-" * 50)

sample_indices = np.random.choice(len(y_test), min(10, len(y_test)), replace=False)
for idx in sample_indices:
    actual = y_test[idx]
    predicted = y_test_pred[idx]
    error = abs(actual - predicted)
    
    if error < 5:
        result = "[EXCELLENT]"
    elif error < 10:
        result = "[GOOD]"
    elif error < 15:
        result = "[ACCEPTABLE]"
    else:
        result = "[POOR]"
    
    print(f"{actual:8.0f} | {predicted:10.1f} | {error:8.1f} | {result:>15}")

print()
print("=" * 75)
print("DEPLOYMENT RECOMMENDATION")
print("=" * 75)
print()

# Decision
if test_r2 > 0.7 and test_mae < 10 and within_10 > 75:
    print("[PRODUCTION READY] MODEL IS READY FOR DEPLOYMENT WITH NLP!")
    print()
    print(f"   Outstanding performance with NLP bio text analysis:")
    print(f"   - Predictive power: R² = {test_r2:.3f}")
    print(f"   - Average error: ±{test_mae:.1f} points")
    print(f"   - Accuracy: {within_10:.0f}% within ±10 points")
    print()
    print("   NLP Features: Bio text semantic similarity is being analyzed")
    print("                 using Sentence-BERT embeddings (384 dimensions)")
    print()
    print("   HIGHLY RECOMMENDED FOR DEPLOYMENT!")
    
elif test_r2 > 0.6:
    print("[ACCEPTABLE] MODEL SHOWS GOOD PERFORMANCE WITH NLP")
    print()
    print(f"   Current metrics:")
    print(f"   - R² = {test_r2:.3f}")
    print(f"   - MAE = {test_mae:.1f} points")
    print(f"   - {within_10:.0f}% within ±10 points")
    print()
    print("   RECOMMENDATION: Ready for deployment")
    
else:
    print("[NEEDS IMPROVEMENT] MODEL REQUIRES FURTHER WORK")
    print()
    print(f"   Current R² = {test_r2:.3f} is below production standard")
    print("   Consider:")
    print("   - Adding more diverse training data")
    print("   - Reviewing feature engineering")
    print("   - Hyperparameter tuning")

print()
print("=" * 75)
print()
print("NOTE: This evaluation included full NLP bio text analysis using")
print("      Sentence-BERT (all-MiniLM-L6-v2) semantic embeddings.")
print()
print(f"      Dataset: {len(training_data)} training pairs")
print(f"      Features: {X.shape[1]} total ({X.shape[1]-12} structured + ~5 NLP)")
print()
