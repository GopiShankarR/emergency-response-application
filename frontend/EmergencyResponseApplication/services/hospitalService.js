import axios from 'axios';

export const getNearbyHospitals = async (latitude, longitude) => {
  try {
    console.log("Calling backend with:", latitude, longitude);
    const response = await axios.get("https://emergency-response-application.onrender.com/api/nearby-hospitals", {
      params: { lat: latitude, long: longitude },
    });

    return response.data;
  } catch (error) {
    console.error("Error in getNearbyHospitals:", error.message);
    throw error;
  }
};