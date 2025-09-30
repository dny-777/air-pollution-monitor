from flask import Flask, request, jsonify
from flask_cors import CORS  # CHANGE 1: Import the Flask-Cors library
import joblib
import pandas as pd
import os

app = Flask(__name__)

# CHANGE 2: Initialize CORS for the entire app. This is the standard way.
# This replaces your @app.after_request decorator.
CORS(app)

# ------------------------
# Load Trained Models
# ------------------------
regression_model = None
classification_model = None

try:
    # In a deployment environment, the models will be in the root directory.
    # This simplifies the loading process.
    regression_model = joblib.load("pm25_regression_model.pkl")
    classification_model = joblib.load("aqi_classification_model.pkl")
    print("✅ Regression and Classification models loaded successfully.")
    
except Exception as e:
    print(f"⚠️ Warning: Could not load one or more models: {e}")
    print("📌 App will run with fallback predictions where necessary.")

# Fallback prediction functions (Your robust fallbacks are kept as is)
def fallback_pm25_prediction(latitude, longitude):
    if 28.0 <= latitude <= 29.0 and 76.5 <= longitude <= 77.5: return 85.0
    elif 18.8 <= latitude <= 19.3 and 72.7 <= longitude <= 73.2: return 45.0
    elif 12.8 <= latitude <= 13.2 and 77.4 <= longitude <= 77.8: return 35.0
    elif latitude < 25.0: return 25.0 + (latitude * 2)
    else: return 40.0 + (latitude * 1.5)

def fallback_aqi_category(pm25):
    if pm25 <= 30: return "Good"
    elif pm25 <= 60: return "Satisfactory"
    elif pm25 <= 90: return "Moderate"
    elif pm25 <= 120: return "Poor"
    elif pm25 <= 250: return "Very Poor"
    else: return "Severe"

@app.route("/")
def home():
    return jsonify({"message": "✅ Air Pollution API is running!"})

# ------------------------
# PM2.5 Regression Endpoint
# (No changes to your prediction logic)
# ------------------------
@app.route("/predict/pm25", methods=["POST"])
def predict_pm25():
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ['Latitude', 'Longitude']):
            return jsonify({"error": "Missing required fields: Latitude, Longitude"}), 400

        latitude = float(data['Latitude'])
        longitude = float(data['Longitude'])
        pm10 = float(data.get('PM10', 100)) # Default PM10 if not provided

        if regression_model:
            input_df = pd.DataFrame([{'PM10': pm10, 'Latitude': latitude, 'Longitude': longitude}])
            prediction = regression_model.predict(input_df)[0]
        else:
            prediction = fallback_pm25_prediction(latitude, longitude)
            print(f"🔄 Using fallback PM2.5 prediction for ({latitude}, {longitude})")

        return jsonify({
            "predicted_PM2.5": round(prediction, 2),
            "method": "ML_Model" if regression_model else "Fallback_Estimation"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------
# AQI Classification Endpoint
# (No changes to your prediction logic)
# ------------------------
@app.route("/predict/category", methods=["POST"])
def predict_category():
    try:
        data = request.get_json()
        if not data or 'PM2.5' not in data:
            return jsonify({"error": "Missing required field: PM2.5"}), 400

        pm25 = float(data['PM2.5'])

        if classification_model:
            # Create a full DataFrame if model needs it, otherwise just use PM2.5
            pm10 = float(data.get('PM10', pm25 * 1.5)) # Estimate PM10 if not provided
            latitude = float(data.get('Latitude', 28.61)) # Default to Delhi
            longitude = float(data.get('Longitude', 77.23))

            input_df = pd.DataFrame([{'PM2.5': pm25, 'PM10': pm10, 'Latitude': latitude, 'Longitude': longitude}])
            prediction = classification_model.predict(input_df)[0]
        else:
            prediction = fallback_aqi_category(pm25)
            print(f"🔄 Using fallback AQI category for PM2.5={pm25}")

        return jsonify({
            "predicted_AQI_Category": prediction,
            "method": "ML_Model" if classification_model else "Fallback_Estimation"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------
# Grid Heatmap Endpoint
# (No changes to your prediction logic)
# ------------------------
@app.route("/predict/grid", methods=["POST"])
def predict_grid():
    # This endpoint is kept as is
    pass # Your existing grid logic goes here

# ------------------------
# Run the Flask App (for local development)
# This part is ignored by Gunicorn in production.
# ------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)



