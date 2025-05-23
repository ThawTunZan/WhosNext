import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { Member } from '@/src/types/DataTypes';

type PersonalBudgetCardProps = {
  member: Member;
  onEditBudget: () => void;
};

export default function PersonalBudgetCard({ member, onEditBudget }: PersonalBudgetCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Title
        title="🎯 Personal Budget"
        right={() => <IconButton icon="pencil" onPress={onEditBudget} />}
      />
      <Card.Content>
        <Text style={styles.budgetText}>Amount left: ${member.amtLeft.toFixed(2)}</Text>
        <Text style={styles.budgetText}>Total Budget: ${member.budget.toFixed(2)}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
  },
  budgetText: {
    marginTop: 8,
    fontSize: 16,
  },
}); 