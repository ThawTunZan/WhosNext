// File: app/_layout.tsx
import '../firebase';   // ← ensure this points to your firebase.ts
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to Who's Next!</Text>
      <Text style={styles.subtitle}>Plan and share your adventures with ease.</Text>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
});
