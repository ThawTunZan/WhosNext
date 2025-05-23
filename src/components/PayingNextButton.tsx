import { View, Button, StyleSheet } from "react-native";

type PayingNextButtonProps = {
  onPress: () => void;
};

export default function PayingNextButton({ onPress }: PayingNextButtonProps) {
  return (
    <View style={styles.container}>
      <Button title="🔄 Who's Paying Next?" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
});
