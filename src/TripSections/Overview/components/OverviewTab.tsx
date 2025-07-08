import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Member, AddMemberType, Currency } from '@/src/types/DataTypes';
import BudgetSummaryCard from '@/src/TripSections/Overview/components/BudgetSummaryCard';
import PersonalBudgetCard from '@/src/TripSections/Overview/components/PersonalBudgetCard';
import MemberList from '@/app/trip/MemberList';
import NextPayerCard from '@/app/trip/components/NextPayerCard';
import { UpgradeTripButton } from '@/src/components';

type OverviewTabProps = {
  members: Record<string, Member>;
  usernames: Record<string, string>;
  totalBudget: number;
  totalAmtLeft: number;
  currentUserId: string;
  onAddMember: (memberKey: string, name: string, budget: number, currency: Currency, addMemberType: AddMemberType) => void;
  onRemoveMember: (memberId: string) => void;
  onEditBudget: () => void;
  onLeaveTrip: () => void;
  onDeleteTrip: () => void;
  isDeletingTrip: boolean;
  nextPayer: string | null;
  onClaimMockUser: (mockUserId: string, claimCode: string) => Promise<void>;
  tripId: string;
  tripCurrency: Currency;
};

export default function OverviewTab({
  members,
  totalBudget,
  totalAmtLeft,
  currentUserId,
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
          members={members} 
          onAddMember={onAddMember} 
          onRemoveMember={onRemoveMember}
          onClaimMockUser={onClaimMockUser}
          onGenerateClaimCode={async (memberId) => {
            const member = members[memberId];
            return member.claimCode || '';
          }}
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

        {members[currentUserId] && (
          <PersonalBudgetCard
            member={members[currentUserId]}
            onEditBudget={onEditBudget}
          />
        )}
      </View>

      {nextPayer && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ⏭️ Next Up
          </Text>
          <NextPayerCard name={nextPayer} />
        </View>
      )}

      <View style={styles.actionButtons}>
        {Object.keys(members)[0] === currentUserId && (
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