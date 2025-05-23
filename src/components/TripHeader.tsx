import { View, StyleSheet } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type TripHeaderProps = {
  destination: string;
};

export default function TripHeader({ destination }: TripHeaderProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  return (
    <Surface style={[styles.container, { backgroundColor: paperTheme.colors.primary }]} elevation={4}>
      <View style={styles.contentContainer}>
        <Text variant="headlineMedium" style={styles.emoji}>
          🏝️
        </Text>
        <Text variant="headlineMedium" style={styles.title}>
          Trip to {destination}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
});
