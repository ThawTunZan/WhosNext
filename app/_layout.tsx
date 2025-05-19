// File: app/_layout.tsx
import 'expo-router/entry';
import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';

// use your actual env var here
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
        {children}
        <Slot />
    </ClerkProvider>
  );
}
