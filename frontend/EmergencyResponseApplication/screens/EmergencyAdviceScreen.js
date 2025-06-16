import React, { useEffect, useState, useContext } from "react";
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, ScrollView, Linking, Alert, Platform } from 'react-native';
import axios from "axios";
import { AppContext } from '../context/AppContext';
import Constants from 'expo-constants';

const baseURL =
  Constants.manifest?.extra?.API_URL ??
  Constants.expoConfig?.extra?.API_URL ??
  "https://emergency-response-application.onrender.com";

const emergencyMap = {
  US: "911",
  IN: "112",
  GB: "999",
  AU: "000",
  CA: "911",
  EU: "112",
  // fallback will be used otherwise
};

export default function EmergencyAdviceScreen() {
  const { location, hospitals } = useContext(AppContext);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [localEmergencyNumber, setLocalEmergencyNumber] = useState('911');

  useEffect(() => {
    if (hospitals && hospitals.length > 0) {
      setNearestHospital(hospitals[0]);
    }

    if (location) {
      fetchEmergencyNumber(location.latitude, location.longitude);
    }
  }, [hospitals, location]);

  // 🌐 Detect country and get emergency number
  const fetchEmergencyNumber = async (lat, lng) => {
    try {
      const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY,
        },
      });

      const countryComponent = res.data.results
        .flatMap(result => result.address_components)
        .find(component => component.types.includes("country"));

      const countryCode = countryComponent?.short_name;
      const emergency = emergencyMap[countryCode] || "911";
      setLocalEmergencyNumber(emergency);
    } catch (err) {
      console.warn("Could not fetch local emergency number:", err.message);
      setLocalEmergencyNumber("911");
    }
  };

  const getGuidance = async () => {
    if (!input) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await axios.post(`${baseURL}/api/emergency-response`, {
        message: input,
      });

      setResponse(res.data);
    } catch (error) {
      setResponse({
        emergency_type: "unknown",
        message: "Error fetching advice: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const callHospital = () => {
    if (nearestHospital && nearestHospital.name) {
      const query = encodeURIComponent(`${nearestHospital.name} hospital near me`);
      const phoneSearchUrl = `https://www.google.com/search?q=${query}`;
      Linking.openURL(phoneSearchUrl);
    }
  };

  const callEmergency = () => {
    Linking.openURL(`tel:${localEmergencyNumber}`).catch(() => {
      Alert.alert("Error", `Unable to initiate a call to ${localEmergencyNumber}`);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Emergency Guidance</Text>

      {!response && !loading && (
        <View style={styles.quickButtonsContainer}>
          {[
            { label: "Seizure", value: "person is having a seizure" },
            { label: "Breathing", value: "not breathing properly" },
            { label: "Bleeding", value: "bleeding heavily" },
            { label: "Unconscious", value: "person collapsed" },
            { label: "Headache", value: "severe headache" },
            { label: "Chest Pain", value: "chest pain spreading to arm" },
            { label: "Stroke", value: "slurred speech and numbness" },
            { label: "Burn", value: "burnt hand while cooking" },
            { label: "Poison", value: "swallowed cleaning chemical" },
          ].map((item, idx) => (
            <View key={idx} style={styles.quickButton}>
              <Text onPress={() => {
                setInput(item.value);
                getGuidance();
              }} style={styles.quickButtonText}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        multiline
        placeholder="Describe the emergency..."
        value={input}
        onChangeText={setInput}
      />
      <Button title="Get Help" onPress={getGuidance} />

      {loading && <ActivityIndicator size="large" color="#e53935" style={{ marginTop: 10 }} />}

      {response && (
        <View style={styles.response}>
          {response.emergency_type !== 'unknown' ? (
            <>
              <Text style={styles.subheading}>Detected Emergency: {response.emergency_type}</Text>

              <Text style={styles.section}>Steps:</Text>
              {response.remedy?.steps.map((step, idx) => (
                <Text key={idx}>• {step}</Text>
              ))}

              <Text style={styles.section}>Warnings:</Text>
              {response.remedy?.warnings.map((warn, idx) => (
                <Text key={idx}>• {warn}</Text>
              ))}

              <Text style={styles.section}>Action:</Text>
              <Text>{response.remedy?.call_911}</Text>

              <Text style={styles.disclaimer}>{response.disclaimer}</Text>

              {nearestHospital && (
                <View style={styles.hospitalCard}>
                  <Text style={styles.subheading}>Nearest Hospital</Text>
                  <Text>{nearestHospital.name}</Text>
                  <Text>{nearestHospital.address}</Text>
                  <Text>Rating: {nearestHospital.rating || 'N/A'}</Text>
                  <Button title="Call Hospital" onPress={callHospital} color="#e91e63" />
                </View>
              )}

              <View style={{ marginTop: 10 }} />
              <Button
                title={`Call Emergency (${localEmergencyNumber})`}
                onPress={callEmergency}
                color="#d32f2f"
              />
            </>
          ) : (
            <>
              <Text style={styles.subheading}>Unknown Emergency</Text>
              <Text>{response.message}</Text>
              {response.general_advice && (
                <Text style={styles.section}>General Advice: {response.general_advice}</Text>
              )}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    minHeight: 100,
  },
  response: {
    marginTop: 15,
    fontSize: 16,
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 8,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  section: {
    marginTop: 10,
    fontWeight: 'bold'
  },
  disclaimer: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#777'
  },
  hospitalCard: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9'
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  quickButton: {
    width: '30%',
    marginVertical: 8,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  quickButtonText: {
    fontWeight: '600',
    color: '#c62828',
    textAlign: 'center'
  }
});
