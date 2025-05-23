import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, IconButton, useTheme, ProgressBar } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Member } from '@/src/types/DataTypes';

type PersonalBudgetCardProps = {
  member: Member;
  onEditBudget: () => void;
};

export default function PersonalBudgetCard({ member, onEditBudget }: PersonalBudgetCardProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const progress = member.budget > 0 ? member.amtLeft / member.budget : 0;
  const getProgressColor = (progress: number) => {
    if (progress > 0.6) return paperTheme.colors.primary;
    if (progress > 0.3) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.text }]}>
            🎯 Personal Budget
          </Text>
          <IconButton 
            icon="pencil" 
            onPress={onEditBudget}
            mode="contained-tonal"
          />
        </View>
        
        <View style={styles.budgetInfo}>
          <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.text }]}>
            ${member.amtLeft.toFixed(2)}
          </Text>
          <Text variant="titleSmall" style={[styles.total, { color: theme.colors.subtext }]}>
            of ${member.budget.toFixed(2)} total
          </Text>
          <ProgressBar 
            progress={Math.min(1, Math.max(0, progress))} 
            style={styles.progressBar}
            color={getProgressColor(progress)}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
  },
  budgetInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  amount: {
    fontWeight: 'bold',
  },
  total: {
    marginTop: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
}); 