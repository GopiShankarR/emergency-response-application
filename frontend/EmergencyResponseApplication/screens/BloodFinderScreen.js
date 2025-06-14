import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Picker } from 'react-native';
import { getAllProfiles } from '../data/userService';

export default function BloodFinderScreen() {
  const [bloodGroup, setBloodGroup] = useState('');
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    const fetch = async() => {
      const all = await getAllProfiles();
      const filtered = all.filter(p => p.willingToDonate && (bloodGroup === '' || p.bloodGroup === bloodGroup));
      setDonors(filtered);
    };
    fetch();
  }, [bloodGroup]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Blood Donors</Text>
      <Picker selectedValues={bloodGroup} onValueChange={setBloodGroup} style={styles.picker}>
        <Picker.Item label="All Blood Groups" value="" />
        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
          <Picker.Item key={bg} label={bg} value={bg} />
        ))}
      </Picker>
      <FlatList 
        data={donors}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name} ({item.bloodGroup})</Text>
            <Text>{item.phone}</Text>
            <Text>{item.city}</Text>
          </View>

        )}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  picker: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    marginBottom: 10 
  },
  card: { 
    backgroundColor: '#f2f2f2', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 10 },
  name: { 
    fontWeight: 'bold' 
  }
});