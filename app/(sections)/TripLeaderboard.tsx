import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Card, Badge, useTheme, Surface } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useRouter } from 'expo-router';
import { TripData, Payment, Expense, FirestoreTrip } from '@/src/types/DataTypes';

interface TripLeaderboardProps {
  trip: FirestoreTrip;
  expenses: Expense[];
  payments: Payment[];
}

export default function TripLeaderboard({ trip, expenses, payments }: TripLeaderboardProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();

  const [rotationType, setRotationType] = useState<'Recency' | 'AmountLeft' | 'PaymentNum'>('Recency')
  const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  // Members as array with id
  const members = trip.members
    ? Object.entries(trip.members).map(([username, m]) => ({ ...m, username }))
    : [];

  // Payment rotation: choose logic based on rotationType
  const paymentRotation = useMemo(() => {
    if (rotationType === 'AmountLeft') {
      return [...members].sort((a, b) => b.amtLeft - a.amtLeft);
    } else if (rotationType === 'Recency') {
      // Sort members by how recently they paid (least recent on the left, most recent on the right)
      // For each member, find the most recent expense they paid for
      const memberLastPaid: Record<string, number> = {};
      members.forEach(m => { memberLastPaid[m.username] = 0; });
      expenses.forEach(e => {
        const payerId = e.paidByAndAmounts?.[0]?.memberName;
        const paidAt = (e.createdAt instanceof Date)
          ? e.createdAt.getTime()
          : (e.createdAt?.toDate?.() ? e.createdAt.toDate().getTime() : 0);
        if (payerId && paidAt && paidAt > (memberLastPaid[payerId] || 0)) {
          memberLastPaid[payerId] = paidAt;
        }
      });
      // Sort by last paid time ascending (least recent first)
      return [...members].sort((a, b) => (memberLastPaid[a.username] || 0) - (memberLastPaid[b.username] || 0));
    } else if (rotationType === 'PaymentNum') {
      // Count number of expenses paid by each member
      const expenseCounts: Record<string, number> = {};
      const memberLastPaid: Record<string, number> = {};
      members.forEach(m => { 
        expenseCounts[m.username] = 0;
        memberLastPaid[m.username] = 0;
      });
      expenses.forEach(e => {
        const payerId = e.paidByAndAmounts?.[0]?.memberName;
        const paidAt = (e.createdAt instanceof Date)
          ? e.createdAt.getTime()
          : (e.createdAt?.toDate?.() ? e.createdAt.toDate().getTime() : 0);
        if (payerId) {
          expenseCounts[payerId] += 1;
          if (paidAt && paidAt > (memberLastPaid[payerId] || 0)) {
            memberLastPaid[payerId] = paidAt;
          }
        }
      });
      // Sort by num of payments ascending, then by last paid time ascending (least recent first)
      return [...members].sort((a, b) => {
        if (expenseCounts[a.username] !== expenseCounts[b.username]) {
          return expenseCounts[a.username] - expenseCounts[b.username];
        }
        // Tie-breaker: least recent payer first
        return (memberLastPaid[a.username] || 0) - (memberLastPaid[b.username] || 0);
      });
    }
    return members;
  }, [rotationType, members, expenses]);

  // Find next payer
  const nextPayer = paymentRotation[0] || members[0];

  // Recent payments: sort by paymentDate descending, take 3
  // Leaderboard: sort by amtLeft ascending (or streak if available)
  const leaderboard = [...members]
    .map(member => {
      const totalPaid = expenses
        .flatMap(e => e.paidByAndAmounts)
        .filter(pba => pba.memberName === member.username)
        .reduce((sum, pba) => sum + parseFloat(pba.amount || '0'), 0);
      return { ...member, totalPaid };
    })
    .sort((a, b) => b.totalPaid - a.totalPaid); // Sort descending by totalPaid

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      {/* Next to Pay Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Next to Pay</Text>
        <View style={styles.nextPayerRow}>
          <Avatar.Text label={nextPayer.username?.[0] || '?'} size={56} style={{ marginRight: 16, backgroundColor: theme.colors.primary }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextPayerName, { color: theme.colors.text }]}>{nextPayer.username || "Unknown"}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {/* Streak and badges can be added here if available */}
            </View>
          </View>
        </View>
      </Surface>

      {/* Payment Rotation Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Payment Rotation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {paymentRotation.map((member, idx) => (
            <View key={member.username} style={[styles.rotationItem]}>
              <Avatar.Text label={member.username?.[0] || '?'} size={40} style={{ backgroundColor: theme.colors.primary }} />
              <Text style={{ color: theme.colors.text, marginTop: 4 }}>{member.username || "Unknown"}</Text>
            </View>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 4 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Button
            mode={rotationType === 'Recency' ? 'contained' : 'outlined'}
            onPress={() => setRotationType('Recency')}
            style={{ marginHorizontal: 4, flexShrink: 1, minWidth: 100, paddingHorizontal: 0 }}
            labelStyle={{ fontSize: 13 }}
          >
            Recency
          </Button>
          <Button
            mode={rotationType === 'AmountLeft' ? 'contained' : 'outlined'}
            onPress={() => setRotationType('AmountLeft')}
            style={{ marginHorizontal: 4, flexShrink: 1, minWidth: 100, paddingHorizontal: 0 }}
            labelStyle={{ fontSize: 13 }}
          >
            Amount Left
          </Button>
          <Button
            mode={rotationType === 'PaymentNum' ? 'contained' : 'outlined'}
            onPress={() => setRotationType('PaymentNum')}
            style={{ marginHorizontal: 4, flexShrink: 1, minWidth: 100, paddingHorizontal: 0 }}
            labelStyle={{ fontSize: 13 }}
          >
            Num of Payment
          </Button>
        </ScrollView>
      </Surface>

      {/* Leaderboard Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboard.map((member, idx) => {
          // Calculate total paid by this member
          const totalPaid = expenses
            .flatMap(e => e.paidByAndAmounts)
            .filter(pba => pba.memberName === member.username)
            .reduce((sum, pba) => sum + parseFloat(pba.amount || '0'), 0);
          const numPaid = expenses.filter(e => e.paidByAndAmounts?.[0]?.memberName === member.username).length;

          // Badges
          const badges: React.ReactNode[] = [];
          if (idx === 0) badges.push(<Badge key="gold" style={{ backgroundColor: '#FFD700', color: '#333', marginLeft: 6 }}>🥇</Badge>);
          if (idx === 1) badges.push(<Badge key="silver" style={{ backgroundColor: '#C0C0C0', color: '#333', marginLeft: 6 }}>🥈</Badge>);
          if (idx === 2) badges.push(<Badge key="bronze" style={{ backgroundColor: '#CD7F32', color: '#fff', marginLeft: 6 }}>🥉</Badge>);

          // Big Spender badge for top payer
          const topPaid = Math.max(...leaderboard.map(m => expenses.flatMap(e => e.paidByAndAmounts).filter(pba => pba.memberName === m.username).reduce((sum, pba) => sum + parseFloat(pba.amount || '0'), 0)));
          if (totalPaid === topPaid && topPaid > 0) badges.push(<Badge key="spender" style={{ backgroundColor: '#FFB300', color: '#fff', marginLeft: 6 }}>🤑 Sugar Daddy</Badge>);

          // First Expense badge
          const firstExpensePayer = expenses.length > 0 ? expenses[0].paidByAndAmounts?.[0]?.memberName : null;
          if (member.username === firstExpensePayer) badges.push(<Badge key="first" style={{ backgroundColor: '#4F46E5', color: '#fff', marginLeft: 6 }}>☠️ First Victim</Badge>);

          // Ghost badge: never paid
          if (totalPaid === 0) badges.push(<Badge key="ghost" style={{ backgroundColor: '#B0BEC5', color: '#333', marginLeft: 6 }}>👻 Ghost</Badge>);

          // Rainmaker badge: paid more than $1000
          if (totalPaid > 1000) badges.push(<Badge key="rainmaker" style={{ backgroundColor: '#00B8D4', color: '#fff', marginLeft: 6 }}>💸 Rainmaker</Badge>);

          // Frequent Flyer: paid for 3+ expenses
          if (numPaid >= 3) badges.push(<Badge key="flyer" style={{ backgroundColor: '#8BC34A', color: '#fff', marginLeft: 6 }}>💸 Frequent Payer</Badge>);

          // Last Minute: most recent payer
          const mostRecentExpense = expenses.length > 0 ? expenses.reduce((latest, e) => {
            const paidAt = (e.createdAt instanceof Date)
              ? e.createdAt.getTime()
              : (e.createdAt?.toDate?.() ? e.createdAt.toDate().getTime() : 0);
            return paidAt > latest.paidAt ? { memberId: e.paidByAndAmounts?.[0]?.memberName, paidAt } : latest;
          }, { memberId: null, paidAt: 0 }) : { memberId: null, paidAt: 0 };
          if (member.username === mostRecentExpense.memberId) badges.push(<Badge key="lastminute" style={{ backgroundColor: '#FF7043', color: '#fff', marginLeft: 6 }}>⏰ Last Minute Payback</Badge>);

          return (
            <View key={member.username} style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>{idx + 1}.</Text>
              <Avatar.Text label={member.username?.[0] || '?'} size={36} style={{ backgroundColor: theme.colors.primary, marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>{member.username || "Unknown"}</Text>
                {badges.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                    {badges}
                  </View>
                )}
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ color: theme.colors.text, fontSize: 13 }}>Paid: ${member.totalPaid.toFixed(2)}</Text>
              </View>
              {/* Add badges if available */}
            </View>
          );
        })}
      </Surface>

      {/* Get Trip Summary Button */}
      <Button mode="outlined" style={styles.backButton}>Get Trip Summary</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  nextPayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPayerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  payNowButton: {
    marginLeft: 12,
    borderRadius: 20,
  },
  streakBadge: {
    backgroundColor: '#FFD700',
    color: '#333',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#E0E7FF',
    color: '#333',
    marginRight: 8,
  },
  rotationItem: {
    alignItems: 'center',
    marginRight: 24,
    position: 'relative',
  },
  rotationNext: {
    borderColor: '#4F46E5',
    borderWidth: 2,
    borderRadius: 24,
    padding: 4,
  },
  nextBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#4F46E5',
    color: '#fff',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  leaderboardRank: {
    fontWeight: 'bold',
    width: 20,
    textAlign: 'right',
    marginRight: 8,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'center',
    width: 180,
  },
}); 