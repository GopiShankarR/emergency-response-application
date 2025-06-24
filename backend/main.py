from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from emergency_classifier import EmergencyClassifier
from dotenv import load_dotenv
import os
import requests
import redis
import json
import logging

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

USE_REDIS = os.getenv("USE_REDIS", "false").lower() == "true"
if USE_REDIS:
    try:
        redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        redis_client.ping()
        logger.info("Redis connection successful.")
    except Exception as e:
        redis_client = None
        logger.warning(f"Redis not available: {e}")
else:
    redis_client = None
    logger.info("Redis disabled in current environment.")

classifier = EmergencyClassifier()

insurance_df = pd.read_csv("mock_insurance_data.csv")
insurance_map = {
    row["Hospital"]: [ins.strip().lower() for ins in row["Accepted Insurances"].split(",")]
    for _, row in insurance_df.iterrows()
}
# print(insurance_map)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Emergency Response API is live.",
        "available_endpoints": [
            "/api/emergency-response (POST)",
            "/api/nearby-hospitals (GET)"
        ]
    })

@app.route("/api/emergency-response", methods=["POST"])
def classify_emergency():
    data = request.json
    message = data.get("message", "").strip().lower()
    logger.info(f"Received emergency message: {message}")

    cache_key = f"classify:{message}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"Cache hit for classification: {cache_key}")
            return jsonify(json.loads(cached))

    result = classifier.get_remedy(message)
    logger.info(f"Classification result: {result.get('emergency_type')}")

    if redis_client:
        try:
            redis_client.setex(cache_key, 600, json.dumps(result))
            logger.info(f"Cached classification under key {cache_key}")
        except Exception as e:
            logger.warning(f"Could not cache classification: {e}")

    return jsonify(result)

@app.route("/api/nearby-hospitals", methods=["GET"])
def get_nearby_hospitals():
    lat = request.args.get("lat")
    long = request.args.get("long")
    insurance = request.args.get("insurance", "").strip().lower()
    radius = 5000

    if not(lat and long):
        logger.warning("Missing latitude or longitude in request.")
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    logger.info(f"Request for hospitals near lat={lat}, long={long}")
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    cache_key = f"hospitals:{lat}:{long}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"Cache hit for key {cache_key}")
            return jsonify(json.loads(cached))

    url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
        f"location={lat},{long}&radius={radius}&type=hospital&key={api_key}"
    )

    try:
        res = requests.get(url)
        places = res.json().get("results", [])
        hospitals = []

        for place in places:
            name = place.get("name", "")
            accepted_insurances = insurance_map.get(name, [])
            is_accepted = insurance in accepted_insurances

            hospitals.append({
                "name": name,
                "address": place.get("vicinity"),
                "rating": place.get("rating"),
                "location": place.get("geometry", {}).get("location"),
                "acceptsInsurance": is_accepted,
                "acceptedInsurance": accepted_insurances
            })

        if redis_client:
            try:
                redis_client.setex(cache_key, 300, json.dumps(hospitals))
                logger.info(f"Cached hospital results under key {cache_key}")
            except Exception as e:
                logger.warning(f"Failed to set Redis cache: {e}")

        print(hospitals)
        return jsonify(hospitals)
    except Exception as e:
        logger.error(f"Error fetching hospital data: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
