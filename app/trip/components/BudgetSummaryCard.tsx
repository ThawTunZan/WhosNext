import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Member } from '@/src/types/DataTypes';

type BudgetSummaryCardProps = {
  members: Record<string, Member>;
  profiles: Record<string, string>;
  totalBudget: number;
  totalAmtLeft: number;
};

export default function BudgetSummaryCard({ 
  members, 
  profiles, 
  totalBudget, 
  totalAmtLeft 
}: BudgetSummaryCardProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const totalProgress = totalBudget > 0 ? totalAmtLeft / totalBudget : 0;
  const getProgressColor = (progress: number) => {
    if (progress > 0.6) return paperTheme.colors.primary;
    if (progress > 0.3) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.totalBudgetSection}>
          <Text variant="titleMedium" style={[styles.totalLabel, { color: theme.colors.text }]}>
            Total Budget
          </Text>
          <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.text }]}>
            ${totalBudget.toFixed(2)}
          </Text>
          <Text variant="titleSmall" style={[styles.remaining, { color: theme.colors.subtext }]}>
            ${totalAmtLeft.toFixed(2)} remaining
          </Text>
          <ProgressBar 
            progress={Math.min(1, Math.max(0, totalProgress))} 
            style={styles.totalProgress}
            color={getProgressColor(totalProgress)}
          />
        </View>

        <View style={styles.memberSection}>
          <Text variant="titleMedium" style={[styles.memberTitle, { color: theme.colors.text }]}>
            Individual Budgets
          </Text>
          {Object.entries(members).map(([uid, m]) => {
            const progress = m.budget > 0 ? m.amtLeft / m.budget : 0;
            return (
              <View key={uid} style={styles.memberBar}>
                <View style={styles.memberHeader}>
                  <Text style={[styles.memberName, { color: theme.colors.text }]}>
                    {profiles[uid]}
                  </Text>
                  <Text style={[styles.memberAmount, { color: theme.colors.subtext }]}>
                    ${m.amtLeft.toFixed(2)} / ${m.budget.toFixed(2)}
                  </Text>
                </View>
                <ProgressBar 
                  progress={Math.min(1, Math.max(0, progress))} 
                  style={styles.progressBar}
                  color={getProgressColor(progress)}
                />
              </View>
            );
          })}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  totalBudgetSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  totalLabel: {
    marginBottom: 8,
  },
  amount: {
    fontWeight: 'bold',
  },
  remaining: {
    marginTop: 4,
    marginBottom: 12,
  },
  totalProgress: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  memberSection: {
    gap: 16,
  },
  memberTitle: {
    marginBottom: 8,
  },
  memberBar: {
    gap: 8,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberAmount: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
}); 