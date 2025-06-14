import axios from 'axios';

export const getNearbyHospitals = async (latitude, longitude) => {
  try {
    console.log("Calling backend with:", latitude, longitude);
    const response = await axios.get("http://192.168.0.182:5000/api/nearby-hospitals", {
      params: { lat: latitude, long: longitude },
    });

    return response.data;
  } catch (error) {
    console.error("Error in getNearbyHospitals:", error.message);
    throw error;
  }
};