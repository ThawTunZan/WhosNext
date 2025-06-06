// src/screens/TripDetails/ExpensesSection.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Button, Text, Snackbar, Chip, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

import { useExpenses } from '../../src/hooks/useExpenses';
import { addExpenseAndCalculateDebts, deleteExpense } from '../../src/services/expenseService';
import ExpenseCard from '../../app/trip/components/ExpenseCard';
import AddExpenseModal from '../../src/components/AddExpenseModal'; 
import { ExpensesSectionProps, Expense } from '../../src/types/DataTypes'; 
import { MemberProfilesProvider, useMemberProfiles } from "@/src/context/MemberProfilesContext";
import { SearchBar } from '@/app/trip/components/SearchBar';

const ExpensesSection = ({ tripId, members, onAddExpensePress, onEditExpense, nextPayerId }: ExpensesSectionProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();
  const { expenses, isLoading, error: fetchError } = useExpenses(tripId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false); // For pull-to-refresh
  const [searchQuery, setSearchQuery] = useState('');

  const profiles = useMemberProfiles();

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.activityName.toLowerCase().includes(searchLower) ||
      profiles[expense.paidById]?.toLowerCase().includes(searchLower)
    );
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleEditExpenseLocal = useCallback(async (expense: Expense) => {
    console.log(`Edit requested for expense: ${expense.id}`);
    try {
      await onEditExpense(expense);
    }
    catch (err) {
      console.error("Failed to edit expense:", err);
      setSnackbarMessage(`Error: ${err instanceof Error ? err.message : 'Could not edit expense'}`);
      setSnackbarVisible(true);
    }
  }, [onEditExpense]);

  const handleAddExpenseSubmit = async (expenseData: Expense) => {
    
    // Debt calculation
    try {
      await addExpenseAndCalculateDebts(tripId, expenseData, members, profiles);
      setSnackbarMessage('Expense added successfully!');
      setSnackbarVisible(true);
      // No need to manually update state, Firestore listener will do it
    } catch (err) {
      console.error("Failed to submit expense:", err);
      setSnackbarMessage(`Error: ${err instanceof Error ? err.message : 'Could not add expense'}`);
      setSnackbarVisible(true);
      // Re-throw if AddExpenseModal needs to keep loading state
      // throw err;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    // To add confirmation dialog here
    try {
      await deleteExpense(tripId, id, members, profiles); 
      setSnackbarMessage('Expense deleted.');
      setSnackbarVisible(true);

        if(expandedId === id) {
            setExpandedId(null);
        }
      // Data refreshes via listener
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setSnackbarMessage(`Error: ${err instanceof Error ? err.message : 'Could not delete expense'}`);
      setSnackbarVisible(true);
    }
  };

  // Handle pull-to-refresh 
  const onRefresh = useCallback(async () => {
      setIsRefreshing(true);
      // You might trigger a manual re-fetch here if needed,
      // but typically the listener handles updates.
      // For demonstration, we'll just simulate a delay.
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
       setSnackbarMessage('Expenses up to date.');
       setSnackbarVisible(true);
  }, [tripId]);


  const renderExpenseItem = useCallback(({ item }: { item: Expense }) => (
    <ExpenseCard
      expense={item}
      isExpanded={item.id === expandedId}
      onToggleExpand={toggleExpand}
      onDelete={handleDeleteExpense}
      onEdit={handleEditExpenseLocal}
    />
  ), [expandedId, toggleExpand, handleDeleteExpense, handleEditExpenseLocal]);

  const keyExtractor = useCallback((item: Expense) => item.id, []);

  // --- Render Logic ---
   if (isLoading && expenses.length === 0) { // Show loader only on initial load
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
        <Text style={{ color: theme.colors.text }}>Loading Expenses...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error loading expenses: {fetchError}
        </Text>
      </View>
    );
  }

  // ListHeaderComponent for the header
  const renderListHeader = () => (
    <>
      <Text style={[styles.header, { color: theme.colors.text }]}>🧾 Expenses</Text>
      <SearchBar
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        placeholder="Search expenses..."
      />
      {nextPayerId && (
          <Chip
              icon="account-arrow-right"
              style={[styles.nextPayerChip, { backgroundColor: theme.colors.surfaceVariant }]}
              textStyle={[styles.nextPayerChipText, { color: theme.colors.text }]}
          >
              Next Payer: {profiles[nextPayerId]}
          </Chip>
       )}
    </>
  );

  // ListFooterComponent for the button
  const renderListFooter = () => (
     <Button
        mode="contained"
        icon="plus-circle-outline"
        onPress={onAddExpensePress}
        style={styles.addButton}
      >
        Add Expense
      </Button>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
      >
        {renderListHeader()}
        <FlatList
          data={filteredExpenses}
          keyExtractor={keyExtractor}
          renderItem={renderExpenseItem}
          ListFooterComponent={renderListFooter}
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
          scrollEnabled={false}
        />
      </ScrollView>

      <AddExpenseModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSubmit={handleAddExpenseSubmit}
        members={members}
        tripId={tripId}
        suggestedPayerId={nextPayerId} 
        editingExpenseId={null}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  nextPayerChip: {
    alignSelf: 'flex-start',
    marginTop: -5,
    marginBottom: 15,
    marginLeft: 16,
  },
  nextPayerChipText: {
    fontSize: 13,
  },
  errorText: {
    textAlign: 'center',
    marginHorizontal: 20,
  },
  listContentContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  addButton: {
    margin: 16,
  },
});

export default ExpensesSection;