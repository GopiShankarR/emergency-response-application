import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getCurrentLocation } from "../services/locationService";
import { getNearbyHospitals } from "../services/hospitalService";
import { getDistance } from "geolib";
import { AppContext } from "../context/AppContext";
import { Ionicons } from "@expo/vector-icons";

const screenHeight = Dimensions.get("window").height;

export default function MapViewScreen() {
  const { insurance } = useContext(AppContext);
  const [region, setRegion] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const mapRef = useRef(null);
  const mapHeightAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        setUserLocation(loc);
        setRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        const hospitalList = await getNearbyHospitals(loc.latitude, loc.longitude, insurance);
        setHospitals(hospitalList);
        setLoadingHospitals(false);
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    })();
  }, []);

  const handleMarkerPress = (hospital) => {
    if (!hospital?.location || !userLocation) return;

    const hospitalCoords = {
      latitude: hospital.location.lat,
      longitude: hospital.location.lng,
    };

    const userCoords = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    };

    Animated.timing(mapHeightAnim, {
      toValue: screenHeight / 2,
      duration: 300,
      useNativeDriver: false,
    }).start();

    mapRef.current?.fitToCoordinates([userCoords, hospitalCoords], {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });

    const distanceMeters = getDistance(userCoords, hospitalCoords);
    const distanceMi = (distanceMeters / 1609.34).toFixed(2);
    setSelectedHospital({ ...hospital, distanceMi });
  };

  const closeCard = () => {
    Animated.timing(mapHeightAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setSelectedHospital(null);
    });
  };

  const openInMaps = (address) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  if (!region || loadingHospitals) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mapWrapper, { height: mapHeightAnim }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
        >
          {hospitals.map((hospital, index) => {
            const { location } = hospital;
            if (!location?.lat || !location?.lng) return null;

            return (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.lat,
                  longitude: location.lng,
                }}
                title={hospital.name}
                description={hospital.address}
                pinColor={hospital.acceptsInsurance ? "green" : "red"}
                onPress={() => handleMarkerPress(hospital)}
              />
            );
          })}

          {selectedHospital && (
            <>
              <Polyline
                coordinates={[
                  {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  },
                  {
                    latitude: selectedHospital.location.lat,
                    longitude: selectedHospital.location.lng,
                  },
                ]}
                strokeColor="#2196F3"
                strokeWidth={4}
              />

              <Marker
                coordinate={{
                  latitude: (userLocation.latitude + selectedHospital.location.lat) / 2 + 0.0012,
                  longitude: (userLocation.longitude + selectedHospital.location.lng) / 2,
                }}
                anchor={{ x: 0.5, y: 1 }}
                // calloutAnchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.distanceLabel}>
                  <Text style={styles.distanceText}>{selectedHospital.distanceMi} mi</Text>
                </View>
              </Marker>
            </>
          )}
        </MapView>
      </Animated.View>

      {selectedHospital && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{selectedHospital.name}</Text>
            <TouchableOpacity onPress={closeCard}>
              <Ionicons name="close-circle" size={28} color="#e53935" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => openInMaps(selectedHospital.address)}>
            <Text style={styles.address}>{selectedHospital.address}</Text>
          </TouchableOpacity>

          <View style={styles.detailRow}>
            <Ionicons name="medkit-outline" size={20} color="#333" style={styles.detailIcon} />
            <Text style={styles.detailText}>Type: General</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="star-outline" size={20} color="#f4b400" style={styles.detailIcon} />
            <Text style={styles.detailText}>Rating: {selectedHospital.rating || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4caf50" style={styles.detailIcon} />
            <Text style={styles.detailText}>
              Insurances:{" "}
              {selectedHospital.acceptedInsurance?.length
                ? selectedHospital.acceptedInsurance.join(", ")
                : "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={20} color="#2196F3" style={styles.detailIcon} />
            <Text style={styles.detailText}>Distance: {selectedHospital.distanceMi} mi</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    width: "100%",
  },
  map: {
    flex: 1,
  },
  card: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  address: {
    color: "#2196F3",
    textDecorationLine: "underline",
    marginBottom: 10,
  },
  detail: {
    fontSize: 14,
    marginBottom: 6,
  },
  distanceLabel: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10000,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceText: {
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
  },
});