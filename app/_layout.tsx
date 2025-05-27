// app/_layout.tsx

import "expo-router/entry";
import React, { useMemo, useCallback } from "react";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { Redirect, router, Stack, useFocusEffect, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { upsertClerkUserToFirestore } from "@/src/services/UserProfileService";
import { ThemeProvider } from '@/src/context/ThemeContext';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

// NavButton component memoized
const NavButton = React.memo(({
  icon,
  label,
  onPress,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={[styles.navLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
));

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

// Bottom Navigation memoized
const BottomNav = React.memo(({ path, theme }: { path: string; theme: any }) => (
  <SafeAreaView style={[styles.bottomBar, { 
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.border
  }]}>
    <NavButton
      icon="home"
      label="Home"
      onPress={() => router.push('/')}
      color={path === '/' ? theme.colors.primary : theme.colors.subtext}
    />
    <NavButton
      icon="add-circle"
      label="New Trip"
      onPress={() => router.push('/create-trip')}
      color={path === '/create-trip' ? theme.colors.primary : theme.colors.subtext}
    />
    <NavButton
      icon="people"
      label="Friends"
      onPress={() => router.push('/friends')}
      color={path === '/friends' ? theme.colors.primary : theme.colors.subtext}
    />
    <NavButton
      icon="person"
      label="Profile"
      onPress={() => router.push('/profile')}
      color={path === '/profile' ? theme.colors.primary : theme.colors.subtext}
    />
  </SafeAreaView>
));

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <AuthGateAndStack />
      </ThemeProvider>
    </ClerkProvider>
  );
}

function AuthGateAndStack() {
  const { isLoaded, isSignedIn, user } = useUser();
  const path = usePathname();
  const { isDarkMode } = useTheme();
  
  const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);
  const paperTheme = useMemo(() => ({
    ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDarkMode ? MD3DarkTheme.colors : MD3LightTheme.colors),
      ...theme.colors,
    },
  }), [isDarkMode, theme.colors]);

  const syncUser = useCallback(() => {
    if (isLoaded && isSignedIn && user) {
      upsertClerkUserToFirestore(user).catch(console.error);
    }
  }, [isLoaded, isSignedIn, user]);

  useFocusEffect(syncUser);

  if (!isLoaded) return null;
  
  // Only redirect if not signed in and not already on an auth path
  const isAuthPath = path.startsWith("/auth") || path.startsWith("/(auth)");
  if (!isSignedIn && !isAuthPath) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { 
              paddingTop: Platform.OS === 'ios' ? 50 : 0,
              backgroundColor: theme.colors.background 
            }
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{
              animation: 'none'
            }}
          />
          <Stack.Screen 
            name="create-trip"
            options={{
              animation: 'none'
            }}
          />
          <Stack.Screen 
            name="friends"
            options={{
              animation: 'none'
            }}
          />
          <Stack.Screen 
            name="profile"
            options={{
              animation: 'none'
            }}
          />
          <Stack.Screen 
            name="auth"
            options={{
              headerShown: false,
              animation: 'none'
            }}
          />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="profile_screens" />
        </Stack>

        {/* Bottom Navigation Bar */}
        {!isAuthPath && !path.includes('modal') && (
          <BottomNav path={path} theme={theme} />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    height: Platform.OS === 'ios' ? 85 : 60,
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 25 : 0,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

