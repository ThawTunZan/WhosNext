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
    <Surface 
      style={[
        styles.container, 
        { 
          backgroundColor: isDarkMode 
            ? '#1A2B4D' // Navy blue for dark mode
            : '#F5F7FA' // Light gray-blue for light mode
        }
      ]} 
      elevation={1}
    >
      <View style={styles.contentContainer}>
        <Text 
          variant="headlineMedium" 
          style={[styles.emoji, { color: isDarkMode ? '#FFFFFF' : theme.colors.text }]}
        >
          🏝️
        </Text>
        <Text 
          variant="headlineMedium" 
          style={[
            styles.title, 
            { color: isDarkMode ? '#FFFFFF' : theme.colors.text }
          ]}
        >
          Trip to {destination}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
