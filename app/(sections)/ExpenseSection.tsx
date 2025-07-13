// src/screens/TripDetails/ExpensesSection.tsx
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { Button, Snackbar, Chip } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/app/styles/section_comp_styles';
import { addExpenseAndCalculateDebts, deleteExpense } from '@/src/services/expenseService';
import ExpenseList from '@/app/trip/components/ItemList/ExpenseList';
import AddExpenseModal from '@/src/TripSections/Expenses/components/AddExpenseModal'; 
import { ExpensesSectionProps, Expense } from '@/src/types/DataTypes'; 
import { SearchBar } from '@/app/trip/components/SearchBar';
import { BaseSection } from '@/app/common_components/BaseSection';
import { useTripExpenses } from '@/src/hooks/useTripExpenses';
import { useTripExpensesContext } from '@/src/context/TripExpensesContext';
import { useUserTripsContext } from '@/src/context/UserTripsContext';

const ExpensesSection = ({ tripId, onAddExpensePress, onEditExpense, nextPayerName }: ExpensesSectionProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {expenses, loading: isLoading, error} = useTripExpensesContext();
  const {trips} = useUserTripsContext()
  const trip = trips.find(t => t.id === tripId)
  const members = trip.members;
  
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
    try {
      await addExpenseAndCalculateDebts(tripId, expenseData, members, trip);
      setSnackbarMessage('Expense added successfully!');
      setSnackbarVisible(true);
      setModalVisible(false);
    } catch (err) {
      console.error("Failed to submit expense:", err);
      setSnackbarMessage(`Error: ${err instanceof Error ? err.message : 'Could not add expense'}`);
      setSnackbarVisible(true);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    // To add confirmation dialog here
    try {
      const expenseToDelete = expenses.find(e => e.id === id);
      if (!expenseToDelete) {
        setSnackbarMessage('Expense not found.');
        setSnackbarVisible(true);
        return;
      }
      await deleteExpense(tripId, id, expenseToDelete, trip); 
      setSnackbarMessage('Expense deleted.');
      setSnackbarVisible(true);

      if(expandedId === id) {
        setExpandedId(null);
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setSnackbarMessage(`Error: ${err instanceof Error ? err.message : 'Could not delete expense'}`);
      setSnackbarVisible(true);
    }
  };

  // Handle pull-to-refresh 
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    setSnackbarMessage('Expenses up to date.');
    setSnackbarVisible(true);
  }, [tripId]);

  const renderHeader = () => (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        placeholder="Search expenses..."
      />
      {nextPayerName && (
        <Chip
          icon="account-arrow-right"
          style={[sectionStyles.nextPayerChip, { backgroundColor: theme.colors.surfaceVariant }]}
          textStyle={[sectionStyles.nextPayerChipText, { color: theme.colors.text }]}
        >
          Next Payer: {nextPayerName}
        </Chip>
      )}
    </>
  );

  return (
    <BaseSection
      title="Expenses"
      icon="🧾"
      loading={isLoading && expenses.length === 0}
      error={error}
    >
      {renderHeader()}
      
      <ExpenseList
        expenses={expenses}
        searchQuery={searchQuery}
        expandedId={expandedId}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onToggleExpand={toggleExpand}
        onDeleteExpense={handleDeleteExpense}
        onEditExpense={handleEditExpenseLocal}
        styles={sectionStyles}
      />

      <Button
        mode="contained"
        icon="plus-circle-outline"
        onPress={onAddExpensePress}
        style={sectionStyles.actionButton}
      >
        Add Expense
      </Button>


        <AddExpenseModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          onSubmit={handleAddExpenseSubmit}
          members={members}
          tripId={tripId}
          trip={trip}
          onWatchAd={() => {
            // TODO: Implement ad watching functionality
            console.log('Watch ad functionality not implemented yet');
          }}
        />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </BaseSection>
  );
};

export default ExpensesSection;