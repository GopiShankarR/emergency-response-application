import { Alert, Button } from "react-native";
import * as SMS from 'expo-sms';
import { getContacts } from "../data/contactService";
import { getCurrentLocation } from "../services/locationService";

const SOSButton = () => {
  const handlePress = async () => {
    try {
      const contacts = await getContacts();
      if(contacts.length === 0) {
        Alert.alert('No contacts found', 'Please add emergency contacts first.');
        return;
      }
      const location = await getCurrentLocation();
      const locationURL = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = `Message Alert!\n I need help.\nMy location: ${locationURL}`;
      const phoneNumbers = contacts.map(c => c.phone);

      const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
      if(result === 'sent') {
        Alert.alert('Alert Message sent', 'Emergency SMS sent successfully!');
      }
    } catch(error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Button title="Send SOS" color="#e53935" onPress={handlePress} />
  );
};

export default SOSButton;