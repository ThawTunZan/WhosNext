// src/screens/TripDetails/ExpensesSection.tsx
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { Button, Snackbar, Chip } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/app/styles/section_comp_styles';

import { useExpenses } from '../../src/hooks/useExpenses';
import { addExpenseAndCalculateDebts, deleteExpense } from '../../src/services/expenseService';
import ExpenseList from '@/app/trip/components/ItemList/ExpenseList';
import AddExpenseModal from '@/src/components/AddExpenseModal'; 
import { ExpensesSectionProps, Expense } from '@/src/types/DataTypes'; 
import { MemberProfilesProvider, useMemberProfiles } from "@/src/context/MemberProfilesContext";
import { SearchBar } from '@/app/trip/components/SearchBar';
import { BaseSection } from '@/app/common_components/BaseSection';
import { CommonModal } from '@/app/common_components/CommonModal';

const ExpensesSection = ({ tripId, members, onAddExpensePress, onEditExpense, nextPayerId }: ExpensesSectionProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { expenses, isLoading, error: fetchError } = useExpenses(tripId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    try {
      await addExpenseAndCalculateDebts(tripId, expenseData, members, profiles);
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
      await deleteExpense(tripId, id, members, profiles); 
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
      {nextPayerId && (
        <Chip
          icon="account-arrow-right"
          style={[sectionStyles.nextPayerChip, { backgroundColor: theme.colors.surfaceVariant }]}
          textStyle={[sectionStyles.nextPayerChipText, { color: theme.colors.text }]}
        >
          Next Payer: {profiles[nextPayerId]}
        </Chip>
      )}
    </>
  );

  return (
    <BaseSection
      title="Expenses"
      icon="🧾"
      loading={isLoading && expenses.length === 0}
      error={fetchError}
    >
      {renderHeader()}
      
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

      <CommonModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        title="Add New Expense"
      >
        <AddExpenseModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          onSubmit={handleAddExpenseSubmit}
          members={members}
          tripId={tripId}
        />
      </CommonModal>

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