// app/_layout.tsx

import "expo-router/entry";
import React, { useMemo, useCallback, useEffect } from "react";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Text, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Redirect, router, Stack, useFocusEffect, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { syncUserProfileToDynamoDB } from "@/src/services/syncUserProfile";
import { ThemeProvider } from '@/src/context/ThemeContext';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { UserTripsProvider, useUserTripsContext } from "@/src/context/UserTripsContext";
import { useAuth } from '@clerk/clerk-expo';
import {Amplify} from 'aws-amplify';
import awsconfig from '../src/aws-exports';
import { migrateExistingTrips } from '@/src/utilities/TripMigrationUtilities';

let amplifyConfigured = false;
let migrationRun = false;


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
      onPress={() => router.push('/create_trip/create-trip')}
      color={path === '/create_trip/create-trip' ? theme.colors.primary : theme.colors.subtext}
    />
    <NavButton
      icon="people"
      label="Friends"
      onPress={() => router.push('/screens/Friends/friends')}
      color={path === '/screens/Friends/friends' ? theme.colors.primary : theme.colors.subtext}
    />
    <NavButton
      icon="person"
      label="Profile"
      onPress={() => router.push('/profile/profile')}
      color={path === '/profile/profile' ? theme.colors.primary : theme.colors.subtext}
    />
  </SafeAreaView>
));

// Loading component
const LoadingScreen = React.memo(({ theme }: { theme: any }) => (
  <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>
        Loading...
      </Text>
    </View>
  </SafeAreaView>
));

export default function RootLayout() {
  useEffect(() => {
    if (!amplifyConfigured) {
      Amplify.configure(awsconfig);
      amplifyConfigured = true;
      
      // Run migration for existing trips only once
      if (!migrationRun) {
        migrationRun = true;
        migrateExistingTrips().catch(console.error);
      }
    }
  }, []);
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ThemeProvider>
          <UserTripsProvider>
            <AuthGateAndStack />
          </UserTripsProvider>
        </ThemeProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

function AuthGateAndStack() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isSignedIn: authSignedIn, userId: authUserId } = useAuth();
  React.useEffect(() => {
    console.log('[Clerk Debug] Session state:', { isSignedIn: authSignedIn, userId: authUserId });
  }, [authSignedIn, authUserId]);
  const path = usePathname();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const {user: tripsUser} = useUserTripsContext();
  
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
      // Convert Clerk user to the format expected by UserProfileService
      const UserFromDynamo = {
        id: user.username,
        username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        primaryEmailAddress: user.primaryEmailAddress?.emailAddress || '',
        profileImageUrl: user.imageUrl || '',
        friends: tripsUser?.friends || [],
        incomingFriendRequests: tripsUser?.incomingFriendRequests || [],
        outgoingFriendRequests: tripsUser?.outgoingFriendRequests || [],
        trips: tripsUser?.trips || [],
        premiumStatus: tripsUser?.premiumStatus || 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      syncUserProfileToDynamoDB(UserFromDynamo).catch(console.error);
    }
  }, [isLoaded, isSignedIn, user, tripsUser]);

  useFocusEffect(syncUser);

  // Show loading screen while Clerk is initializing
  if (!isLoaded) {
    return (
      <PaperProvider theme={paperTheme}>
        <LoadingScreen theme={theme} />
      </PaperProvider>
    );
  }
  
  // Define which paths are public (don't require authentication)
  const publicPaths = ['/auth', '/auth/sign-in', '/auth/sign-up'];
  const isPublicPath = publicPaths.some(publicPath => 
    path.startsWith(publicPath) || path === publicPath
  );
  
  // Redirect to sign-in if not authenticated and not on a public path
  if (!isSignedIn && !isPublicPath) {
    return <Redirect href="/auth/sign-in" />;
  }
  
  // Redirect to home if authenticated and on auth path
  if (isSignedIn && isPublicPath) {
    return <Redirect href="/" />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { 
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
            name="create_trip/create-trip"
            options={{
              animation: 'none'
            }}
          />
          <Stack.Screen 
            name="screens/Friends/friends"
            options={{
              animation: 'none'
            }}
          />
          <Stack.Screen 
            name="profile/profile"
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
          <Stack.Screen name="screens/trip/[id]" />
        </Stack>

        {/* Bottom Navigation Bar - only show for authenticated users on main screens */}
        {isSignedIn && !isPublicPath && !path.includes('modal') && (
          <BottomNav path={path} theme={theme} />
        )}
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

