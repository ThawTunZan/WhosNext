import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type NextPayerCardProps = {
  name: string;
};

export default function NextPayerCard({ name }: NextPayerCardProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.content}>
          <Avatar.Text 
            size={48} 
            label={name.substring(0, 2).toUpperCase()} 
            style={[styles.avatar, { backgroundColor: paperTheme.colors.primary }]}
          />
          <View style={styles.textContainer}>
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.text }]}>
              Next to Pay
            </Text>
            <Text variant="titleLarge" style={[styles.name, { color: paperTheme.colors.primary }]}>
              {name}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  avatar: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
  },
}); 