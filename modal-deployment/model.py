"""
Student Flatmate Compatibility Prediction Using Structured and Textual Profile Features

Simplified version for serverless deployment on Modal.com
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
import json
import time
import random

from features import FeatureEngineer


class RoommateCompatibilityModel:
    """ML model for student flatmate compatibility prediction."""
    
    # Default feature weights for rule-based fallback
    FEATURE_WEIGHTS = {
        'budget_overlap': 3.0,
        'university_match': 2.0,
        'course_similarity': 1.5,
        'year_proximity': 1.0,
        'nationality_match': 1.0,
        'property_type_overlap': 2.0,
        'lifestyle_preferences': 2.0,
        'interests_similarity': 2.5
    }
    
    def __init__(self, model_type='gradient_boosting'):
        """
        Initialize the model
        
        Args:
            model_type: 'gradient_boosting' or 'rule_based'
        """
        self.model_type = model_type
        self.feature_engineer = FeatureEngineer()
        self.scaler = StandardScaler()
        self.model = None
        self.is_trained = False
        
        # Initialize model
        if model_type == 'gradient_boosting':
            self.model = GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=5,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42,
                subsample=0.8
            )
        
    def predict_compatibility(self, student1: Dict, student2: Dict) -> int:
        """
        Predict compatibility score between two students
        
        Args:
            student1: First student's profile
            student2: Second student's profile
            
        Returns:
            Compatibility score (0-100)
        """
        # Extract features
        features = self.feature_engineer.extract_features(student1, student2)
        features = features.reshape(1, -1)
        
        # Use trained model if available, otherwise use rule-based
        if self.is_trained and self.model is not None:
            # Normalize features
            features_scaled = self.scaler.transform(features)
            
            # Predict
            score = self.model.predict(features_scaled)[0]
            
            # Ensure score is in valid range
            score = max(0, min(100, score))
        else:
            # Fallback to rule-based scoring
            score = self._rule_based_score(features[0])
        
        return int(round(score))
    
    def predict_batch(self, current_student: Dict, other_students: List[Dict]) -> List[Tuple[str, int]]:
        """
        Predict compatibility scores for current student against multiple others
        
        Args:
            current_student: The reference student
            other_students: List of other student profiles
            
        Returns:
            List of (student_id, score) tuples, sorted by score descending
        """
        scores = []
        
        for other_student in other_students:
            student_id = other_student.get('_id') or other_student.get('id')
            score = self.predict_compatibility(current_student, other_student)
            scores.append((student_id, score))
        
        # Sort by score descending
        scores.sort(key=lambda x: x[1], reverse=True)
        
        return scores
    
    def train(self, training_data: List[Dict], labels: List[float]):
        """
        Train the model on historical compatibility data
        
        Args:
            training_data: List of {student1, student2} pairs
            labels: Compatibility scores (0-100)
        """
        if self.model_type == 'rule_based':
            print("Rule-based model doesn't require training")
            return
        
        # Extract features for all pairs
        X = []
        for data_point in training_data:
            features = self.feature_engineer.extract_features(
                data_point['student1'],
                data_point['student2']
            )
            X.append(features)
        
        X = np.array(X)
        y = np.array(labels)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Fit scaler
        self.scaler.fit(X_train)
        X_train_scaled = self.scaler.transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        # Train model
        print(f"Training {self.model_type} model on {len(X_train)} samples...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        val_score = self.model.score(X_val_scaled, y_val)
        
        print(f"Training R² score: {train_score:.4f}")
        print(f"Validation R² score: {val_score:.4f}")
        
        self.is_trained = True
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            print("\nTop 10 Feature Importances:")
            importances = self.model.feature_importances_
            indices = np.argsort(importances)[::-1][:10]
            for i in indices:
                print(f"  Feature {i}: {importances[i]:.4f}")
    
    def _rule_based_score(self, features: np.ndarray) -> float:
        """
        Calculate compatibility using rule-based approach (fallback)
        """
        weights = self.FEATURE_WEIGHTS
        
        # Structured score
        structured_score = (
            features[0] * weights['budget_overlap'] +
            features[1] * weights['university_match'] +
            features[2] * weights['course_similarity'] +
            features[3] * weights['year_proximity'] +
            features[4] * weights['nationality_match'] +
            features[5] * weights['property_type_overlap'] +
            np.mean(features[6:10]) * weights['lifestyle_preferences']
        )
        
        # Text score
        text_score = np.mean(features[12:15]) * weights['interests_similarity']
        
        # Total weights
        total_weight = sum([
            weights['budget_overlap'],
            weights['university_match'],
            weights['course_similarity'],
            weights['year_proximity'],
            weights['nationality_match'],
            weights['property_type_overlap'],
            weights['lifestyle_preferences'],
            weights['interests_similarity']
        ])
        
        # Calculate final score
        final_score = ((structured_score + text_score) / total_weight) * 100
        
        # Ensure valid range
        return max(0, min(100, final_score))
    
    def save_model(self, path: str):
        """Save model to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'model_type': self.model_type,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, path)
        print(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load model from disk"""
        if not os.path.exists(path):
            print(f"No saved model found at {path}")
            return False
        
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.model_type = model_data['model_type']
        self.is_trained = model_data['is_trained']
        
        print(f"Model loaded from {path}")
        return True


def load_training_data_from_csv(csv_path: str) -> Tuple[List[Dict], List[float]]:
    """
    Load training data from CSV file
    
    Args:
        csv_path: Path to CSV file with training data
        
    Returns:
        Tuple of (training_pairs, labels)
    """
    df = pd.read_csv(csv_path)
    
    training_pairs = []
    labels = []
    
    for _, row in df.iterrows():
        # Parse student 1
        student1 = {
            '_id': str(row['student1_id']),
            'name': row['student1_name'],
            'budget': {
                'min': int(row['student1_budget_min']),
                'max': int(row['student1_budget_max'])
            },
            'university': row['student1_university'],
            'course': row['student1_course'],
            'yearOfStudy': int(row['student1_yearOfStudy']),
            'age': int(row['student1_age']),
            'nationality': row['student1_nationality'],
            'propertyType': row['student1_propertyType'].split(','),
            'smoking': row['student1_smoking'],
            'petFriendly': row['student1_petFriendly'],
            'cleanliness': row['student1_cleanliness'],
            'noiseTolerance': row['student1_noiseTolerance'],
            'bio': row['student1_bio']
        }
        
        # Parse student 2
        student2 = {
            '_id': str(row['student2_id']),
            'name': row['student2_name'],
            'budget': {
                'min': int(row['student2_budget_min']),
                'max': int(row['student2_budget_max'])
            },
            'university': row['student2_university'],
            'course': row['student2_course'],
            'yearOfStudy': int(row['student2_yearOfStudy']),
            'age': int(row['student2_age']),
            'nationality': row['student2_nationality'],
            'propertyType': row['student2_propertyType'].split(','),
            'smoking': row['student2_smoking'],
            'petFriendly': row['student2_petFriendly'],
            'cleanliness': row['student2_cleanliness'],
            'noiseTolerance': row['student2_noiseTolerance'],
            'bio': row['student2_bio']
        }
        
        training_pairs.append({
            'student1': student1,
            'student2': student2
        })
        labels.append(float(row['compatibility_score']))
    
    print(f"Loaded {len(training_pairs)} training pairs from {csv_path}")
    return training_pairs, labels


def run_step_by_step_pipeline(
    csv_path: str,
    model_output_path: str,
    report_output_path: str,
    test_size: float = 0.2,
    random_seed: int = 42,
) -> Dict:
    """
    Run a full train/evaluation pipeline with explicit step-by-step stages.

    This helper is intended for reproducible experiments and form reporting.
    """
    start_time = time.time()

    # Reproducibility setup - fix random seeds for repeatable splits/training.
    random.seed(random_seed)
    np.random.seed(random_seed)

    # STEP 1: Data gathering - load raw training pairs and labels from CSV.
    training_pairs, labels = load_training_data_from_csv(csv_path)

    # STEP 2: Data quality preprocessing, drop malformed samples and clamp labels.
    clean_pairs: List[Dict] = []
    clean_labels: List[float] = []
    dropped_rows = 0
    for pair, label in zip(training_pairs, labels):
        if pair.get('student1') is None or pair.get('student2') is None:
            dropped_rows += 1
            continue
        if np.isnan(label):
            dropped_rows += 1
            continue
        clean_pairs.append(pair)
        clean_labels.append(float(max(0.0, min(100.0, label))))

    if not clean_pairs:
        raise ValueError("No valid training samples found after preprocessing.")

    # STEP 3: Feature engineering, convert profile pairs into numeric feature vectors.
    model = RoommateCompatibilityModel(model_type='gradient_boosting')
    X = []
    for sample in clean_pairs:
        X.append(model.feature_engineer.extract_features(sample['student1'], sample['student2']))
    X = np.array(X)
    y = np.array(clean_labels)

    # STEP 4: Dataset split strategy, fixed random seed for reproducible holdout split.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_seed,
        shuffle=True,
    )

    # STEP 5: Normalization, fit scaler only on train split, then transform both splits.
    model.scaler.fit(X_train)
    X_train_scaled = model.scaler.transform(X_train)
    X_test_scaled = model.scaler.transform(X_test)

    # STEP 6: Model training, fit Gradient Boosting Regressor.
    model.model.fit(X_train_scaled, y_train)
    model.is_trained = True

    # STEP 7: Evaluation, compute core regression metrics on train and test sets.
    y_train_pred = model.model.predict(X_train_scaled)
    y_test_pred = model.model.predict(X_test_scaled)

    train_r2 = float(r2_score(y_train, y_train_pred))
    test_r2 = float(r2_score(y_test, y_test_pred))
    test_mae = float(mean_absolute_error(y_test, y_test_pred))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))

    # STEP 8: Error analysis, identify worst residuals and summarize failure modes.
    abs_errors = np.abs(y_test - y_test_pred)
    sorted_indices = np.argsort(abs_errors)[::-1]
    worst_k = min(5, len(sorted_indices))
    worst_examples = []
    for idx in sorted_indices[:worst_k]:
        worst_examples.append(
            {
                'actual': float(y_test[idx]),
                'predicted': float(y_test_pred[idx]),
                'absolute_error': float(abs_errors[idx]),
            }
        )

    overfitting_gap = float(train_r2 - test_r2)
    within_10 = float((np.sum(abs_errors <= 10.0) / len(abs_errors)) * 100.0)

    # STEP 9: Persist artifacts, save trained model and machine-readable report.
    model.save_model(model_output_path)

    report = {
        'pipeline': 'roommate_compatibility_step_by_step',
        'seed': random_seed,
        'dataset': {
            'csv_path': csv_path,
            'raw_samples': len(training_pairs),
            'dropped_samples': dropped_rows,
            'used_samples': len(clean_pairs),
            'feature_count': int(X.shape[1]),
            'train_samples': int(len(X_train)),
            'test_samples': int(len(X_test)),
            'test_size': test_size,
        },
        'metrics': {
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae,
            'test_rmse': test_rmse,
            'within_10_points_pct': within_10,
            'overfitting_gap': overfitting_gap,
        },
        'error_analysis': {
            'worst_examples': worst_examples,
        },
        'artifacts': {
            'model_path': model_output_path,
            'report_path': report_output_path,
        },
        'runtime_seconds': float(time.time() - start_time),
    }

    report_dir = os.path.dirname(report_output_path)
    if report_dir:
        os.makedirs(report_dir, exist_ok=True)
    with open(report_output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    # STEP 10: Return summary - convenient for CLI/API callers.
    return report
