import axios from 'axios';
import Constants from 'expo-constants';

const baseURL = Constants.expoConfig.extra.API_URL;

export const getNearbyHospitals = async (latitude, longitude) => {
  try {
    console.log("Calling backend with:", latitude, longitude);
    const response = await axios.get(`${baseURL}/api/nearby-hospitals`, {
      params: { lat: latitude, long: longitude },
    });

    return response.data;
  } catch (error) {
    console.error("Error in getNearbyHospitals:", error.message);
    throw error;
  }
};