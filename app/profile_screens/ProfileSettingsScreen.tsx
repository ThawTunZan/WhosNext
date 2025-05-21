// src/screens/ProfileSettingsScreen.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Title, Button } from "react-native-paper";
import { useUser } from "@clerk/clerk-expo";
import { Redirect, useRouter } from "expo-router";

export default function ProfileSettingsScreen() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  return (
    <View style={styles.container}>
      <Title>Profile</Title>
      <Text style={styles.label}>Username</Text>
      <Text style={styles.value}>{user.username || "—"}</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{user.primaryEmailAddress?.emailAddress || "—"}</Text>

      {/* If you have other settings, show them here… */}

      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        Go Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, justifyContent: "flex-start" },
  label: { marginTop: 16, fontWeight: "bold", fontSize: 14 },
  value: { fontSize: 16, marginTop: 4 },
  backButton: { marginTop: 32, alignSelf: "flex-start" },
});
