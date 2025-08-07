// src/screens/ProfileSettingsScreen.tsx

import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Title, Button } from "react-native-paper";
import { useUser } from "@clerk/clerk-expo";
import { Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ProfileHeader from "./ProfileHeader";
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileSettingsScreen() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { isDarkMode, setDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  return (
    <>
      <StatusBar style={isDarkMode ? "dark" : "light"} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <ProfileHeader title="Edit Profile" subtitle="" />
          </View>
        <View style={styles.container}>
        <ScrollView 
          style={[styles.container, isDarkMode && styles.darkContainer]}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{user.username || "—"}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.primaryEmailAddress?.emailAddress || "—"}</Text>

        {/* For other settings, show them here lol*/}

        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Go Back
        </Button>
        </ScrollView>
      </View>
      
      </View>
      
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  label: { marginTop: 16, fontWeight: "bold", fontSize: 14 },
  value: { fontSize: 16, marginTop: 4 },
  backButton: { marginTop: 32, alignSelf: "flex-start" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
});
