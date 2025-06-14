import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapViewScreen from './screens/MapViewScreen';
import HomeScreen from './screens/HomeScreen';
import ContactManagerScreen from './screens/ContactManagerScreen';
import EmergencyAdviceScreen from './screens/EmergencyAdviceScreen';
import * as Font from 'expo-font';
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider } from './context/AppContext';

// const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      ...Ionicons.font,
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AppProvider>
      <NavigationContainer>
        <Tab.Navigator 
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName = 'home';
              if (route.name === 'Emergency') iconName = 'alert-circle';
              if (route.name === 'Contacts') iconName = 'people';
              if (route.name === 'Blood Finder') iconName = 'water'
              if (route.name === 'MapView') iconName = 'map';
              return < Ionicons name={iconName} size={size} color={color} />
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: true }} />
          <Tab.Screen name="MapView" component={MapViewScreen} />
          <Tab.Screen name="Contacts" component={ContactManagerScreen} />
          <Tab.Screen name="Emergency Advice" component={EmergencyAdviceScreen} initialParams={{ location: null, hospitals: [] }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  )
}