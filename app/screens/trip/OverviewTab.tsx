import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Member, AddMemberType, FirestoreTrip } from '@/src/types/DataTypes';
import BudgetSummaryCard from '@/src/components/Trip/Overview/components/BudgetSummaryCard';
import PersonalBudgetCard from '@/src/components/Trip/Overview/components/PersonalBudgetCard';
import MemberList from '@/src/components/Common/MemberList';
import NextPayerCard from '@/src/components/Common/NextPayerCard';
import { UpgradeTripButton } from '@/src/components';
import { useUserTripsContext } from '@/src/context/UserTripsContext';
//import { showRewardedAd } from '@/CommonComponents/AdMob';

type OverviewTabProps = {
  usernames: Record<string, string>;
  totalBudget: number;
  totalAmtLeft: number;
  currentUsername: string;
  onAddMember: ( name: string, budget: number, currency: string, addMemberType: AddMemberType) => void;
  onRemoveMember: (memberId: string) => void;
  onEditBudget: () => void;
  onLeaveTrip: () => void;
  onDeleteTrip: () => void;
  isDeletingTrip: boolean;
  nextPayer: string | null;
  onClaimMockUser: (mockUserId: string, claimCode: string) => Promise<void>;
  tripId: string;
  tripCurrency: string;
};

export default function OverviewTab({
  totalBudget,
  totalAmtLeft,
  currentUsername,
  onAddMember,
  onRemoveMember,
  onEditBudget,
  onLeaveTrip,
  onDeleteTrip,
  isDeletingTrip,
  nextPayer,
  onClaimMockUser,
  tripId,
  tripCurrency,
}: OverviewTabProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();
  const {trips} = useUserTripsContext();
  const trip = trips.find(t => t.id === tripId) as FirestoreTrip | undefined;
  const members = trip?.members || {};
  //console.log("MEMBERS IN OVERVIEW TAB ARE ",members)

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
          onAddMember={onAddMember} 
          onRemoveMember={onRemoveMember}
          onClaimMockUser={onClaimMockUser}
          tripId={tripId}
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          💰 Budget
        </Text>
        <BudgetSummaryCard
          members={members}
          totalBudget={totalBudget}
          totalAmtLeft={totalAmtLeft}
          tripCurrency={tripCurrency}
        />

        {members[currentUsername] && (
          <PersonalBudgetCard
            member={members[currentUsername]}
            onEditBudget={onEditBudget}
          />
        )}
        {/* Watch Ad button for increasing daily expense limit */}
        <Button
          mode="outlined"
          icon="video"
          style={{ marginTop: 12 }}
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
        {trip.createdBy === currentUsername && (
          <Button
            mode="contained"
            onPress={onDeleteTrip}
            loading={isDeletingTrip}
            style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
            icon="delete"
          >
            Delete Trip
          </Button>
        )}
        <Button 
          mode="outlined" 
          onPress={onLeaveTrip}
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
  },
  leaveButton: {
    borderWidth: 2,
  },
}); 