// app/trip/[id].tsx

import React from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Snackbar, Portal } from "react-native-paper";

import { useTripData } from "@/src/hooks/useTripData";
import { useUser } from "@clerk/clerk-expo";
import { MemberProfilesProvider, useMemberProfiles } from "@/src/context/MemberProfilesContext";

import TripHeader from "@/src/components/TripHeader";
import TabBar from "./components/TabBar";
import BudgetDialog from "./components/BudgetDialog";
import ErrorStates from "./components/ErrorStates";
import OverviewTab from "./components/OverviewTab";
import ExpensesSection from "../(sections)/ExpenseSection";
import SettleUpSection from "@/app/(sections)/Settleup";
import ActivityVotingSection from "../(sections)/ActivityVotingSection";
import ReceiptSection from "../(sections)/ReceiptSection";
import InviteSection from "../(sections)/InviteSection";
import AddExpenseModal from "@/src/components/AddExpenseModal";

import { calculateNextPayer } from "@/src/services/expenseService";
import { useTripHandlers } from "@/src/utilities/TripHandlers";
import { useTripState } from "@/src/hooks/useTripState";

export default function TripDetailPage() {
  const { id: routeIdParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;

  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = user?.id;

  const { trip, loading, error: dataError } = useTripData(tripId);
  const profiles = useMemberProfiles();

  const nextPayer = React.useMemo(
    () => calculateNextPayer(trip?.members || null, profiles),
    [trip?.members, profiles]
  );

  const {
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
    setHasLeftTrip,
    setActivityToDeleteId,
    setSnackbarMessage,
  } = useTripState(tripId!, currentUserId!);

  const {
    handleAddMember,
    handleRemoveMember,
    handleAddOrUpdateExpenseSubmit,
    handleEditExpense,
    handleDeleteActivity,
    handleAddExpenseFromActivity,
    handleLeaveTrip,
    handleDeleteTrip,
    handleClaimMockUser,
    isDeletingTrip,
  } = useTripHandlers({
    tripId: tripId!,
    trip: trip!,
    profiles,
    activityToDeleteId,
    openAddExpenseModal,
    closeAddExpenseModal,
    setSnackbarMessage: (message) => {
      setSnackbarVisible(true);
      setSnackbarMessage(message);
    },
    setSnackbarVisible,
  });

  return (
    <MemberProfilesProvider memberUids={Object.keys(trip?.members || {})}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.outerContainer}
      >
        <ErrorStates
          isLoaded={isLoaded}
          isSignedIn={isSignedIn}
          loading={loading}
          error={dataError}
          hasLeftTrip={hasLeftTrip}
          tripExists={!!trip}
        />

        {trip && (
          <>
            <TripHeader destination={trip.destination} />
            <TabBar selectedTab={selectedTab} onTabSelect={setSelectedTab} />

            {selectedTab === "overview" && (
              <OverviewTab
                members={trip.members}
                profiles={profiles}
                totalBudget={trip.totalBudget}
                totalAmtLeft={trip.totalAmtLeft}
                currentUserId={currentUserId!}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onEditBudget={openBudgetDialog}
                onLeaveTrip={handleLeaveTrip}
                onDeleteTrip={handleDeleteTrip}
                isDeletingTrip={isDeletingTrip}
                nextPayer={nextPayer}
                onClaimMockUser={handleClaimMockUser}
              />
            )}

            {selectedTab === "expenses" && (
              <ExpensesSection
                tripId={tripId!}
                members={trip.members}
                onAddExpensePress={() => openAddExpenseModal(null, false)}
                onEditExpense={handleEditExpense}
                nextPayerId={nextPayer}
              />
            )}

            {selectedTab === "settle" && (
              <SettleUpSection 
                debts={trip.debts} 
                members={trip.members} 
                tripId={tripId!} 
              />
            )}

            {selectedTab === "activities" && (
              <ActivityVotingSection
                tripId={tripId!}
                members={trip.members}
                onAddExpenseFromActivity={handleAddExpenseFromActivity}
                onDeleteActivity={handleDeleteActivity}
              />
            )}

            {selectedTab === "receipts" && <ReceiptSection tripId={tripId!} />}

            {selectedTab === "invite" && <InviteSection tripId={tripId!} />}

            <Portal>
              <BudgetDialog
                visible={budgetDialogVisible}
                onDismiss={() => setBudgetDialogVisible(false)}
                value={newBudgetInput}
                onChangeValue={setNewBudgetInput}
                onSubmit={submitBudgetChange}
              />
            </Portal>

            <AddExpenseModal
              visible={addExpenseModalVisible}
              onClose={closeAddExpenseModal}
              onSubmit={handleAddOrUpdateExpenseSubmit}
              members={trip.members}
              tripId={tripId!}
              initialData={initialExpenseData}
              editingExpenseId={editingExpenseId}
              suggestedPayerId={nextPayer}
            />

            <Snackbar
              visible={snackbarVisible}
              onDismiss={() => setSnackbarVisible(false)}
              duration={3000}
            >
              {snackbarMessage}
            </Snackbar>
          </>
        )}
      </KeyboardAvoidingView>
    </MemberProfilesProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
});
