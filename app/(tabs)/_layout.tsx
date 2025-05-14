// File: app/(tabs)/_layout.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Manage authentication state locally
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Log whenever isAuthenticated state changes
  useEffect(() => {
  const checkSession = async () => {
    const authed = await AsyncStorage.getItem('isAuthenticated');
    const uid = await AsyncStorage.getItem('userId');

    if (authed === 'true' && uid) {
      // optionally use uid for Firestore queries
      setIsAuthenticated(true);
    } else {
      router.replace('./auth/login');
    }
    setLoading(false); 
  };

  checkSession();
}, []);


  if (loading) return null;

  // If authenticated, show tabs
  return (
    <PaperProvider theme={MD3LightTheme}>
      <View style={{ flex: 1 }}>
        <Tabs>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: () => <Ionicons name="home-outline" size={24} />, // Home tab icon
            }}
          />
          <Tabs.Screen
            name="create-trip"
            options={{
              title: 'Create',
              tabBarIcon: () => <Ionicons name="add-circle-outline" size={24} />, // Create trip tab icon
            }}
          />
          <Tabs.Screen
            name="Profile"
            options={{
              title: 'Profile',
              tabBarIcon: () => <Ionicons name="person-outline" size={24} />, // Create trip tab icon
            }}
          />
        </Tabs>
      </View>
    </PaperProvider>
  );
}

// Styling for Login screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    width: '100%',
  },
});
