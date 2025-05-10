// File: app/(tabs)/_layout.tsx
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from 'expo-router/build/global-state/router-store';

export default function TabLayout() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Manage authentication state locally
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Log whenever isAuthenticated state changes
  useEffect(() => {
    console.log(isAuthenticated + 'isAuthenticated VALUE')
    const checkAuthState = async () => {
      const storedAuthState = await AsyncStorage.getItem('isAuthenticated');
      console.log('[Auth] storedAuthState:', storedAuthState);
      if (storedAuthState === 'true') {
        setIsAuthenticated(true);
      } else {
        router.replace('/auth/login'); // 🔁 redirect to login page
      }
      setLoading(false);
    };
    checkAuthState();
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
