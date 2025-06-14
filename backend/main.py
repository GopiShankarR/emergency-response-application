from flask import Flask, request, jsonify
from flask_cors import CORS
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

redis_client = redis.Redis(
  host='localhost',
  port=6379,
  db=0,
  decode_responses=True
)

classifier = EmergencyClassifier()

@app.route("/api/emergency-response", methods=["POST"])
def classify_emergency():
    data = request.json
    message = data.get("message", "").strip().lower()
    logger.info(f"Received emergency message: {message}")

    cache_key = f"classify:{message}"
    cached = redis_client.get(cache_key)
    if cached:
        logger.info(f"Cache hit for classification: {cache_key}")
        return jsonify(json.loads(cached))

    result = classifier.get_remedy(message)
    logger.info(f"Classification result: {result.get('emergency_type')}")

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
  radius = 5000

  if not(lat and long):
    logger.warning("Missing latitude or longitude in request.")
    return jsonify({"error": "Latitude and Longitude are required"}), 400

  print(f"Incoming lat={lat}, long={long}")

  logger.info(f"Request for hospitals near lat={lat}, long={long}")

  api_key = os.getenv("GOOGLE_MAPS_API_KEY")

  cache_key = f"hospitals:{lat}:{long}"
  cached = redis_client.get(cache_key)

  if cached:
    logger.info(f"Cache hit for key {cache_key}")
    print("Serving from cache")
    return jsonify(json.loads(cached))
  else:
    logger.info(f"Cache miss for key {cache_key}")
  
  url = (
    f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
    f"location={lat},{long}&radius={radius}&type=hospital&key={api_key}"
  )

  try:
    res = requests.get(url)
    places = res.json().get("results", [])

    hospitals = [
      {
        "name": place.get("name"),
        "address": place.get("vicinity"),
        "rating": place.get("rating"),
        "location": place["geometry"]["location"]
      }
      for place in places if place.get("geometry") and place["geometry"].get("location")
    ]

    try:
      redis_client.setex(cache_key, 300, json.dumps(hospitals))
      logger.info(f"Cached hospital results under key {cache_key}")
    except Exception as e:
      logger.warning(f"Failed to set Redis cache: {e}")

    return jsonify(hospitals)
  except Exception as e:
    logger.error(f"Error fetching hospital data: {e}")
    return jsonify({"error": str(e)}), 500
  
if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)