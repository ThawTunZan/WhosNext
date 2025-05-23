import { View, Text, StyleSheet } from "react-native";

type TripHeaderProps = {
  destination: string;
};

export default function TripHeader({ destination }: TripHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        🏝️ Trip to {destination}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
