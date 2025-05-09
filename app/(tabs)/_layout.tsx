// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { AuthProvider } from '../../src/context/AuthContext';

export default function TabLayout() {

  return (
    <AuthProvider>
      <PaperProvider theme={MD3LightTheme}>
          <View style={{ flex: 1 }}>
            <Tabs>
              <Tabs.Screen
                name="index"
                options={{
                  title: "Home",
                  tabBarIcon: () => <Ionicons name="home-outline" size={24} />,
                }}
              />
              <Tabs.Screen
                name="create-trip"
                options={{
                  title: "Create",
                  tabBarIcon: () => <Ionicons name="add-circle-outline" size={24} />,
                }}
              />
            </Tabs>
          </View>
      </PaperProvider>
    </AuthProvider>
  );
}
