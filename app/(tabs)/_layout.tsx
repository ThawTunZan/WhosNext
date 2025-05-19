// File: app/(tabs)/_layout.tsx
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, Pressable } from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider, MD3LightTheme, Button } from 'react-native-paper';
import {
  SignedIn,
  SignedOut,
  useAuth,
} from '@clerk/clerk-expo';


export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Log whenever isAuthenticated state changes
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/login');
    }

  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return null;
  }

  // If authenticated, show tabs
  return (
      <PaperProvider theme={MD3LightTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* if you're not signed in, send to login screen */}
          <SignedOut>
            <Redirect href="/auth/login" />
          </SignedOut>

          {/* once signed in, show your tab navigator */}
          <SignedIn>
            <View style={{ flex: 1 }}>
              <Tabs
                screenOptions={{
                  headerRight: () => <Button>Log out</Button>, // show avatar/menu
                }}
              >
                <Tabs.Screen
                  name="index"
                  options={{
                    title: 'Home',
                    tabBarIcon: () => (
                      <Ionicons name="home-outline" size={24} />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="create-trip"
                  options={{
                    title: 'Create',
                    tabBarIcon: () => (
                      <Ionicons name="add-circle-outline" size={24} />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="profile"
                  options={{
                    title: 'Profile',
                    tabBarIcon: () => (
                      <Ionicons name="person-outline" size={24} />
                    ),
                  }}
                />
              </Tabs>
            </View>
          </SignedIn>
        </GestureHandlerRootView>
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
