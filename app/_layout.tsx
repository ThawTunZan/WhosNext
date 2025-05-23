// app/_layout.tsx

import "expo-router/entry";
import React from "react";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Redirect, router, Stack, useFocusEffect, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { upsertClerkUserToFirestore } from "@/src/services/UserProfileService";
import { useNavigationDirection } from "@/src/navigation/useNavigationDirection";

// (If you have a NavButton component extract it here; otherwise inline it.)
function NavButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={MD3LightTheme.colors.primary} />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <PaperProvider theme={MD3LightTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* This view grows to fill above-bottom-nav */}
          <View style={{ flex: 1 }}>
            <AuthGateAndStack />
          </View>

          {/* Bottom navigation bar */}
          <View style={styles.bottomBar}>
            <NavButton icon="home-outline" label="Home" onPress={() => router.push("/")} />
            <NavButton icon="add-circle-outline" label="Create" onPress={() => router.push("/create-trip")} />
            <NavButton icon="person-outline" label="Profile" onPress={() => router.push("/profile")} />
          </View>
        </SafeAreaView>
      </PaperProvider>
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
      <Stack.Screen name="index" />
      <Stack.Screen name="create-trip" />
      <Stack.Screen name="profile" />
      <Stack.Screen 
        name="trip/[id]" 
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen name="profile_screens" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    height: 60,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 12,
    color: MD3LightTheme.colors.primary,
    marginTop: 2,
  },
});
