import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type TripHeaderProps = {
  destination: string;
};

export default function TripHeader({ destination }: TripHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>
      <Pressable onPress={() => {const doNothing = 0}} style={styles.settingButton}>
        <Ionicons name="settings-outline" size={24} color="black" />
      </Pressable>
      <Text style={styles.title}>
        🏝️ Trip to {destination}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles for basic View/Text example:
  container: {
    paddingTop: 110,
    paddingBottom: 30,
    paddingHorizontal: 20,
    //backgroundColor: '#f0f0f0', 
    alignItems: 'center', // Center title if needed
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 60,  
    padding: 5,
    zIndex: 1, // Ensure it's above other elements
  },
  settingButton: {
    position: 'absolute',
    right: 15,
    top: 60,  
    padding: 5,
    zIndex: 1,
  },
})
