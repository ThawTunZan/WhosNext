// app/trip/[id].tsx

import { useCallback, useState } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Snackbar, Portal, Button, ActivityIndicator } from "react-native-paper";
import { useUserTripsContext } from '@/src/context/UserTripsContext';
import { TripPaymentsProvider, useTripPaymentsContext } from '@/src/context/TripPaymentsContext';
import { useUser } from "@clerk/clerk-expo";
import TripHeader from "@/src/components/TripHeader";
import TabBar from "@/src/components/Common/TabBar";
import BudgetDialog from "@/src/components/Trip/Overview/components/BudgetDialog";
import OverviewTab from "@/app/screens/trip/OverviewTab";
import ExpensesSection from "@/app/screens/trip/ExpenseSection";
import SettleUpSection from "@/app/screens/trip/Settleup";
import ActivityVotingSection from "@/app/screens/trip/ActivityVotingSection";
import ReceiptSection from "@/app/screens/trip/ReceiptSection";
import InviteSection from "@/src/components/Trip/Invite/InviteSection";
import ChooseExistingOrNew from "@/src/components/Common/ChooseExistingOrNew";

import { TripHandler } from "@/src/utilities/TripHandler";
import { AddMemberType } from "@/src/types/DataTypes";
import TripLeaderboard from "@/app/screens/trip/TripLeaderboard";
import type { TripsTableDDB, MemberDDB, Debt } from '@/src/types/DataTypes';
import { SUPPORTED_CURRENCIES } from '@/src/types/DataTypes';
import { useHandleDeleteActivity } from '@/src/components/Trip/Activity/utilities/ActivityUtilities';
import { claimMockUser, updatePersonalBudget } from "@/src/utilities/TripUtilities";

export default function TripPageWrapper() {
  const { id: routeIdParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;

  return (
      <TripPaymentsProvider tripId={tripId}>
        <TripPage tripId={tripId} />
      </TripPaymentsProvider>
  );
}

function TripPage({ tripId }) {
  const { user } = useUser();
  const currentUsername = user?.username;

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "expenses" | "settle" | "activities" | "receipts" | "invite" | "leaderboard"
  >("overview");

  // Get trip from UserTripsContext
  const { trips, loading: tripsLoading, tripMembersMap, error: tripsError, expensesByTripId } = useUserTripsContext();
  const trip = trips.find(t => t.id === tripId) as TripsTableDDB | undefined;

  const { payments, loading: paymentsLoading, error: paymentsError } = useTripPaymentsContext();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState<string>("");

  const loading = tripsLoading || paymentsLoading;
  const [showChooseModal, setShowChooseModal] = useState(false);

  // member id, MemberDDB
  const safeMembers = (tripMembersMap[tripId] ?? {}) as Record<string, MemberDDB>;




  // Use the new hook for handling activity deletion
  const handleDeleteActivity = useHandleDeleteActivity(
    tripId!,
    setSnackbarMessage,
    setSnackbarVisible
  );

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

  // When accessing claimCode, use optional chaining and type guard
  const handleSelectMockMember = async (memberId: string) => {
    try {
      const member: any = safeMembers[memberId];
      if (!member?.claimCode) {
        throw new Error('No claim code found for this member');
      }
      await TripHandler.handleClaimMockUser(tripId, memberId, member.claimCode, currentUsername, expensesByTripId[tripId], trip);
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
      await TripHandler.addMember(
        tripId,
        user.username || user.fullName || user.primaryEmailAddress?.emailAddress || 'Unknown User',
        trip,
        safeMembers,
        {
          budget: 0,
          addMemberType: AddMemberType.INVITE_LINK,
          currency: 'USD',
        }
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
              destination={trip.name}
            />

            <TabBar
              selectedTab={selectedTab}
              onTabSelect={setSelectedTab}
            />

            {selectedTab === "overview" && (
              <OverviewTab
                tripId={tripId!}
                onEditBudget={openBudgetDialog}
                setSnackbarMessage={setSnackbarMessage}
                setSnackbarVisible={setSnackbarVisible}
              />
            )}

            {selectedTab === "expenses" && (
              <ExpensesSection tripId={tripId!}/>
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
                  debts:  trip.debts,
                }}
                expenses={expensesByTripId[tripId]}
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
                currency={trip.currency || 'USD'}
              />
            </Portal>

            <ChooseExistingOrNew
              visible={showChooseModal}
              onDismiss={() => setShowChooseModal(false)}
              mockMembers={safeMembers as Record<string, MemberDDB>}
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
