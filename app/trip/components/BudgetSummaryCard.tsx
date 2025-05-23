import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
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
  return (
    <Card style={styles.card}>
      <Card.Title title="📊 Budget Summary" />
      <Card.Content>
        {Object.entries(members).map(([uid, m]) => {
          const progress = m.budget > 0 ? m.amtLeft / m.budget : 0;
          return (
            <View key={uid} style={styles.memberBar}>
              <Text style={styles.memberName}>{profiles[uid]}</Text>
              <ProgressBar 
                progress={Math.min(1, Math.max(0, progress))} 
                style={styles.progressBar} 
              />
            </View>
          );
        })}
        <Text style={styles.budgetText}>Total Budget: ${totalBudget.toFixed(2)}</Text>
        <Text style={styles.budgetText}>Total Left: ${totalAmtLeft.toFixed(2)}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
  },
  memberBar: {
    marginVertical: 4,
  },
  memberName: {
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetText: {
    marginTop: 8,
    fontSize: 16,
  },
}); 