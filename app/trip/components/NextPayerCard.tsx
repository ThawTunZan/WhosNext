import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

type NextPayerCardProps = {
  name: string;
};

export default function NextPayerCard({ name }: NextPayerCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Title title="➡️ Who's Paying Next?" />
      <Card.Content>
        <Text style={styles.name}>{name}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '500',
    color: '#28a745',
    paddingVertical: 8,
  },
}); 