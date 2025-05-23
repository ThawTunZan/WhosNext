import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Member } from '@/src/types/DataTypes';
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
  onAddMember: (memberId: string, name: string, budget: number) => void;
  onRemoveMember: (memberId: string) => void;
  onEditBudget: () => void;
  onLeaveTrip: () => void;
  onDeleteTrip: () => void;
  isDeletingTrip: boolean;
  nextPayer: string | null;
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
}: OverviewTabProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MemberList 
        members={members} 
        onAddMember={onAddMember} 
        onRemoveMember={onRemoveMember} 
      />

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

      {nextPayer && (
        <NextPayerCard name={profiles[nextPayer]} />
      )}

      {/* Delete / Leave */}
      {Object.keys(members)[0] === currentUserId && (
        <Button
          mode="contained"
          onPress={onDeleteTrip}
          loading={isDeletingTrip}
          style={styles.deleteButton}
        >
          Delete Trip
        </Button>
      )}
      <Button mode="outlined" onPress={onLeaveTrip}>
        Leave Trip
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    marginVertical: 8,
  },
}); 