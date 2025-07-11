import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Redirect } from 'expo-router';

type ErrorStatesProps = {
  isLoaded: boolean;
  isSignedIn: boolean;
  loading: boolean;
  error?: Error;
  hasLeftTrip: boolean;
  tripExists: boolean;
};

export default function ErrorStates({
  isLoaded,
  isSignedIn,
  loading,
  error,
  hasLeftTrip,
  tripExists,
}: ErrorStatesProps) {
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading trip…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading trip: {error.message}</Text>
      </View>
    );
  }

  /*
  if (!tripExists || hasLeftTrip) {
    return (
      <View style={styles.container}>
        <Text>{hasLeftTrip ? "You have left this trip." : "OOTrip not found."}</Text>
      </View>
    );
  }
*/
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 