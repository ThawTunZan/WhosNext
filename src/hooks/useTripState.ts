import { useState, useCallback } from 'react';
import { updatePersonalBudget } from '@/src/utilities/TripUtilities';
import { Expense } from '@/src/types/DataTypes';

export function useTripState(tripId: string, currentUserId: string) {
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "expenses" | "settle" | "activities" | "receipts" | "invite"
  >("overview");
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [initialExpenseData, setInitialExpenseData] = useState<Partial<Expense> | null>(null);
  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [hasLeftTrip, setHasLeftTrip] = useState(false);
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState<string>("");

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
    setActivityToDeleteId(null);
    setEditingExpenseId(null);
  }, []);

  const openBudgetDialog = useCallback(() => {
    setBudgetDialogVisible(true);
  }, []);

  const submitBudgetChange = useCallback(async () => {
    const parsed = parseFloat(newBudgetInput);
    if (isNaN(parsed) || parsed < 0) {
      setSnackbarMessage("Please enter a valid number.");
      setSnackbarVisible(true);
      return;
    }
    try {
      await updatePersonalBudget(tripId, currentUserId, parsed);
      setSnackbarMessage("Personal budget updated!");
      setSnackbarVisible(true);
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.message || "Failed to update budget.");
      setSnackbarVisible(true);
    } finally {
      setBudgetDialogVisible(false);
    }
  }, [newBudgetInput, tripId, currentUserId]);

  return {
    selectedTab,
    setSelectedTab,
    addExpenseModalVisible,
    initialExpenseData,
    activityToDeleteId,
    snackbarVisible,
    snackbarMessage,
    editingExpenseId,
    hasLeftTrip,
    budgetDialogVisible,
    newBudgetInput,
    setNewBudgetInput,
    openAddExpenseModal,
    closeAddExpenseModal,
    openBudgetDialog,
    submitBudgetChange,
    setBudgetDialogVisible,
    setSnackbarVisible,
    setSnackbarMessage,
    setHasLeftTrip,
    setActivityToDeleteId,
  };
} 