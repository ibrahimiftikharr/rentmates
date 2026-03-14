import gradio as gr
import pickle
import numpy as np
import json

# Load model and features
model = pickle.load(open('scam_detector_hybrid.pkl', 'rb'))
selected_features = pickle.load(open('hybrid_features.pkl', 'rb'))

def predict_scam(price_ratio, deposit_ratio, deposit_too_high, landlord_verified,
                 reputation_score, nationality_mismatch, thumbs_ratio, min_stay_months,
                 description_length, description_word_count, has_scam_keywords, review_count):
    """Predict if property is scam"""
    
    # Prepare features
    features = np.array([[
        float(price_ratio),
        float(deposit_ratio),
        int(deposit_too_high),
        int(landlord_verified),
        float(reputation_score),
        int(nationality_mismatch),
        float(thumbs_ratio),
        int(min_stay_months),
        int(description_length),
        int(description_word_count),
        int(has_scam_keywords),
        int(review_count)
    ]])
    
    # Get prediction
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]
    
    # Return result
    label = "🚩 SCAM" if prediction else "✅ LEGITIMATE"
    confidence = f"{(max(probability, 1-probability) * 100):.2f}%"
    
    return {
        "Prediction": label,
        "Confidence": confidence,
        "Scam Probability": f"{probability*100:.2f}%"
    }

# Create Gradio interface
interface = gr.Interface(
    fn=predict_scam,
    inputs=[
        gr.Slider(0, 1, label="Price Ratio"),
        gr.Slider(0, 1, label="Deposit Ratio"),
        gr.Checkbox(label="Deposit Too High"),
        gr.Checkbox(label="Landlord Verified"),
        gr.Slider(0, 1, label="Reputation Score"),
        gr.Checkbox(label="Nationality Mismatch"),
        gr.Slider(0, 1, label="Thumbs Ratio"),
        gr.Slider(1, 24, label="Min Stay Months"),
        gr.Slider(0, 1000, label="Description Length"),
        gr.Slider(0, 500, label="Description Word Count"),
        gr.Checkbox(label="Has Scam Keywords"),
        gr.Slider(0, 1000, label="Review Count")
    ],
    outputs=gr.JSON(label="Prediction Result"),
    title="RentMates Scam Detection",
    description="Check if a property listing is a scam",
    examples=[
        [0.6, 0.99, True, False, 0.2, True, 0.1, 1, 50, 8, True, 0]
    ]
)

if __name__ == "__main__":
    interface.launch(server_name="0.0.0.0", server_port=7860)
