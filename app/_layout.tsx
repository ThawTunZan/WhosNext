// File: app/_layout.tsx
import 'expo-router/entry';
import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import {  Provider as PaperProvider, MD3LightTheme as DefaultTheme} from 'react-native-paper'
import { Slot } from 'expo-router';
import '../global.css';    

// use your actual env var here
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F1F5F9',    // a soft light grey instead of pure white
    surface: '#FFFFFF',       // card backgrounds
    primary: '#2563EB',       // your blue-600
    onSurface: '#1F2937',     // gray-800 for most text
    onSurfaceVariant: '#4B5563', // gray-600 for subtitles
    outline: '#CBD5E1',       // gray-300 for borders
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <PaperProvider theme={theme}>
        {children}
        <Slot screenOptions={{ headerShown: false }} />
        </PaperProvider>
    </ClerkProvider>
  );
}
