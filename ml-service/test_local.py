#!/usr/bin/env python3
"""
Local test script to verify ML service is working
Run this AFTER starting the ML service with: python main.py
"""

import json
import sys

def test_health():
    """Test the /health endpoint"""
    print("\n" + "="*60)
    print("Testing ML Service Health Endpoint")
    print("="*60)
    
    try:
        import requests
    except ImportError:
        print("❌ 'requests' library not installed")
        print("   Install with: pip install requests")
        return False
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        health_data = response.json()
        print(f"Response: {json.dumps(health_data, indent=2)}")
        
        if health_data.get("status") == "healthy" and health_data.get("model_working"):
            print("✅ ML service is healthy!")
            return True
        else:
            print("❌ ML service reported unhealthy")
            print(f"   Error: {health_data.get('error')}")
            print(f"   Startup Error: {health_data.get('startup_error')}")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to ML service: {e}")
        return False


def test_prediction():
    """Test the /predict endpoint"""
    print("\n" + "="*60)
    print("Testing ML Service Predict Endpoint")
    print("="*60)
    
    try:
        import requests
    except ImportError:
        print("❌ 'requests' library not installed")
        return False
    
    test_payload = {
        "priceRatio": 0.15,  # Extremely low - should be flagged as scam
        "depositRatio": 1.2,
        "depositTooHigh": True,
        "landlordVerified": False,
        "reputationScore": 45.0,
        "nationalityMismatch": False,
        "thumbsRatio": 0.5,
        "minStayMonths": 12,
        "description_length": 100,
        "description_word_count": 20,
        "has_scam_keywords": False,
        "review_count": 0,
        "isNewListing": True
    }
    
    print(f"Sending test payload:")
    print(json.dumps(test_payload, indent=2))
    
    try:
        response = requests.post(
            "http://localhost:8000/predict",
            json=test_payload,
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Prediction successful!")
            print(f"Scam Prediction: {result.get('scam_prediction')}")
            print(f"Scam Probability: {result.get('scam_probability'):.4f}")
            print(f"Label: {result.get('summary', {}).get('label')}")
            print(f"Top Factors:")
            for factor in result.get('scam_explanations', [])[:3]:
                print(f"  - {factor.get('feature')}: {factor.get('impact')}")
            return True
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"❌ Failed to call predict endpoint: {e}")
        return False


def main():
    print("\n🔍 ML Service Local Test Utility")
    print("="*60)
    print("Make sure ML service is running: python main.py")
    print("="*60)
    
    # Test health first
    health_ok = test_health()
    
    if not health_ok:
        print("\n⚠️  ML service health check failed.")
        print("Make sure to run: python main.py")
        return
    
    # Test prediction
    predict_ok = test_prediction()
    
    print("\n" + "="*60)
    if health_ok and predict_ok:
        print("✅ All tests passed! ML service is working correctly.")
    else:
        print("❌ Some tests failed. Check the output above for details.")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
