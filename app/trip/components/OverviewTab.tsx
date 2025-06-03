import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, useTheme, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Member, AddMemberType } from '@/src/types/DataTypes';
import BudgetSummaryCard from './BudgetSummaryCard';
import PersonalBudgetCard from './PersonalBudgetCard';
import MemberList from '../MemberList';
import NextPayerCard from './NextPayerCard';

type OverviewTabProps = {
  members: Record<string, Member>;
  profiles: Record<string, string>;
  totalBudget: number;
  totalAmtLeft: number;
  currentUserId: string;
  onAddMember: (memberId: string, name: string, budget: number, addMemberType: AddMemberType) => void;
  onRemoveMember: (memberId: string) => void;
  onEditBudget: () => void;
  onLeaveTrip: () => void;
  onDeleteTrip: () => void;
  isDeletingTrip: boolean;
  nextPayer: string | null;
  onClaimMockUser: (mockUserId: string, claimCode: string) => Promise<void>;
};

export default function OverviewTab({
  members,
  profiles,
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
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          💰 Budget
        </Text>
        <BudgetSummaryCard
          members={members}
          profiles={profiles}
          totalBudget={totalBudget}
          totalAmtLeft={totalAmtLeft}
        />

        {members[currentUserId] && (
          <PersonalBudgetCard
            member={members[currentUserId]}
            onEditBudget={onEditBudget}
          />
        )}
      </View>

      {nextPayer && profiles[nextPayer] && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ⏭️ Next Up
          </Text>
          <NextPayerCard name={profiles[nextPayer]} />
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