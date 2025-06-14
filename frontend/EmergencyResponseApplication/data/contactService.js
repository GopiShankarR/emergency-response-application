import AsyncStorage from "@react-native-async-storage/async-storage";

const CONTACTS_KEY = 'emergency_contacts';

export const getContacts = async () => {
  const stored = await AsyncStorage.getItem(CONTACTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveContacts = async (contacts) => {
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};

export const addContact = async (newContact) => {
  const contacts = await getContacts();
  const updated = [...contacts, newContact];
  await saveContacts(updated);
};

export const deleteContact = async (phone) => {
  const contacts = await getContacts();
  const updated = contacts.filter(c => c.phone !== phone);
  await saveContacts(updated);
};