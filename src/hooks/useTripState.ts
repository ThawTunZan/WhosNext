import { useState, useCallback } from 'react';
import { updatePersonalBudget } from '@/src/utilities/TripUtilities';
import { Expense } from '@/src/types/DataTypes';

export function useTripState(tripId: string, currentUsername: string) {
  

  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [hasLeftTrip, setHasLeftTrip] = useState(false);
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState<string>("");

  

  const openBudgetDialog = useCallback(() => {
    setBudgetDialogVisible(true);
  }, []);

  const submitBudgetChange = useCallback(async (currency: string) => {
    const parsed = parseFloat(newBudgetInput);
    if (isNaN(parsed) || parsed < 0) {
      setSnackbarMessage("Please enter a valid number.");
      setSnackbarVisible(true);
      return;
    }
    try {
      await updatePersonalBudget(tripId, currentUsername, parsed, currency);
      setSnackbarMessage("Personal budget updated!");
      setSnackbarVisible(true);
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.message || "Failed to update budget.");
      setSnackbarVisible(true);
    } finally {
      setBudgetDialogVisible(false);
    }
  }, [newBudgetInput, tripId, currentUsername]);

  return {
    activityToDeleteId,
    snackbarVisible,
    snackbarMessage,
    hasLeftTrip,
    budgetDialogVisible,
    newBudgetInput,
    setNewBudgetInput,
    openBudgetDialog,
    submitBudgetChange,
    setBudgetDialogVisible,
    setSnackbarVisible,
    setSnackbarMessage,
    setHasLeftTrip,
    setActivityToDeleteId,
  };
} 