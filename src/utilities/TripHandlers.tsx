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
  profiles: Record<string,string>;
  activityToDeleteId: string | null;
  openAddExpenseModal: (d: Partial<Expense> | null, isEditing?: boolean) => void;
  closeAddExpenseModal: () => void;
  setSnackbarMessage: (m: string) => void;
  setSnackbarVisible: (v: boolean) => void;
}

export function useTripHandlers({
  tripId,
  trip,
  profiles,
  activityToDeleteId,
  openAddExpenseModal,
  closeAddExpenseModal,
  setSnackbarMessage,
  setSnackbarVisible,
}: UseTripHandlersParams) {
  const { user } = useUser();
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
    async (memberIdToRemove: string) => {
      if (!tripId || !trip?.members?.[memberIdToRemove]) {
        setSnackbarMessage("Cannot remove member: Data missing.");
        setSnackbarVisible(true);
        return;
      }
      const name = profiles[memberIdToRemove];
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
    [tripId, trip, profiles]
  );

  const handleAddOrUpdateExpenseSubmit = useCallback(
    async (expenseData: Expense, editingExpenseId: string | null) => {
      if (!tripId) throw new Error("Trip ID is missing");
      const members = trip.members;
      if (!members) throw new Error("Trip members not available");

      try {
        if (editingExpenseId) {
          await updateExpenseAndRecalculateDebts(
            tripId,
            editingExpenseId,
            expenseData,
            members,
            profiles
          );
          setSnackbarMessage("Expense updated successfully!");
        } else {
          await addExpenseAndCalculateDebts(tripId, expenseData, members, profiles);
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
    (expenseToEdit: Expense) => openAddExpenseModal(expenseToEdit, true),
    [openAddExpenseModal]
  );

  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      if (!tripId) return;
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

  return {
    handleAddMember,
    handleRemoveMember,
    handleAddOrUpdateExpenseSubmit,
    handleEditExpense,
    handleDeleteActivity,
    handleAddExpenseFromActivity,
    handleLeaveTrip,
    handleDeleteTrip: () => {
      setIsDeletingTrip(true);
      deleteTripAndRelatedData(tripId)
        .then(() => {
          setSnackbarMessage("Trip deleted.");
          setSnackbarVisible(true);
          router.push("/");
        })
        .catch((e) => {
          console.error(e);
          setSnackbarMessage("Failed to delete trip.");
          setSnackbarVisible(true);
        })
        .finally(() => setIsDeletingTrip(false));
    },
    isDeletingTrip,
  };
}
