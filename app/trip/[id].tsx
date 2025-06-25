// app/trip/[id].tsx

import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Snackbar, Portal, Button } from "react-native-paper";

import { useTripData } from "@/src/hooks/useTripData";
import { useUser } from "@clerk/clerk-expo";
import { MemberProfilesProvider, useMemberProfiles } from "@/src/context/MemberProfilesContext";

import TripHeader from "@/src/components/TripHeader";
import TabBar from "@/app/trip/components/TabBar";
import BudgetDialog from "@/src/TripSections/Overview/components/BudgetDialog";
import ErrorStates from "@/app/trip/components/ErrorStates";
import OverviewTab from "@/src/TripSections/Overview/components/OverviewTab";
import ExpensesSection from "@/app/(sections)/ExpenseSection";
import SettleUpSection from "@/app/(sections)/Settleup";
import ActivityVotingSection from "@/app/(sections)/ActivityVotingSection";
import ReceiptSection from "@/app/(sections)/ReceiptSection";
import InviteSection from "@/app/(sections)/InviteSection";
import AddExpenseModal from "@/src/TripSections/Expenses/components/AddExpenseModal";
import ChooseExistingOrNew from "@/app/trip/components/ChooseExistingOrNew";

import { calculateNextPayer } from "@/src/services/expenseService";
import { useTripHandlers } from "@/src/utilities/TripHandlers";
import { useTripState } from "@/src/hooks/useTripState";
import { AddMemberType } from "@/src/types/DataTypes";

export default function TripDetailPage() {
  const { id: routeIdParam, showChooseModal: showChooseModalParam } = useLocalSearchParams<{ 
    id?: string | string[]; 
    showChooseModal?: string;
  }>();
  const tripId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;

  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = user?.id;

  const { trip, loading, error: dataError } = useTripData(tripId);
  const profiles = useMemberProfiles();

  const [nextPayer, setNextPayer] = React.useState<string | null>(null);
  const [showChooseModal, setShowChooseModal] = useState(showChooseModalParam === 'true');

  const nextPayerParams = React.useMemo(() => ({
    members: trip?.members || null,
    profiles,
    currency: trip?.currency || 'USD'
  }), [trip?.members, profiles, trip?.currency]);

  React.useEffect(() => {
    const updateNextPayer = async () => {
      if (nextPayerParams.members && nextPayerParams.profiles) {
        const nextPayerId = await calculateNextPayer(
          nextPayerParams.members,
          nextPayerParams.profiles,
          nextPayerParams.currency
        );
        setNextPayer(nextPayerId);
      }
    };
    updateNextPayer();
  }, [nextPayerParams]);

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

  const handleSelectMockMember = async (memberId: string) => {
    try {
      const member = trip.members[memberId];
      if (!member?.claimCode) {
        throw new Error('No claim code found for this member');
      }
      await handleClaimMockUser(memberId, member.claimCode);
      setShowChooseModal(false);
      setSnackbarMessage('Successfully claimed mock profile');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error claiming mock profile:', error);
      setSnackbarMessage('Failed to claim mock profile');
      setSnackbarVisible(true);
    }
  };

  const handleJoinAsNew = async () => {
    try {
      await handleAddMember(
        user.id,
        user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Unknown User',
        0,
        'USD',
        AddMemberType.INVITE_LINK
      );
      setShowChooseModal(false);
      setSnackbarMessage('Successfully joined trip');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error joining as new member:', error);
      setSnackbarMessage('Failed to join trip');
      setSnackbarVisible(true);
    }
  };

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
            <TripHeader
              destination={trip.destination}
            />

            <TabBar
              selectedTab={selectedTab}
              onTabSelect={setSelectedTab}
            />

            {selectedTab === "overview" && (
              <OverviewTab
                members={trip.members}
                profiles={profiles}
                totalBudget={trip.totalBudget}
                totalAmtLeft={trip.totalAmtLeft}
                currentUserId={currentUserId}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onEditBudget={openBudgetDialog}
                onLeaveTrip={handleLeaveTrip}
                onDeleteTrip={handleDeleteTrip}
                isDeletingTrip={isDeletingTrip}
                nextPayer={nextPayer}
                onClaimMockUser={handleClaimMockUser}
                tripId={tripId}
                tripCurrency={trip.currency}
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
                tripCurrency={trip.currency}
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
                currency={trip.members[currentUserId]?.currency || 'USD'}
              />
            </Portal>

            <AddExpenseModal
              visible={addExpenseModalVisible}
              onDismiss={closeAddExpenseModal}
              onSubmit={handleAddOrUpdateExpenseSubmit}
              members={trip.members}
              tripId={tripId!}
              initialData={initialExpenseData}
              editingExpenseId={editingExpenseId}
              suggestedPayerId={nextPayer}
            />

            <ChooseExistingOrNew
              visible={showChooseModal}
              onDismiss={() => setShowChooseModal(false)}
              mockMembers={trip.members || {}}
              onSelectMockMember={handleSelectMockMember}
              onJoinAsNew={handleJoinAsNew}
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
