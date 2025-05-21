// src/handlers/TripHandler.tsx
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import {
  addMemberToTrip,
  leaveTripIfEligible,
  removeMemberFromTrip,
  deleteTripAndRelatedData,
  updatePersonalBudget,
} from "@/src/services/TripUtilities";
import {
  addExpenseAndCalculateDebts,
  updateExpenseAndRecalculateDebts,
} from "@/src/services/expenseService";
import { deleteProposedActivity } from "@/src/services/ActivityUtilities";
import type { Expense, ProposedActivity } from "@/src/types/DataTypes";

interface UseTripHandlersParams {
  tripId: string;
  trip: any;
  activityToDeleteId: string | null;
  closeAddExpenseModal: () => void;
  openAddExpenseModal: (initialData: Partial<Expense> | null, isEditing?: boolean) => void;
  setSnackbarMessage: (msg: string) => void;
  setSnackbarVisible: (v: boolean) => void;
}

export function useTripHandlers({
  tripId,
  trip,
  activityToDeleteId,
  closeAddExpenseModal,
  openAddExpenseModal,
  setSnackbarMessage,
  setSnackbarVisible,
}: UseTripHandlersParams) {
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = user.id;
  const router = useRouter();
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);

  const handleAddMember = useCallback(
    async (memberId: string, name: string, budget: number) => {
      if (!tripId) return;
      try {
        await addMemberToTrip(tripId, memberId, name, budget);
        setSnackbarMessage(`${name} added to the trip!`);
        setSnackbarVisible(true);
      } catch (err: any) {
        console.error(err);
        setSnackbarMessage(`Error adding member: ${err.message}`);
        setSnackbarVisible(true);
      }
    },
    [tripId]
  );

  const handleRemoveMember = useCallback(
    async (memberIdToRemove: string, name: string) => {
      if (!tripId || !trip?.members?.[memberIdToRemove]) {
        setSnackbarMessage("Cannot remove member: Data missing.");
        setSnackbarVisible(true);
        return;
      }
      Alert.alert(
        "Remove Member",
        `Are you sure you want to remove ${name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeMemberFromTrip(
                  tripId,
                  memberIdToRemove,
                  trip.members[memberIdToRemove]
                );
                setSnackbarMessage(`${name} removed.`);
                setSnackbarVisible(true);
              } catch (err: any) {
                console.error(err);
                setSnackbarMessage(`Error removing member: ${err.message}`);
                setSnackbarVisible(true);
              }
            },
          },
        ]
      );
    },
    [tripId, trip]
  );

  const handleLeaveTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      await leaveTripIfEligible(
        tripId,
        currentUserId,
        trip.members[currentUserId]
      );
      setSnackbarMessage("You left the trip.");
      setSnackbarVisible(true);
      setTimeout(() => router.replace("/"), 1000);
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(`Failed to leave trip: ${err.message}`);
      setSnackbarVisible(true);
    }
  }, [tripId, currentUserId, trip, router]);

  const handleDeleteTrip = useCallback(async () => {
    setIsDeletingTrip(true);
    try {
      await deleteTripAndRelatedData(tripId);
      setSnackbarMessage("Trip deleted.");
      setSnackbarVisible(true);
      setTimeout(() => router.replace("/"), 1000);
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage("Failed to delete trip.");
      setSnackbarVisible(true);
    } finally {
      setIsDeletingTrip(false);
    }
  }, [tripId]);

  const handleAddOrUpdateExpenseSubmit = useCallback(
    async (expenseData: Expense, editingExpenseId: string | null) => {
      const members = trip.members;
      if (!members) throw new Error("Trip members not available");
      try {
        if (editingExpenseId) {
          await updateExpenseAndRecalculateDebts(
            tripId,
            editingExpenseId,
            expenseData,
            members
          );
          setSnackbarMessage("Expense updated successfully!");
        } else {
          await addExpenseAndCalculateDebts(tripId, expenseData, members);
          setSnackbarMessage("Expense added successfully!");
          if (activityToDeleteId) {
            await deleteProposedActivity(tripId, activityToDeleteId);
          }
        }
        setSnackbarVisible(true);
        closeAddExpenseModal();
      } catch (err: any) {
        console.error(err);
        setSnackbarMessage(`Error saving expense: ${err.message}`);
        setSnackbarVisible(true);
        throw err;
      }
    },
    [tripId, trip, activityToDeleteId, closeAddExpenseModal]
  );

  const handleEditExpense = useCallback(
    (expense: Expense) => openAddExpenseModal(expense, true),
    [openAddExpenseModal]
  );

  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      try {
        await deleteProposedActivity(tripId, activityId);
        setSnackbarMessage("Activity deleted.");
        setSnackbarVisible(true);
      } catch (err: any) {
        console.error(err);
        setSnackbarMessage(`Error deleting activity: ${err.message}`);
        setSnackbarVisible(true);
      }
    },
    [tripId]
  );

  const handleAddExpenseFromActivity = useCallback(
    (activity: ProposedActivity) =>
      openAddExpenseModal(
        { activityName: activity.name, paidAmt: activity.estCost ?? 0 },
        false
      ),
    [openAddExpenseModal]
  );

  return {
    handleAddMember,
    handleRemoveMember,
    handleLeaveTrip,
    handleDeleteTrip,
    handleAddOrUpdateExpenseSubmit,
    handleEditExpense,
    handleDeleteActivity,
    handleAddExpenseFromActivity,
    isDeletingTrip,
  };
}
