import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, List, Avatar, Divider } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Expense, SharedWith } from '@/src/types/DataTypes';
import { useMemberProfiles } from '@/src/context/MemberProfilesContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ExpenseCardProps {
  expense: Expense;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export default function ExpenseCard({ 
  expense, 
  isExpanded, 
  onToggleExpand, 
  onDelete, 
  onEdit 
}: ExpenseCardProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const profiles = useMemberProfiles();

  // Get array of payer names for this expense
  const paidByNames = expense.paidByAndAmounts.map(p => profiles[p.memberId] || 'Someone').join(',  ');

  // Calculate total shared amount
  const totalShared = expense.sharedWith.reduce((sum, share) => sum + share.amount, 0);
  
  // Improved date formatting logic
  const formatDate = (dateValue: Date | Timestamp | string | null | undefined) => {
    if (!dateValue) return '';
    
    try {
      let date: Date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (dateValue instanceof Timestamp) {
        date = dateValue.toDate();
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const formattedDate = formatDate(expense.createdAt);

  const getPayeeNames = (sharedWith: SharedWith[]) => {
    return sharedWith
      .map(share => ({
        name: profiles[share.payeeID] || share.payeeID,
        amount: share.amount
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getPayerNames = (paidByAndAmounts: {
    memberId: string;
    amount: string;
    }[]) => {
      return paidByAndAmounts.map(each => ({
        name: profiles[each.memberId] || 'unknown',
        amount: parseFloat(each.amount) || 0
      }))
  }

  const renderExpandedContent = () => (
    <Card.Content style={styles.expandedContent}>
      <Divider style={styles.divider} />
      
      <View style={styles.detailsContainer}>
        <Text variant="titleMedium" style={[styles.detailsTitle, { color: theme.colors.text }]}>
          Payment Details
        </Text>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Paid by</Text>
        </View>

        {getPayerNames(expense.paidByAndAmounts).map((payer, index) => (
          <View key={index} style={styles.splitRow}>
            <Text style={[styles.payeeName, { color: theme.colors.text }]}>{payer.name}</Text>
            <Text style={[styles.payeeAmount, { color: theme.colors.text }]}>
              ${payer.amount.toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Date</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formattedDate}</Text>
        </View>

        <Text variant="titleMedium" style={[styles.splitTitle, { color: theme.colors.text }]}>
          Split Details
        </Text>

        {getPayeeNames(expense.sharedWith).map((payee, index) => (
          <View key={index} style={styles.splitRow}>
            <Text style={[styles.payeeName, { color: theme.colors.text }]}>{payee.name}</Text>
            <Text style={[styles.payeeAmount, { color: theme.colors.text }]}>
              ${payee.amount.toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.primary }]}>Total Split</Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            ${totalShared.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <IconButton
          icon="pencil"
          mode="contained"
          containerColor={theme.colors.surfaceVariant}
          iconColor={theme.colors.primary}
          size={20}
          onPress={() => onEdit(expense)}
        />
        <IconButton
          icon="delete"
          mode="contained"
          containerColor={theme.colors.error}
          iconColor={theme.colors.surface}
          size={20}
          onPress={() => onDelete(expense.id)}
        />
      </View>
    </Card.Content>
  );

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        isExpanded && styles.expandedCard
      ]}
    >
      <TouchableOpacity
        onPress={() => onToggleExpand(expense.id)}
        style={styles.touchable}
      >
        <Card.Title
          title={expense.activityName}
          subtitle={`Paid by ${paidByNames}`}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="currency-usd"
              size={40}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          right={(props) => (
            <View style={styles.rightContent}>
              <Text style={[styles.amount, { color: theme.colors.primary }]}>
                ${totalShared.toFixed(2)}
              </Text>
              <IconButton
                {...props}
                icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                onPress={() => onToggleExpand(expense.id)}
              />
            </View>
          )}
        />
      </TouchableOpacity>

      {isExpanded && renderExpandedContent()}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  expandedCard: {
    marginVertical: 12,
  },
  touchable: {
    borderRadius: 12,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  expandedContent: {
    paddingTop: 0,
  },
  divider: {
    marginVertical: 12,
  },
  detailsContainer: {
    gap: 8,
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  splitTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  payeeName: {
    fontSize: 14,
  },
  payeeAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
}); 