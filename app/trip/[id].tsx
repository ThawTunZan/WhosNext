// app/trip/[id].tsx

import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Snackbar, Portal, Button, ActivityIndicator } from "react-native-paper";

import { useUserTripsContext } from '@/src/context/UserTripsContext';
import { useTripExpensesContext } from '@/src/context/TripExpensesContext';
import { TripPaymentsProvider, useTripPaymentsContext } from '@/src/context/TripPaymentsContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

import { useUser } from "@clerk/clerk-expo";

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
import TripLeaderboard from "../(sections)/TripLeaderboard";
import { TripExpensesProvider } from '@/src/context/TripExpensesContext';
import type { FirestoreTrip, Member, Debt } from '@/src/types/DataTypes';
import { SUPPORTED_CURRENCIES } from '@/src/types/DataTypes';

export default function TripPageWrapper() {
  const { id: routeIdParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;

  return (
    <TripExpensesProvider tripId={tripId}>
      <TripPaymentsProvider tripId={tripId}>
        <TripPage tripId={tripId} />
      </TripPaymentsProvider>
    </TripExpensesProvider>
  );
}

function TripPage({ tripId }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUsername = user?.username;
  // Get trip from UserTripsContext
  const { trips, loading: tripsLoading, error: tripsError } = useUserTripsContext();
  const trip = trips.find(t => t.id === tripId) as FirestoreTrip | undefined;
  
  // Get expenses from TripExpensesContext
  const { expenses, loading: expensesLoading, error: expensesError } = useTripExpensesContext();
  const { payments, loading: paymentsLoading, error: paymentsError } = useTripPaymentsContext();

  // Compose loading and error states
  const loading = tripsLoading || expensesLoading || paymentsLoading;
  const dataError = tripsError || expensesError || paymentsError;

  const [nextPayer, setNextPayer] = React.useState<string | null>(null);
  const [showChooseModal, setShowChooseModal] = useState(false);

  // When passing members, cast as Record<string, Member> and cast currency and addMemberType fields, and fix owesTotalMap
  const safeMembers: Record<string, Member> = Object.fromEntries(
    Object.entries(trip?.members || {}).map(([k, v]) => [k, toMember(v)])
  );

  const nextPayerParams = React.useMemo(() => ({
    members: safeMembers,
    currency: trip?.currency || 'USD'
  }), [safeMembers, trip?.currency]);

  React.useEffect(() => {
    const updateNextPayer = async () => {
      if (nextPayerParams.members) {
        const nextPayerId = await calculateNextPayer(
          nextPayerParams.members,
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
  } = useTripState(tripId!, currentUsername!);

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
    activityToDeleteId,
    openAddExpenseModal,
    closeAddExpenseModal,
    setSnackbarMessage: (message) => {
      setSnackbarVisible(true);
      setSnackbarMessage(message);
    },
    setSnackbarVisible,
  });


  // Helper to create a valid OwesTotalMap
  const makeOwesTotalMap = (map: any): Record<string, number> => {
    const result: Record<string, number> = {
      USD: 0, EUR: 0, GBP: 0, JPY: 0, CNY: 0, SGD: 0
    };
    for (const cur of SUPPORTED_CURRENCIES) {
      if (map && typeof map[cur] === 'number') result[cur] = map[cur];
    }
    return result;
  };
  // Helper to convert Firestore member to Member type
  function toMember(v: any): Member {
    return {
      username: v.username,
      budget: typeof v.budget === 'number' ? v.budget : 0,
      amtLeft: typeof v.amtLeft === 'number' ? v.amtLeft : 0,
      currency: v.currency,
      addMemberType: Object.values(AddMemberType).includes(v.addMemberType) ? v.addMemberType as AddMemberType : AddMemberType.INVITE_LINK,
      claimCode: v.claimCode,
      owesTotalMap: v.owesTotalMap,
      receiptsCount: typeof v.receiptsCount === 'number' ? v.receiptsCount : 0,
    };
  }

  // When accessing claimCode, use optional chaining and type guard
  const handleSelectMockMember = async (memberId: string) => {
    try {
      const member = safeMembers[memberId];
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
        user.username || user.fullName || user.primaryEmailAddress?.emailAddress || 'Unknown User',
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
          tripExists={!!trip || !!trip}
        />

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        ) : !trip ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: 'gray' }}>Trip not found.</Text>
          </View>
        ) : (
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
                usernames={Object.fromEntries(Object.entries(safeMembers as Record<string, Member>).map(([k, v]) => [k, v.username || k]))}
                totalBudget={trip.totalBudget}
                totalAmtLeft={trip.totalAmtLeft}
                currentUsername={currentUsername}
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
                onAddExpensePress={() => openAddExpenseModal(null, false)}
                onEditExpense={handleEditExpense}
                nextPayerName={nextPayer}
              />
            )}

            {selectedTab === "settle" && (
              <SettleUpSection
                debts={Array.isArray(trip.debts) ? trip.debts : []}
                tripId={tripId!}
                tripCurrency={trip.currency}
              />
            )}

            {selectedTab === "activities" && (
              <ActivityVotingSection
                tripId={tripId!}
                onAddExpenseFromActivity={handleAddExpenseFromActivity}
                onDeleteActivity={handleDeleteActivity}
              />
            )}

            {selectedTab === "receipts" && <ReceiptSection tripId={tripId!} />}

            {selectedTab === "invite" && <InviteSection tripId={tripId!} />}

            {selectedTab === "leaderboard" && (
              <TripLeaderboard
                trip={{
                  ...trip,
                  members: safeMembers,
                  currency: trip.currency,
                  premiumStatus: trip.premiumStatus ?? 'free',
                  debts:  trip.debts,
                }}
                expenses={expenses}
                payments={payments}
              />
            )}

            <Portal>
              <BudgetDialog
                visible={budgetDialogVisible}
                onDismiss={() => setBudgetDialogVisible(false)}
                value={newBudgetInput}
                onChangeValue={setNewBudgetInput}
                onSubmit={submitBudgetChange}
                currency={safeMembers[currentUsername]?.currency || 'USD'}
              />
            </Portal>

            <AddExpenseModal
              visible={addExpenseModalVisible}
              onDismiss={closeAddExpenseModal}
              onSubmit={handleAddOrUpdateExpenseSubmit}
              members={safeMembers as Record<string, Member>}
              tripId={tripId!}
              initialData={initialExpenseData}
              editingExpenseId={editingExpenseId}
              suggestedPayerName={nextPayer}
              trip={trip}
              onWatchAd={() => {
                // TODO: Implement ad watching functionality
                console.log('Watch ad functionality not implemented yet');
              }}
            />

            <ChooseExistingOrNew
              visible={showChooseModal}
              onDismiss={() => setShowChooseModal(false)}
              mockMembers={safeMembers as Record<string, Member>}
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
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
});
