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
  const currentUserId = user?.id;

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "expenses" | "settle" | "activities" | "receipts" | "invite" | "leaderboard"
  >("overview");

  // Get trip from UserTripsContext
  const { trips, loading: tripsLoading, tripMembersMap, error: tripsError, expensesByTripId } = useUserTripsContext();
  const trip = trips.find(t => t.tripId === tripId) as TripsTableDDB | undefined;

  const { payments, loading: paymentsLoading, error: paymentsError } = useTripPaymentsContext();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  

  const loading = tripsLoading || paymentsLoading;
  const [showChooseModal, setShowChooseModal] = useState(false);

  // member id, MemberDDB
  const safeMembers = tripMembersMap[tripId] ?? {};




  // Use the new hook for handling activity deletion
  const handleDeleteActivity = useHandleDeleteActivity(
    tripId!,
    setSnackbarMessage,
    setSnackbarVisible
  );


  

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
      if (!currentUsername || !currentUserId) {
        throw new Error('User not logged in or missing username');
      }

      const newMember: MemberDDB = {
        userId: currentUserId,
        username: currentUsername,
        tripId: tripId,
        amtLeft: 0,
        budget: 0,
        owesTotalMap: {},
        addMemberType: AddMemberType.INVITE_LINK,
        receiptsCount: 0,
        createdAt: user.createdAt.toString(),
        updatedAt: user.updatedAt.toString(),
        currency: 'USD',
      };

      await TripHandler.addMember(
        trip,
        newMember,
      );
      setShowChooseModal(false);
      setSnackbarMessage('Successfully` joined trip');
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
              destination={trip.destinationName}
            />

            <TabBar
              selectedTab={selectedTab}
              onTabSelect={setSelectedTab}
            />

            {selectedTab === "overview" && (
              <OverviewTab
                tripId={tripId!}
                setSnackbarMessage={setSnackbarMessage}
                setSnackbarVisible={setSnackbarVisible}
              />
            )}

            {selectedTab === "expenses" && (
              <ExpensesSection tripId={tripId!}/>
            )}

            {selectedTab === "settle" && (
              <SettleUpSection
                tripId={tripId!}
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
                trip={trip}
                tripId={tripId}
              />
            )}

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
