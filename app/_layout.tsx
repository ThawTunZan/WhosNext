// app/_layout.tsx

import "expo-router/entry";
import React from "react";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { Redirect, router, Stack, useFocusEffect, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { upsertClerkUserToFirestore } from "@/src/services/UserProfileService";
import { useNavigationDirection } from "@/src/navigation/useNavigationDirection";
import { ThemeProvider } from '@/src/context/ThemeContext';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

// NavButton component
function NavButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

function RootLayoutNav() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const path = usePathname();

  // Combine react-native-paper theme with our custom theme
  const paperTheme = isDarkMode
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...darkTheme.colors } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...lightTheme.colors } };

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { 
            paddingTop: Platform.OS === 'ios' ? 50 : 0,
            backgroundColor: theme.colors.background 
          }
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="create-trip" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/sign-in" />
          <Stack.Screen name="auth/sign-up" />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="profile_screens/settings" />
          <Stack.Screen name="profile_screens/FriendsScreen" />
        </Stack>

        {/* Bottom Navigation Bar */}
        {!path.includes('auth') && !path.includes('modal') && (
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
              icon="person"
              label="Profile"
              onPress={() => router.push('/profile')}
              color={path === '/profile' ? theme.colors.primary : theme.colors.subtext}
            />
          </SafeAreaView>
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </ClerkProvider>
  );
}

// Your AuthGateAndStack remains exactly as before:
function AuthGateAndStack() {
  const { isLoaded, isSignedIn, user } = useUser();
  const path = usePathname();
  const direction = useNavigationDirection();

  const syncUser = React.useCallback(() => {
    if (isLoaded && isSignedIn && user) {
      upsertClerkUserToFirestore(user).catch(console.error);
    }
  }, [isLoaded, isSignedIn, user]);

  useFocusEffect(syncUser);

  if (!isLoaded) return null;
  if (!isSignedIn && !path.startsWith("/auth")) {
    return <Redirect href="/auth/sign-in" />;
  }

  const animation = direction === "right" ? "slide_from_right" : "slide_from_left";

  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
        headerShown: false,
        gestureDirection: direction === "right" ? "horizontal" : "vertical",
        animation,
      }}
    >
      <Stack.Screen name="index" 
        options={{
          headerShown: false,
        }}/>
      <Stack.Screen name="create-trip" 
        options={{
          headerShown: false,
        }}/>
      <Stack.Screen name="profile" 
        options={{
          headerShown: false,
        }}/>
      <Stack.Screen 
        name="trip/[id]" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="profile_screens" />
    </Stack>
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
