// File: app/index.tsx
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;

  // if not signed in, go to login; otherwise jump into the tabs
  return isSignedIn
    ? <Redirect href="/(tabs)/create-trip" />     // or "/index" or wherever you want signed-in users
    : <Redirect href="/auth/sign-in" />;
}
