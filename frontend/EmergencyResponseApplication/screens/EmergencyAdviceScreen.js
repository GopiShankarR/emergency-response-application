import React, { useEffect, useState, useContext } from "react";
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, ScrollView, Linking, Alert } from 'react-native';
import axios from "axios";
import { AppContext } from '../context/AppContext';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const baseURL =
  Constants.manifest?.extra?.API_URL ??
  Constants.expoConfig?.extra?.API_URL ??
  "https://emergency-response-application.onrender.com";

export default function EmergencyAdviceScreen() {
  const { location, hospitals } = useContext(AppContext);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (hospitals && hospitals.length > 0) {
      setNearestHospital(hospitals[0]);
    }
  }, [hospitals]);

  const getGuidance = async (text = input) => {
    if (!text) return;

    setLoading(true);
    setTimeoutReached(false);
    setResponse(null);

    const timeout = setTimeout(() => {
      setTimeoutReached(true);
      setLoading(false);
    }, 15000);

    try {
      const res = await axios.post(`${baseURL}/api/emergency-response`, {
        message: text,
      });

      clearTimeout(timeout);
      setResponse(res.data);
    } catch (error) {
      clearTimeout(timeout);
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
    Linking.openURL(`tel:911`);
  };

  const handleQuickHelp = (value) => {
    setInput(value);
    setResponse(null);
    getGuidance(value);
  };

  const handleInputChange = (text) => {
    setInput(text);
    setResponse(null);
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
              <Text onPress={() => handleQuickHelp(item.value)} style={styles.quickButtonText}>
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
        onChangeText={handleInputChange}
      />

      <View style={styles.buttonRow}>
        <View style={styles.getHelpButton}>
          <Button title="Get Help" onPress={() => getGuidance()} />
        </View>
        <Ionicons
          name="refresh"
          size={28}
          color="#e53935"
          onPress={() => {
            setInput('');
            setResponse(null);
            setTimeoutReached(false);
          }}
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#e53935" style={{ marginTop: 10 }} />}
      {timeoutReached && (
        <Text style={{ color: 'red', marginTop: 10 }}>
          Request timed out. Please try again.
        </Text>
      )}

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
                title="Call 911"
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
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  getHelpButton: {
    flex: 1,
    marginRight: 12,
  },
});
