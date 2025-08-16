import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Member, AddMemberType, TripsTableDDB } from '@/src/types/DataTypes';
import BudgetSummaryCard from '@/src/components/Trip/Overview/components/BudgetSummaryCard';
import PersonalBudgetCard from '@/src/components/Trip/Overview/components/PersonalBudgetCard';
import MemberList from '@/src/components/Common/MemberList';
import NextPayerCard from '@/src/components/Common/NextPayerCard';
import { UpgradeTripButton } from '@/src/components';
import { useUserTripsContext } from '@/src/context/UserTripsContext';
import { TripHandler } from '@/src/utilities/TripHandler';
import { useTripExpensesContext } from '@/src/context/TripExpensesContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
//import { showRewardedAd } from '@/CommonComponents/AdMob';

type OverviewTabProps = {
  tripId: string;
  onEditBudget: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarVisible: (visible: boolean) => void;
};

export default function OverviewTab({
  tripId,
  onEditBudget,
  setSnackbarMessage,
  setSnackbarVisible,
}: OverviewTabProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { trips, tripMembersMap } = useUserTripsContext();
  const { expenses } = useTripExpensesContext();
  const { user } = useUser();
  const router = useRouter();
  const currTripMembers = tripMembersMap[tripId]

  const currentUsername = user?.username;
  const curr_member = currTripMembers[tripId]?.find(m => m.username === currentUsername);

  // Memoize trip and members
  const trip = useMemo(() => trips.find(trip => trip.id === tripId), [tripId, trips]);

  const [isDeletingTrip, setIsDeletingTrip] = useState(false);

  // Helper for showing snackbar
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Handler functions using TripHandler
  const handleAddMember = async (memberName: string, budget: number, currency: string, addMemberType: AddMemberType) => {
    if (!trip) return;
    
    const result = await TripHandler.addMember(tripId, memberName, trip, {
      budget,
      addMemberType,
      currency,
    });
    
    if (result.success) {
      showSnackbar(`${memberName} ${addMemberType === "mock" ? 'added as a mock member!' : 'added to the trip!'}`);
    } else {
      showSnackbar(`Error adding member: ${result.error?.message || 'Unknown error'}`);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!trip?.members?.[memberId]) {
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
    if (!trip?.members?.[currentUsername]) return;
    
    
    const result = await TripHandler.leaveTrip(tripId, currentUsername, curr_member);
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
    if (!currentUsername) return;
    
    const result = await TripHandler.handleClaimMockUser(tripId, mockUserId, claimCode, currentUsername, expenses, trip);
    if (result.success) {
      setSnackbarMessage("Successfully claimed mock profile!");
      setSnackbarVisible(true);
    } else {
      setSnackbarMessage(`Error claiming profile: ${result.error?.message || 'Unknown error'}`);
      setSnackbarVisible(true);
    }
  };

  return (
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
            onEditBudget={onEditBudget}
          />
        )}
        {/* Watch Ad button for increasing daily expense limit */}
        <Button
          mode="outlined"
          icon="video"
          style={styles.adButton}
          onPress={async () => {
            //await showRewardedAd(() => {
              // TODO: Call backend to increment daily limit
              alert('Ad watched! Increase daily limit here.');
            //});
          }}
        >
          Watch Ad to Increase Daily Limit
        </Button>
      </View>

      <View style={styles.actionButtons}>
        {trip?.createdBy === currentUsername && (
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
    backgroundColor: '#B00020', // fallback for theme.colors.error
  },
  leaveButton: {
    borderWidth: 2,
  },
  adButton: {
    marginTop: 12,
  },
});