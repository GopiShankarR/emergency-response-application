import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, Modal, StyleSheet, Button } from 'react-native';
import { countryCodes } from 'react-native-country-codes-picker';

export default function PhoneInput({ value, onChange }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCode, setSelectedCode] = useState('+1');

  const handleChange = (text) => {
    const numeric = text.replace(/\D/g, '');
    onChange(`${selectedCode}${numeric}`);
  };

  const handleSelectCode = (code) => {
    setSelectedCode(code.dial_code);
    setModalVisible(false);
    if (value) {
      const numeric = value.replace(/^\+?\d+/, '');
      onChange(`${code.dial_code}${numeric}`);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.codeBox}>
          <Text>{selectedCode}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={value.replace(selectedCode, '')}
          onChangeText={handleChange}
          keyboardType="phone-pad"
        />
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <FlatList
          data={countryCodes}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectCode(item)} style={styles.countryItem}>
              <Text>{item.flag} {item.name.en} ({item.dial_code})</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="Close" onPress={() => setModalVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  codeBox: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginRight: 10
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10
  },
  countryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  }
});