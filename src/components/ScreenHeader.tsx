import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  style?: any;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightComponent,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent && (
        <View style={styles.rightComponent}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  rightComponent: {
    marginLeft: 16,
  },
}); 