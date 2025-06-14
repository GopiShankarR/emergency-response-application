import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from "react-native-maps";
import { getCurrentLocation } from "../services/locationService";
import { getNearbyHospitals } from "../services/hospitalService";

export default function MapViewScreen() {
  const [region, setRegion] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        setRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        const hospitalList = await getNearbyHospitals(loc.latitude, loc.longitude);
        setHospitals(hospitalList);
        setLoadingHospitals(false);
      } catch(err) {
        Alert.alert('Error', err.message);
      }
    })();
  }, []);

  if (!region || loadingHospitals) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation={true}>
        {hospitals.map((hospital, index) => {
          const { location } = hospital;
          if(!location || !location.lat || !location.lng) return null;
          return (
            <Marker
              key={index}
              coordinate={{
                latitude: location.lat,
                longitude: location.lng,
              }}
              title={hospital.name}
              description={hospital.address}
            />
        )})}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1
  },
})