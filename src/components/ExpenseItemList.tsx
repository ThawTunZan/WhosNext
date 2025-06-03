// src/components/ExpenseListItem.tsx
// For rendering each expense row
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Alert } from 'react-native';
import { Card, Text, Divider, Button } from 'react-native-paper';
import { ExpenseListItemProps } from '../types/DataTypes';
import { useMemberProfiles } from "@/src/context/MemberProfilesContext";

const ExpenseItemList = React.memo(({ item, isExpanded, onToggleExpand, onDelete, onEdit }: ExpenseListItemProps) => {
  const profiles = useMemberProfiles();
  
  const sharedWithString = React.useMemo(() => {
    return item.sharedWith.map((p) => profiles[p.payeeID]).join(', ');
  }, [item.sharedWith]);

  // Format currency helper
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  const showDeleteConfirmation = () => {
    onDelete(item.id);
  };

  return (
    <TouchableOpacity onPress={() => onToggleExpand(item.id)} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Title
          title={`💰 ${item.activityName}`}
          subtitle={`Paid by ${profiles[item.paidById]}`}
          right={() => (
            <Text style={styles.amount}>
              {formatCurrency(item.paidAmt, item.currency)}
            </Text>
          )}
          rightStyle={styles.amountContainer}
        />
        {isExpanded && (
          <Card.Content>
            <Divider style={styles.divider} />
            <Text style={styles.detailText}>
              Shared with: {sharedWithString}
            </Text>
            <Text style={styles.detailText}>Date: {item.createdAt || 'N/A'}</Text>

            {/* For edit functionality here */}
            <View style={styles.actionsContainer}>
              <Button
                  mode="outlined" // <<< Make Edit less prominent? Or use IconButton
                  style={styles.editButton}
                  onPress={() => onEdit(item)} // <<< Call onEdit prop with the full item
                  icon="pencil-outline"
                  compact
              >
                  Edit
              </Button>
              <Button
                 mode="contained"
                 style={styles.deleteButton}
                 onPress={showDeleteConfirmation} 
                 icon="delete-outline"
                 compact
              >
                 Delete
              </Button>
            </View>
          </Card.Content>
        )}
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    marginTop: 15,
    gap: 10,
  },
  editButton: {
      // Optional: specific styling for edit button
  },
  card: {
    marginBottom: 10,
    marginHorizontal: 5, // Add some horizontal margin if needed
    overflow: 'hidden', // Ensure content doesn't overflow card boundaries
  },
  amountContainer: {
    paddingRight: 16, // Adjust padding as needed for the right element
    
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    marginVertical: 10,
  },
  detailText: {
      marginBottom: 5,
      color: '#555', // Softer color for details
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: '#e57373', // Or use theme colors
    alignSelf: 'flex-end', // Position button to the right
  },
});

export default ExpenseItemList;