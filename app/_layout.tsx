// app/_layout.tsx 
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    // Add Gesture Handler at the very root
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider theme={MD3LightTheme}>
          <Stack screenOptions={{ headerShown: false }}>
              {/* The (tabs) layout is nested within this root Stack */}
              <Stack.Screen name="(tabs)" />
              {/* The trip detail screen is also presented by this root Stack */}
              <Stack.Screen name="trip/[id]" />
              {/* Add any other root-level modal screens etc. here */}
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}