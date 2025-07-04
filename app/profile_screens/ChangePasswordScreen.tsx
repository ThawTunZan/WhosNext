import React from "react";
import { View, Button, StyleSheet } from "react-native";
import { useClerk } from "@clerk/clerk-expo";
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import ProfileHeader from "./ProfileHeader";
import { StatusBar } from 'expo-status-bar';

export default function ChangePasswordScreen() {
  const { openUserProfile } = useClerk();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <>
      <StatusBar style={isDarkMode ? "dark" : "light"} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <ProfileHeader title="Change Password" />
          </View>
          <View style={{ padding: 20 }}>
            <Button title="Change Password" onPress={() => openUserProfile()} />
          </View>
        </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1000,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
})
