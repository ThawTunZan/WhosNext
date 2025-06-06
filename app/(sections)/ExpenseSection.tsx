// src/screens/TripDetails/ExpensesSection.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, Snackbar, Chip, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

import { useExpenses } from '../../src/hooks/useExpenses';
import { addExpenseAndCalculateDebts, deleteExpense } from '../../src/services/expenseService';
import ExpenseList from '@/app/trip/components/ExpenseList';
import AddExpenseModal from '@/src/components/AddExpenseModal'; 
import { ExpensesSectionProps, Expense } from '@/src/types/DataTypes'; 
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

  // --- Render Logic ---
  if (isLoading && expenses.length === 0) {
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={100}
    >
      {renderListHeader()}
      
      <ExpenseList
        expenses={expenses}
        searchQuery={searchQuery}
        profiles={profiles}
        expandedId={expandedId}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onToggleExpand={toggleExpand}
        onDeleteExpense={handleDeleteExpense}
        onEditExpense={handleEditExpenseLocal}
        styles={styles}
      />
    <Button
        mode="contained"
        icon="plus-circle-outline"
        onPress={onAddExpensePress}
        style={styles.addButton}
      >
        Add Expense
      </Button>

      <AddExpenseModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSubmit={handleAddExpenseSubmit}
        members={members}
        tripId={tripId}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  errorText: {
    textAlign: 'center',
  },
  addButton: {
    margin: 16,
  },
  nextPayerChip: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  nextPayerChipText: {
    fontSize: 14,
  },
});

export default ExpensesSection;