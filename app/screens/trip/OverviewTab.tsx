import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { AddMemberType, MemberDDB } from '@/src/types/DataTypes';
import BudgetSummaryCard from '@/src/components/Trip/Overview/components/BudgetSummaryCard';
import PersonalBudgetCard from '@/src/components/Trip/Overview/components/PersonalBudgetCard';
import MemberList from '@/src/components/Common/MemberList';
import { UpgradeTripButton } from '@/src/components';
import { useUserTripsContext } from '@/src/context/UserTripsContext';
import { TripHandler } from '@/src/utilities/TripHandler';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import BudgetDialog from '@/src/components/Trip/Overview/components/BudgetDialog';
import { v4 as uuidv4 } from 'uuid';


type OverviewTabProps = {
  tripId: string;
  setSnackbarMessage: (message: string) => void;
  setSnackbarVisible: (visible: boolean) => void;
};

export default function OverviewTab({
  tripId,
  setSnackbarMessage,
  setSnackbarVisible,
}: OverviewTabProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { trips, tripMembersMap, expensesByTripId } = useUserTripsContext();
  const { user } = useUser();
  const router = useRouter();
  const currTripMembers = tripMembersMap[tripId] ?? {};
  const expenses = expensesByTripId[tripId] ?? [];
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);

  const currentUserId = user?.id ?? null;

  const curr_member = useMemo(() => {
    if (!currentUserId) return undefined;
    return currTripMembers[currentUserId];
  }, [currTripMembers, currentUserId]);

  const trip = useMemo(() => trips.find(trip => trip.tripId === tripId), [tripId, trips]);

  const [isDeletingTrip, setIsDeletingTrip] = useState(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddMember = async (memberUserId: string, memberUsername: string, remaining:number, budget: number, currency: string, addMemberType: AddMemberType) => {
    if (!trip) return;

    let finalUserId = memberUserId;
    if (addMemberType === AddMemberType.MOCK) {
      finalUserId = `mock-${uuidv4()}`;
    }

    if (currTripMembers?.[finalUserId]) {
      showSnackbar("Member already exists in the trip.");
      return;
    }

    const MemberData: MemberDDB = {
      userId: finalUserId,
      username: memberUsername,
      tripId: tripId,
      amtLeft: remaining,
      budget: budget,
      owesTotalMap: {},
      addMemberType: addMemberType,
      receiptsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency,
    };
    const result = await TripHandler.addMember(trip, MemberData);

    if (result.success) {
      showSnackbar(`${memberUsername} ${addMemberType === "mock" ? 'added as a mock member!' : 'added to the trip!'}`);
    } else {
      console.error('[OverviewTab] Error adding member:', result.error);
      showSnackbar(`Error adding member: ${result.error?.message || 'Unknown error'}`);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currTripMembers?.[memberId]) {
      setSnackbarMessage("Cannot remove member: Data missing.");
      setSnackbarVisible(true);
      return;
    }

    const canRemove = TripHandler.canBeRemoved(memberId, expenses, trip);
    if (!canRemove) {
      setSnackbarMessage("Cannot remove member: They are still part of an expense, activity, receipt, or debt.");
      setSnackbarVisible(true);
      return;
    }

    const result = await TripHandler.removeMember(tripId, memberId, curr_member, expenses, trip);
    if (result.success) {
      setSnackbarMessage(`${memberId} removed.`);
      setSnackbarVisible(true);
    } else {
      setSnackbarMessage(`Error removing member: ${result.error?.message || 'Unknown error'}`);
      setSnackbarVisible(true);
    }
  };

  const handleLeaveTrip = async () => {
    // ⚡️ FIX: check membership by userId instead of username
    const isMember = !!currTripMembers[currentUserId];
    if (!isMember || !currentUserId) return;

    const result = await TripHandler.leaveTrip(tripId, currentUserId, curr_member);
    if (result.success) {
      setSnackbarMessage("You left the trip.");
      setSnackbarVisible(true);
      setTimeout(() => router.replace("/"), 1000);
    } else {
      setSnackbarMessage(`Failed to leave trip: ${result.error?.message || 'Unknown error'}`);
      setSnackbarVisible(true);
    }
  };

  const handleDeleteTrip = async () => {
    setIsDeletingTrip(true);
    const result = await TripHandler.deleteTrip(tripId);
    if (result.success) {
      setSnackbarMessage("Trip deleted.");
      setSnackbarVisible(true);
      router.push("/");
    } else {
      setSnackbarMessage("Failed to delete trip.");
      setSnackbarVisible(true);
    }
    setIsDeletingTrip(false);
  };

  const handleClaimMockUser = async (mockUserId: string, claimCode: string) => {
    if (!currentUserId) return;

    const result = await TripHandler.handleClaimMockUser(tripId, mockUserId, claimCode, currentUserId, expenses, trip);
    if (result.success) {
      setSnackbarMessage("Successfully claimed mock profile!");
      setSnackbarVisible(true);
    } else {
      setSnackbarMessage(`Error claiming profile: ${result.error?.message || 'Unknown error'}`);
      setSnackbarVisible(true);
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background }
        ]}
      >
        <UpgradeTripButton style={styles.upgradeButton} />

        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            👥 Members
          </Text>
          <MemberList
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onClaimMockUser={handleClaimMockUser}
            tripId={tripId}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💰 Budget
          </Text>
          <BudgetSummaryCard
            members={currTripMembers}
            totalBudget={trip?.totalBudget || 0}
            totalAmtLeft={trip?.totalAmtLeft || 0}
            tripCurrency={trip?.currency || 'USD'}
          />

          {curr_member && (
            <PersonalBudgetCard
              member={curr_member}
              onEditBudget={() => setBudgetDialogVisible(true)}
            />
          )}

          <Button
            mode="outlined"
            icon="video"
            style={styles.adButton}
            onPress={() => alert('Ad watched! Increase daily limit here.')}
          >
            Watch Ad to Increase Daily Limit
          </Button>
        </View>

        <View style={styles.actionButtons}>
          {trip?.createdBy === currentUserId && (
            <Button
              mode="contained"
              onPress={handleDeleteTrip}
              loading={isDeletingTrip}
              style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
              icon="delete"
            >
              Delete Trip
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={handleLeaveTrip}
            icon="exit-to-app"
            style={styles.leaveButton}
          >
            Leave Trip
          </Button>
        </View>
      </ScrollView>

      <BudgetDialog
        currentUsername={currentUserId ?? ''}
        tripId={tripId}
        currency={trip?.currency || 'USD'}
        visible={budgetDialogVisible}
        onDismiss={() => setBudgetDialogVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    marginVertical: 16,
  },
  actionButtons: {
    marginTop: 8,
    gap: 12,
  },
  deleteButton: {
    marginBottom: 8,
    backgroundColor: '#B00020',
  },
  leaveButton: {
    borderWidth: 2,
  },
  adButton: {
    marginTop: 12,
  },
});
