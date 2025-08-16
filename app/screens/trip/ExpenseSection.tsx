// src/screens/TripDetails/ExpensesSection.tsx
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { Button, Snackbar, Chip } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/src/styles/section_comp_styles';
import { ExpenseHandler } from '@/src/utilities/ExpenseHandler';
import ExpenseList from '@/src/components/Common/ItemList/ExpenseList';
import AddExpenseModal from '@/src/components/Trip/Expenses/components/AddExpenseModal'; 
import { ExpensesSectionProps, Expense, ErrorType } from '@/src/types/DataTypes'; 
import { SearchBar } from '@/src/components/Common/SearchBar';
import { BaseSection } from '@/src/components/Common/BaseSection';
import { useTripExpensesContext } from '@/src/context/TripExpensesContext';
import { useUserTripsContext } from '@/src/context/UserTripsContext';

const ExpensesSection = ({ tripId }: ExpensesSectionProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {expenses, loading: isLoading, error} = useTripExpensesContext();
  const {trips} = useUserTripsContext()
  const trip = trips.find(t => t.id === tripId)
  const members = trip.members;

  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [initialExpenseData, setInitialExpenseData] = useState<Partial<Expense> | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Open modal function - can be called from parent
  const openAddExpenseModal = useCallback(
    (initialData: Partial<Expense> | null = null, isEditing = false) => {
      setInitialExpenseData(initialData);
      setEditingExpenseId(
        isEditing && initialData && typeof initialData.id === "string"
          ? initialData.id
          : null
      );
      setAddExpenseModalVisible(true);
    },
    []
  );

  const closeAddExpenseModal = useCallback(() => {
    setAddExpenseModalVisible(false);
    setInitialExpenseData(null);
    setEditingExpenseId(null);
  }, []);

  // Handle expense submission using ExpenseHandler
  const handleAddOrUpdateExpenseSubmit = useCallback(
    async (expenseData: Expense, editingExpenseId: string | null) => {
      if (!tripId) throw new Error("Trip ID is missing");
      if (!members) throw new Error("Trip members not available");

      try {
        if (editingExpenseId) {
          const expense = expenses.find(e => e.id === editingExpenseId);
          const result = await ExpenseHandler.updateExpense(
            editingExpenseId,
            tripId,
            expenseData,
            members,
            expense,
            trip.currency
          );
          if (result.success) {
            setSnackbarMessage("Expense updated successfully!");
          } else {
            throw result.error;
          }
        } else {
          const result = await ExpenseHandler.addExpense(tripId, expenseData, members, trip);
          if (result.success) {
            setSnackbarMessage("Expense added successfully!");
          } else {
            throw result.error;
          }
        }
        setSnackbarVisible(true);
        closeAddExpenseModal();
      } catch (err: any) {
        if (err.message === ErrorType.MAX_EXPENSES_FREE_USER) {
          setSnackbarMessage("Max expenses per day per trip reached. Please upgrade to premium to add more expenses or wait for the next day.");
          setSnackbarVisible(true);
        } else if (err.message === ErrorType.MAX_EXPENSES_PREMIUM_USER) {
          setSnackbarMessage("Upgrade one of your users to premium to add more expenses or wait for the next day.");
          setSnackbarVisible(true);
        } else {
          console.error(err);
          setSnackbarMessage(`Error saving expense: ${err.message}`);
          setSnackbarVisible(true);
          throw err;
        }
      }
    },
    [tripId, trip, closeAddExpenseModal, members, expenses]
  );

  // Handle edit expense (moved from TripHandler)
  const handleEditExpense = useCallback(
    (expenseToEdit: Expense) => openAddExpenseModal(expenseToEdit, true),
    [openAddExpenseModal]
  );
  
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleEditExpenseLocal = useCallback(async (expense: Expense) => {
    console.log(`Edit requested for expense: ${expense.id}`);
    try {
      await handleEditExpense(expense);
    }
    catch (err) {
      console.error("Failed to edit expense:", err);
      setSnackbarMessage(`Error: ${err instanceof Error ? err.message : 'Could not edit expense'}`);
      setSnackbarVisible(true);
    }
  }, [handleEditExpense]);


  const handleDeleteExpense = async (id: string) => {
    // To add confirmation dialog here
    try {
      const expenseToDelete = expenses.find(e => e.id === id);
      if (!expenseToDelete) {
        setSnackbarMessage('Expense not found.');
        setSnackbarVisible(true);
        return;
      }
      const result = await ExpenseHandler.deleteExpense(tripId, id, expenseToDelete, trip);
      if (result.success) {
        setSnackbarMessage('Expense deleted.');
        setSnackbarVisible(true);

        if(expandedId === id) {
          setExpandedId(null);
        }
      } else {
        throw result.error;
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
        onPress={() => openAddExpenseModal(null, false)}
        style={sectionStyles.actionButton}
      >
        Add Expense
      </Button>

      <AddExpenseModal
        visible={addExpenseModalVisible}
        onDismiss={closeAddExpenseModal}
        onSubmit={handleAddOrUpdateExpenseSubmit}
        members={members}
        tripId={tripId}
        initialData={initialExpenseData}
        editingExpenseId={editingExpenseId}
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