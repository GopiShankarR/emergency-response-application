import React, { useEffect, useLayoutEffect, useState, useContext } from "react";
import { SafeAreaView, View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, Button, Modal, TextInput, TouchableOpacity, Switch, Platform, Linking, Animated, Easing } from 'react-native';
import { getCurrentLocation } from '../services/locationService.js';
import { getNearbyHospitals } from '../services/hospitalService.js';
import { getUserProfile, saveUserProfile } from "../data/userService.js";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import PhoneInput from '../components/PhoneInput';
import { AppContext } from '../context/AppContext';

export default function HomeScreen({ navigation }) {
  // const [location, setLocation] = useState(null);
  // const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [willingToDonate, setWillingToDonate] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const bounceAnim = new Animated.Value(1);

  const { location, setLocation, hospitals, setHospitals } = useContext(AppContext);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowProfileModal(true)}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="person-circle-outline" size={30} color="#333" />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        console.log("User location:", loc);
        setLocation(loc);

        const hospitalList = await getNearbyHospitals(loc.latitude, loc.longitude);
        // console.log("Hospitals fetched:", hospitalList);
        setHospitals(hospitalList);

        const profile = await getUserProfile();
        if(!profile) {
          setShowProfileModal(true);
        } else {
          setName(profile.name);
          setAge(profile.age);
          setBloodGroup(profile.bloodGroup);
          setSex(profile.sex);
          setPhone(profile.phone);
        }
      } catch(error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const profileIncomplete = !name || !age || !bloodGroup || !sex || !phone;

    if (profileIncomplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [name, age, bloodGroup, sex, phone]);

  const handleSaveProfile = async () => {
    if(!name || !age || !bloodGroup || !sex || !phone) {
      Alert.alert("Please fill all the fields");
      return;
    }
    await saveUserProfile({ name, age, bloodGroup, sex, phone, willingToDonate });
    setShowProfileModal(false);
  }

  const openInMaps = (lat, lng, name) => {
    const label = encodeURIComponent(name || "Hospital");
    const url = Platform.select({
      ios: `https://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${label}`,
    });
    Linking.openURL(url).catch(err => console.error("Couldn't open maps:", err));
  }

  if(loading) return <ActivityIndicator size="large" color="#e53935" />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Nearby Hospitals</Text>
      <FlatList 
        data={hospitals}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              if (item.location && item.location.lat && item.location.lng) {
                openInMaps(item.location.lat, item.location.lng, item.name);
              } else {
                Alert.alert("Location unavailable", "This hospital has no coordinates.");
              }
            }}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.address}</Text>
            <Text>Rating: {item.rating || 'N/A'}</Text>
            <Text style={{ color: '#007BFF' }}>Tap to open in Maps</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showProfileModal} animationType="slide" transparent>
  <TouchableOpacity
    activeOpacity={1}
    onPressOut={() => setShowProfileModal(false)}
    style={styles.modalOverlay}
  >
    <View style={styles.modalContent}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setShowProfileModal(false)}
      >
        <Ionicons name="close-circle" size={28} color="#e53935" />
      </TouchableOpacity>

      <Text style={styles.modalTitle}>Your Profile</Text>
      <TextInput 
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput 
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        style={styles.input}
      />
      <View style={styles.pickerWrapper}>
        <Picker
          style={styles.picker}
          selectedValue={bloodGroup}
          onValueChange={(itemValue) => setBloodGroup(itemValue)}
        >
          <Picker.Item label="Select Blood Group" value="" />
          <Picker.Item label="A+" value="A+" />
          <Picker.Item label="A-" value="A-" />
          <Picker.Item label="B+" value="B+" />
          <Picker.Item label="B-" value="B-" />
          <Picker.Item label="AB+" value="AB+" />
          <Picker.Item label="AB-" value="AB-" />
          <Picker.Item label="O+" value="O+" />
          <Picker.Item label="O-" value="O-" />
        </Picker>
      </View>
      <View style={styles.pickerWrapper}>
        <Picker
          style={styles.picker}
          selectedValue={sex}
          onValueChange={(itemValue) => setSex(itemValue)}
        >
          <Picker.Item label="Select Sex" value="" />
          <Picker.Item label="Male" value="M" />
          <Picker.Item label="Female" value="F" />
        </Picker>
      </View>
      <PhoneInput value={phone} onChange={setPhone} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ marginRight: 10 }}>Willing To Donate?</Text>
        <Switch value={willingToDonate} onValueChange={setWillingToDonate} />
      </View>
      <Button title="Save Profile" onPress={handleSaveProfile} />
    </View>
  </TouchableOpacity>
</Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#f2f2f2', 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 8
  },
  name: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8
  },
  picker: {
    height: 48,
    width: '100%',
    paddingHorizontal: 10
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    padding: 10
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    height: 48,
    justifyContent: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});