"""
RentMates Roommate Compatibility Model - Modal.com Deployment

This file defines the Modal app for serverless deployment of the ML model.
All dependencies are containerized and automatically managed by Modal.

To deploy:
    modal deploy modal_app.py

To test locally:
    modal run modal_app.py::test_prediction
"""

import modal
import os
from typing import Dict, Any

# Create Modal app
app = modal.App("rentmates-compatibility")

# Define the container image with all dependencies and training data
image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "fastapi[standard]",
        "scikit-learn==1.3.2",
        "numpy==1.24.3",
        "pandas==2.1.4",
        "sentence-transformers>=2.7.0",
        "transformers>=4.36.2",
        "torch>=2.1.2",
        "joblib==1.3.2",
    )
    .add_local_file("training_data.csv", "/root/training_data.csv")
    .add_local_file("model.py", "/root/model.py")
    .add_local_file("features.py", "/root/features.py")
)

# Create persistent volume for model storage
volume = modal.Volume.from_name("rentmates-models", create_if_missing=True)

# Model will be stored in /models directory
MODELS_PATH = "/models"


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=300,
    scaledown_window=120,
)
def train_model():
    """
    Train the compatibility model with CSV training data
    This function can be called to initialize or retrain the model
    """
    import sys
    sys.path.insert(0, '/root')
    
    from model import RoommateCompatibilityModel, load_training_data_from_csv
    
    # CSV file path (copied into the image)
    csv_path = "/root/training_data.csv"
    
    print(f"Loading training data from CSV: {csv_path}")
    training_data, labels = load_training_data_from_csv(csv_path)
    
    print(f"Training model with {len(training_data)} pairs...")
    model = RoommateCompatibilityModel(model_type='gradient_boosting')
    model.train(training_data, labels)
    
    # Save to persistent volume
    model_path = f"{MODELS_PATH}/roommate_matcher.pkl"
    model.save_model(model_path)
    
    # Commit changes to volume
    volume.commit()
    
    print(f"Model trained and saved to {model_path}")
    return {
        "success": True, 
        "message": "Model trained successfully", 
        "training_samples": len(training_data)
    }


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=30,
)
def load_model():
    """Load the trained model from persistent storage"""
    import sys
    sys.path.insert(0, '/root')
    
    from model import RoommateCompatibilityModel
    
    model = RoommateCompatibilityModel(model_type='gradient_boosting')
    model_path = f"{MODELS_PATH}/roommate_matcher.pkl"
    
    if os.path.exists(model_path):
        model.load_model(model_path)
        print(f"Model loaded from {model_path}")
    else:
        print("No trained model found, using rule-based scoring")
    
    return model


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=30,
)
def predict_compatibility(student1: Dict[str, Any], student2: Dict[str, Any]) -> int:
    """
    Predict compatibility score between two students
    
    Args:
        student1: First student's profile dictionary
        student2: Second student's profile dictionary
    
    Returns:
        Compatibility score (0-100)
    """
    model = load_model()
    score = model.predict_compatibility(student1, student2)
    return score


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=60,
)
def predict_batch(current_student: Dict[str, Any], other_students: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    """
    Predict compatibility scores for one student against multiple others
    
    Args:
        current_student: The reference student profile
        other_students: List of other student profiles (each must have '_id' or 'id' field)
    
    Returns:
        List of dicts with studentId and compatibilityScore, sorted by score descending
    """
    model = load_model()
    scores = model.predict_batch(current_student, other_students)
    
    # Format response
    formatted_scores = [
        {'studentId': str(student_id), 'compatibilityScore': score}
        for student_id, score in scores
    ]
    
    return formatted_scores


# Web endpoint for external API calls
@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=30,
)
@modal.fastapi_endpoint(method="POST")
def predict_endpoint(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Web endpoint for single prediction
    
    Request body:
    {
        "student1": {...},
        "student2": {...}
    }
    
    Response:
    {
        "success": true,
        "compatibilityScore": 85,
        "method": "ml_model"
    }
    """
    import sys
    sys.path.insert(0, '/root')
    
    try:
        if 'student1' not in data or 'student2' not in data:
            return {
                'success': False,
                'error': 'Missing student1 or student2 in request body'
            }
        
        from model import RoommateCompatibilityModel
        
        # Load model
        model = RoommateCompatibilityModel(model_type='gradient_boosting')
        model_path = f"{MODELS_PATH}/roommate_matcher.pkl"
        
        if os.path.exists(model_path):
            model.load_model(model_path)
        else:
            return {
                'success': False,
                'error': 'Model not trained yet'
            }
        
        # Predict
        score = model.predict_compatibility(data['student1'], data['student2'])
        
        return {
            'success': True,
            'compatibilityScore': int(score),
            'method': 'ml_model'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=60,
)
@modal.fastapi_endpoint(method="POST")
def predict_batch_endpoint(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Web endpoint for batch prediction
    
    Request body:
    {
        "currentStudent": {...},
        "otherStudents": [{...}, {...}]
    }
    
    Response:
    {
        "success": true,
        "scores": [
            {"studentId": "123", "compatibilityScore": 85},
            ...
        ],
        "method": "ml_model",
        "totalStudents": 5
    }
    """
    import sys
    sys.path.insert(0, '/root')
    
    try:
        if 'currentStudent' not in data or 'otherStudents' not in data:
            return {
                'success': False,
                'error': 'Missing currentStudent or otherStudents in request body'
            }
        
        current_student = data['currentStudent']
        other_students = data['otherStudents']
        
        if not isinstance(other_students, list):
            return {
                'success': False,
                'error': 'otherStudents must be an array'
            }
        
        from model import RoommateCompatibilityModel
        
        # Load model
        model = RoommateCompatibilityModel(model_type='gradient_boosting')
        model_path = f"{MODELS_PATH}/roommate_matcher.pkl"
        
        if os.path.exists(model_path):
            model.load_model(model_path)
        else:
            return {
                'success': False,
                'error': 'Model not trained yet'
            }
        
        # Predict batch
        scores = model.predict_batch(current_student, other_students)
        
        # Format response
        formatted_scores = [
            {'studentId': str(student_id), 'compatibilityScore': int(score)}
            for student_id, score in scores
        ]
        
        return {
            'success': True,
            'scores': formatted_scores,
            'method': 'ml_model',
            'totalStudents': len(formatted_scores)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
)
@modal.fastapi_endpoint(method="GET")
def health_endpoint() -> Dict[str, Any]:
    """
    Health check endpoint
    
    Response:
    {
        "status": "healthy",
        "model_trained": true,
        "service": "modal"
    }
    """
    model_exists = os.path.exists(f"{MODELS_PATH}/roommate_matcher.pkl")
    
    return {
        'status': 'healthy',
        'model_trained': model_exists,
        'service': 'modal',
        'deployment': 'serverless'
    }


@app.function(
    image=image,
    volumes={MODELS_PATH: volume},
    timeout=300,
)
@modal.fastapi_endpoint(method="POST")
def train_endpoint(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Endpoint to train/retrain the model
    
    Request body (optional):
    {
        "trainingData": [
            {"student1": {...}, "student2": {...}, "score": 85},
            ...
        ]
    }
    
    If no training data provided, uses synthetic data
    """
    try:
        # For now, always use synthetic data training
        # In production, you'd accept real training data
        result = train_model.remote()
        return result
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# Test function for local development
@app.local_entrypoint()
def test_prediction():
    """Test the model locally before deployment"""
    
    student1 = {
        'university': 'University of Manchester',
        'course': 'Computer Science',
        'yearOfStudy': 'Year 2',
        'nationality': 'United Kingdom',
        'bio': 'Love coding and coffee',
        'interests': ['Coding', 'Gaming', 'Coffee'],
        'housingPreferences': {
            'budgetMin': 500,
            'budgetMax': 800,
            'propertyType': ['Flat'],
            'petsAllowed': False,
            'smokingAllowed': False,
            'furnished': True,
            'billsIncluded': True
        }
    }
    
    student2 = {
        'university': 'University of Manchester',
        'course': 'Data Science',
        'yearOfStudy': 'Year 2',
        'nationality': 'United Kingdom',
        'bio': 'Data science enthusiast',
        'interests': ['AI/ML', 'Data'],
        'housingPreferences': {
            'budgetMin': 550,
            'budgetMax': 850,
            'propertyType': ['Flat'],
            'petsAllowed': False,
            'smokingAllowed': False,
            'furnished': True,
            'billsIncluded': True
        }
    }
    
    print("Testing single prediction...")
    score = predict_compatibility.remote(student1, student2)
    print(f"Compatibility Score: {score}/100")
    
    print("\nTesting batch prediction...")
    other_students = [
        {**student2, '_id': 'student_1'},
        {**student1, '_id': 'student_2', 'course': 'Arts'}
    ]
    scores = predict_batch.remote(student1, other_students)
    print(f"Batch scores: {scores}")
    
    print("\n✅ Test completed successfully!")
