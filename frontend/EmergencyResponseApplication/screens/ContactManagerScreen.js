import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { addContact, deleteContact, getContacts } from "../data/contactService";
import PhoneInput from '../components/PhoneInput';

export default function ContactManagerScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState([]);

  const loadContacts = async () => {
    const data = await getContacts();
    setContacts(data);
  };
  
  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open dialer');
    })
  }

  useEffect(() => {
    loadContacts();
  }, []);

  const handleAdd = async () => {
    if(!name || !phone) {
      Alert.alert('Both fields are required!');
      return;
    }

    const newContact = { name, phone };
    await addContact(newContact);
    setName('');
    setPhone('');
    loadContacts();
  };

  const handleDelete = async (phone) => {
    await deleteContact(phone);
    loadContacts();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <TextInput 
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <PhoneInput value={phone} onChange={setPhone} />

      <Button title="Add Contact" onPress={handleAdd}/>

      <FlatList 
        data={contacts}
        keyExtractor={(item, index) => index.toString()}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text>{item.phone}</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'green' }]}
                onPress={() => handleCall(item.phone)}
              >
                <Text style={styles.buttonText}>CALL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'red' }]}
                onPress={() => handleDelete(item.phone)}
              >
                <Text style={styles.buttonText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  contactInfo: {
    flex: 1
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});