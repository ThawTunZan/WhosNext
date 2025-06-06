import React, { memo } from 'react';
import { View, FlatList, Text, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Expense } from '@/src/types/DataTypes';
import ExpenseCard from './ExpenseCard';

interface ExpenseListProps {
  expenses: Expense[];
  searchQuery: string;
  profiles: Record<string, string>;
  expandedId: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleExpand: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  styles: any;
}

const ExpenseList = memo(({
  expenses,
  searchQuery,
  profiles,
  expandedId,
  isRefreshing,
  onRefresh,
  onToggleExpand,
  onDeleteExpense,
  onEditExpense,
  styles,
}: ExpenseListProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.activityName.toLowerCase().includes(searchLower) ||
      profiles[expense.paidById]?.toLowerCase().includes(searchLower)
    );
  });

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <ExpenseCard
      expense={item}
      isExpanded={item.id === expandedId}
      onToggleExpand={onToggleExpand}
      onDelete={onDeleteExpense}
      onEdit={onEditExpense}
    />
  );

  return (
    <FlatList
      data={filteredExpenses}
      renderItem={renderExpenseItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.text }}>
            {searchQuery ? 'No matching expenses found.' : 'No expenses added yet.'}
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl 
          refreshing={isRefreshing} 
          onRefresh={onRefresh}
          tintColor={paperTheme.colors.primary}
        />
      }
      contentContainerStyle={styles.listContentContainer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
});

export default ExpenseList; 