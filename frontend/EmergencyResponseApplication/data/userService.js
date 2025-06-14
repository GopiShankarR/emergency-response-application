import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_PROFILE_KEY = 'user_profile';
const ALL_PROFILES_KEY = 'donors';

export const saveUserProfile = async (profile) => {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

  const existing = await AsyncStorage.getItem(ALL_PROFILES_KEY);
  let list = existing ? JSON.parse(existing) : [];

  list = list.filter(p => p.phone !== profile.phone);
  list.push(profile);
  await AsyncStorage.setItem(ALL_PROFILES_KEY, JSON.stringify(list));
};

export const getUserProfile = async () => {
  const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

export const getAllProfiles = async() => {
  const data = await AsyncStorage.getItem(ALL_PROFILES_KEY);
  return data ? JSON.parse(data) : [];
}