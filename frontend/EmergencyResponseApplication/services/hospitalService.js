import axios from 'axios';
import Constants from 'expo-constants';

const baseURL =
  Constants.manifest?.extra?.API_URL ??
  Constants.expoConfig?.extra?.API_URL ??
  "https://emergency-response-application.onrender.com";

export const getNearbyHospitals = async (latitude, longitude, insurance = "") => {
  try {
    console.log("Calling backend with:", latitude, longitude, insurance);
    const response = await axios.get(`${baseURL}/api/nearby-hospitals`, {
      params: { lat: latitude, long: longitude, insurance: insurance },
    });

    return response.data;
  } catch (error) {
    console.error("Error in getNearbyHospitals:", error.message);
    throw error;
  }
};