// src/components/ActivityCard.tsx
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, IconButton, Divider, Caption } from 'react-native-paper';
import { ActivityCardProps } from '../types/DataTypes';

const ActivityCard = React.memo(({ activity, onVoteUp, onVoteDown, onAddExpense, onDelete }: ActivityCardProps) => {
  // Placeholder state for voting appearance (replace with actual logic later)
  // const currentUserVote = activity.currentUserVote; // Example

  return (
    <Card style={styles.card}>
      <Card.Title
        title={activity.name}
        titleStyle={styles.cardTitle}
        subtitle={`Suggested by ${activity.suggestedByName}`}
        right={(props) => (
          <IconButton
              {...props}
              icon="trash-can-outline"
              onPress={() => onDelete(activity.id)}// <<< Call confirmation dialog
              size={20}
              iconColor={styles.deleteIcon.color} // Use style color
          />
      )}
      />
      <Card.Content>
        {activity.description && <Text style={styles.description}>{activity.description}</Text>}
        {activity.estCost != null && (
        <Caption>
          Est. Cost: {activity.currency || '$'}
          {/* Now it's safe to call .toFixed() because estCost cannot be null here */}
          {activity.estCost.toFixed(2)}
        </Caption>
      )}
        <Divider style={styles.divider} />
        <View style={styles.voteContainer}>
          <View style={styles.voteButtonContainer}>
            <IconButton
              icon="thumb-up-outline"
              // icon={currentUserVote === 'up' ? "thumb-up" : "thumb-up-outline"} // Example conditional styling
              size={20}
              onPress={() => onVoteUp(activity.id)}
            />
            <Text>{activity.votesUp}</Text>
          </View>
          <View style={styles.voteButtonContainer}>
            <IconButton
              icon="thumb-down-outline"
              // icon={currentUserVote === 'down' ? "thumb-down" : "thumb-down-outline"} // Example conditional styling
              size={20}
              onPress={() => onVoteDown(activity.id)}
            />
            <Text>{activity.votesDown}</Text>
          </View>
          <Button
              mode="outlined"
              icon="plus-circle"
              style={styles.addExpenseButton}
              onPress={() => onAddExpense(activity)}
              compact // Smaller button
              labelStyle={styles.addExpenseLabel}
             >
               Add to Expense
           </Button>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  deleteIcon: {
    color: '#d9534f', // Reddish color for delete icon
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  description: {
    marginBottom: 8,
    color: '#555',
  },
  divider: {
    marginVertical: 10,
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  voteButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   addExpenseButton: {
      marginLeft: 'auto', // Push to the right
   },
   addExpenseLabel: {
      fontSize: 12, // Smaller text
   }
});

export default ActivityCard;