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
import TabBar from "@/src/components/Common/TabBar";
import BudgetDialog from "@/src/components/Trip/Overview/components/BudgetDialog";
import ErrorStates from "@/src/components/Common/ErrorStates";
import OverviewTab from "@/app/screens/trip/OverviewTab";
import ExpensesSection from "@/app/screens/trip/ExpenseSection";
import SettleUpSection from "@/app/screens/trip/Settleup";
import ActivityVotingSection from "@/app/screens/trip/ActivityVotingSection";
import ReceiptSection from "@/app/screens/trip/ReceiptSection";
import InviteSection from "@/src/components/Trip/Invite/InviteSection";
import ChooseExistingOrNew from "@/src/components/Common/ChooseExistingOrNew";

import { calculateNextPayer } from "@/src/components/Trip/Expenses/utilities/expenseService";
import { useTripHandlers } from "@/src/utilities/TripHandlers";
import { useTripState } from "@/src/hooks/useTripState";
import { AddMemberType } from "@/src/types/DataTypes";
import TripLeaderboard from "@/app/screens/trip/TripLeaderboard";
import { TripExpensesProvider } from '@/src/context/TripExpensesContext';
import type { FirestoreTrip, Member, Debt } from '@/src/types/DataTypes';
import { SUPPORTED_CURRENCIES } from '@/src/types/DataTypes';
import { useHandleDeleteActivity } from '@/src/components/Trip/Activity/utilities/ActivityUtilities';

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

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "expenses" | "settle" | "activities" | "receipts" | "invite" | "leaderboard"
  >("overview");

  // Get trip from UserTripsContext
  const { trips, loading: tripsLoading, error: tripsError } = useUserTripsContext();
  const trip = trips.find(t => t.id === tripId) as FirestoreTrip | undefined;
  
  // Get expenses from TripExpensesContext
  const { expenses, loading: expensesLoading, error: expensesError } = useTripExpensesContext();
  const { payments, loading: paymentsLoading, error: paymentsError } = useTripPaymentsContext();

  // Compose loading and error states
  const loading = tripsLoading || expensesLoading || paymentsLoading;
  const dataError = tripsError || expensesError || paymentsError;
  const [showChooseModal, setShowChooseModal] = useState(false);

  // When passing members, cast as Record<string, Member> and cast currency and addMemberType fields, and fix owesTotalMap
  const safeMembers: Record<string, Member> = Object.fromEntries(
    Object.entries(trip?.members || {}).map(([k, v]) => [k, toMember(v)])
  );


  const {
    activityToDeleteId,
    snackbarVisible,
    snackbarMessage,    hasLeftTrip,
    budgetDialogVisible,
    newBudgetInput,
    setNewBudgetInput,
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
    handleLeaveTrip,
    handleDeleteTrip,
    handleClaimMockUser,
    isDeletingTrip,
  } = useTripHandlers({
    tripId: tripId!,
    activityToDeleteId,
    setSnackbarMessage: (message) => {
      setSnackbarVisible(true);
      setSnackbarMessage(message);
    },
    setSnackbarVisible,
  });

  // Use the new hook for handling activity deletion
  const handleDeleteActivity = useHandleDeleteActivity(
    tripId!,
    setSnackbarMessage,
    setSnackbarVisible
  );

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
                onClaimMockUser={handleClaimMockUser}
                tripId={tripId}
                tripCurrency={trip.currency}
              />
            )}

            {selectedTab === "expenses" && (
              <ExpensesSection
                tripId={tripId!}
                activityToDeleteId={activityToDeleteId}
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
                onDeleteActivity={handleDeleteActivity}
                onAddExpenseFromActivity={}
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
