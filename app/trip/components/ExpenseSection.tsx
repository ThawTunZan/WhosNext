// src/screens/TripDetails/ExpensesSection.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Button, Text, Snackbar, Chip } from 'react-native-paper';

import { useExpenses } from '../../../src/hooks/useExpenses';
import { addExpenseAndCalculateDebts, deleteExpense } from '../../../src/services/expenseService';
import ExpenseItemList from '../../../src/components/ExpenseItemList';
import AddExpenseModal from '../../../src/components/AddExpenseModal'; 
import { ExpensesSectionProps, Expense, NewExpenseData } from '../../../src/types/DataTypes'; 

const ExpensesSection = ({ tripId, members, onAddExpensePress, onEditExpense, nextPayerName }: ExpensesSectionProps) => {
  const { expenses, isLoading, error: fetchError } = useExpenses(tripId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false); // For pull-to-refresh

  

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
      await addExpenseAndCalculateDebts(tripId, expenseData, members);
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
      await deleteExpense(tripId, id, members); 
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
    <ExpenseItemList
      item={item}
      isExpanded={item.id === expandedId}
      onToggleExpand={toggleExpand}
      onDelete={handleDeleteExpense}
      onEdit={handleEditExpenseLocal}
    />
  ), [expandedId, toggleExpand, handleDeleteExpense, handleEditExpenseLocal]); // Dependencies for useCallback

  const keyExtractor = useCallback((item: Expense) => item.id, []);

  // --- Render Logic ---
   if (isLoading && expenses.length === 0) { // Show loader only on initial load
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Expenses...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading expenses: {fetchError}</Text>
        {/* Optionally add a retry button */}
      </View>
    );
  }

  // ListHeaderComponent for the header
  const renderListHeader = () => (
    <>
      <Text style={styles.header}>🧾 Expenses</Text>
      {/* Conditionally render the Chip/Text if name exists */}
      {nextPayerName && (
          <Chip
              icon="account-arrow-right"
              style={styles.nextPayerChip}
              textStyle={styles.nextPayerChipText}
          >
              Next Payer: {nextPayerName}
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
    <View style={styles.container}>

      <FlatList
        data={expenses}
        keyExtractor={keyExtractor}
        renderItem={renderExpenseItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
           <View style={styles.centered}>
               <Text>No expenses added yet.</Text>
           </View>
        }
        refreshControl={ // Pull-to-refresh
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContentContainer}
        
      />

      <AddExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddExpenseSubmit}
        members={members}
        tripId={tripId}
        suggestedPayerName={nextPayerName} 
        editingExpenseId={null}      />

        {/* Snackbar for user feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT} // Or DURATION_MEDIUM
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  nextPayerChip: {
    alignSelf: 'flex-start', // Position chip left
    marginTop: -5, // Adjust spacing relative to header
    marginBottom: 15,
    marginLeft: 5, // Align with header margin
    backgroundColor: '#e8eaf6', // Example background color
  },
  nextPayerChipText: {
    fontSize: 13,
  },
  container: {
    flex: 1, // Make this container take up available space
    // Remove padding here if you want padding only around list content
  },
  listContentContainer: {
     paddingHorizontal: 15, // Add horizontal padding inside the list
     paddingBottom: 20, // Add padding at the bottom of list content
  },
   centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5, 
  },
  addButton: {
      marginVertical: 50,
      marginHorizontal: 50,
  },
  errorText: {
      color: 'red',
      textAlign: 'center',
  },

});

export default ExpensesSection;