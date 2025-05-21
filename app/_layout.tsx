// File: app/_layout.tsx
import "expo-router/entry"
import React from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text as RNText,
} from "react-native"
import { ClerkProvider } from "@clerk/clerk-expo"
import { tokenCache } from "@clerk/clerk-expo/token-cache"
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper"
import { Stack, useRouter, usePathname } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import "../global.css"

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

export default function RootLayout() {
  const router = useRouter()
  const path = usePathname() // gives e.g. "/" or "/create-trip"
  // map "/" → "index"
  const current = path === "/" ? "index" : path.slice(1)

  // define your tab order
  const tabs: Array<"index" | "create-trip" | "profile"> = [
    "index",
    "create-trip",
    "profile",
  ]
  const currIdx = tabs.indexOf(current as any)

  // smart nav: back if target < current, else forward
  const go = (target: typeof tabs[number]) => () => {
    const targetIdx = tabs.indexOf(target)
    if (targetIdx < currIdx) {
      router.back()
    } else if (current !== target) {
      // only push if not already on target
      router.push(target === "index" ? "/" : `/${target}`)
    }
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <PaperProvider theme={MD3LightTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                gestureEnabled: true,
                gestureDirection: "horizontal",
                animation: "slide_from_right",
                headerShown: true,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="create-trip" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="trip/[id]" />
            </Stack>
          </View>

          <View style={styles.bottomBar}>
            <NavButton icon="home-outline"    label="Home"   onPress={go("index")} />
            <NavButton icon="add-circle-outline" label="Create" onPress={go("create-trip")} />
            <NavButton icon="person-outline"  label="Profile" onPress={go("profile")} />
          </View>
        </SafeAreaView>
      </PaperProvider>
    </ClerkProvider>
  )
}

function NavButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"]
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={MD3LightTheme.colors.primary} />
      <RNText style={styles.navLabel}>{label}</RNText>
    </TouchableOpacity>
  )
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
})
