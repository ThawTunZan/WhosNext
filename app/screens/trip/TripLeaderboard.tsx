import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Avatar, Badge, Surface } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { ExpenseDDB, Payment, TripsTableDDB, MemberDDB } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { useUserTripsContext } from '@/src/context/UserTripsContext';

interface TripLeaderboardProps {
  trip: TripsTableDDB;
  tripId: string;
}

export default function TripLeaderboard(props: TripLeaderboardProps) {
  const { trip, tripId } = props;
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  

  const [rotationType, setRotationType] = useState<'Recency' | 'AmountLeft' | 'PaymentNum'>('Recency')
  //const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  const [leaderboardTotals, setLeaderboardTotals] = useState<{ [username: string]: number }>({});
  const [loadingTotals, setLoadingTotals] = useState(false);
  // each person's amount left converted to the trip's currency
  const [amtLeftInTripCurrency, setAmtLeftInTripCurrency] = useState<{ [username: string]: number }>({});
  const { tripMembersMap, expensesByTripId } = useUserTripsContext();

  const expenses = expensesByTripId?.[tripId] ?? [];

  const membersById = tripMembersMap?.[tripId] ?? {};


  // Members as array with id
  const members = useMemo(() =>
      membersById? 
      Object.entries(membersById).map(([id, m]) => ({ ...m, id, username: m.username })) : [],
    [membersById]
  );

  
  useEffect(() => {
    let cancelled = false;
    async function calcAmtLeft() {
      const result: { [username: string]: number } = {};
      for (const member of members) {
        const converted = await convertCurrency(
          Number(member.amtLeft) || 0,
          member.currency || 'USD',
          trip.currency || 'USD'
        );
        result[member.username] = converted;
      }
      if (!cancelled) setAmtLeftInTripCurrency(result);
    }
    calcAmtLeft();
    return () => {
      cancelled = true;
    };
  }, [members, expenses, trip.currency]);

  

   // ---- Payment rotation logic ----
   const paymentRotation = useMemo(() => {
    if (rotationType === 'AmountLeft') {
      // Sort by amtLeft in trip currency (desc: who has most left should pay next)
      return [...members].sort(
        (a, b) => (amtLeftInTripCurrency[b.username] || 0) - (amtLeftInTripCurrency[a.username] || 0)
      );
    } else if (rotationType === 'Recency') {
      // Sort members by how recently they paid (least recent first)
      const memberLastPaid: Record<string, number> = {};
      members.forEach((m) => {
        memberLastPaid[m.username] = 0;
      });

      expenses.forEach((e) => {
        const payer = e.paidBy;
        const paidAt = e.createdAt ? new Date(e.createdAt as string).getTime() : 0;
        if (payer && paidAt && paidAt > (memberLastPaid[payer] || 0)) {
          memberLastPaid[payer] = paidAt;
        }
      });

      return [...members].sort((a, b) => (memberLastPaid[a.username] || 0) - (memberLastPaid[b.username] || 0));
    } else if (rotationType === 'PaymentNum') {
      // Count number of expenses paid by each member; tie-breaker by recency (least recent first)
      const expenseCounts: Record<string, number> = {};
      const memberLastPaid: Record<string, number> = {};
      members.forEach((m) => {
        expenseCounts[m.username] = 0;
        memberLastPaid[m.username] = 0;
      });

      expenses.forEach((e) => {
        const payer = e.paidBy;
        const paidAt = e.createdAt ? new Date(e.createdAt as string).getTime() : 0;
        if (payer) {
          expenseCounts[payer] += 1;
          if (paidAt && paidAt > (memberLastPaid[payer] || 0)) {
            memberLastPaid[payer] = paidAt;
          }
        }
      });

      return [...members].sort((a, b) => {
        if (expenseCounts[a.username] !== expenseCounts[b.username]) {
          return expenseCounts[a.username] - expenseCounts[b.username];
        }
        return (memberLastPaid[a.username] || 0) - (memberLastPaid[b.username] || 0);
      });
    }
    return members;
  }, [rotationType, members, expenses, amtLeftInTripCurrency]);
  // Find next payer
  const nextPayer = paymentRotation[0] || members[0];


  // ---- Leaderboard: total paid (in trip currency), descending ----
  const leaderboard = useMemo(() => {
    return [...members]
      .map((member) => {
        const totalPaid = expenses
          .filter((e) => e.paidBy === member.username)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return { ...member, totalPaid };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid);
  }, [members, expenses]);

  // Top totalPaid for badges
  const topPaid = useMemo(() => {
    if (leaderboard.length === 0) return 0;
    return Math.max(
      ...leaderboard.map((m) =>
        expenses
          .filter((e) => e.paidBy === m.username)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      )
    );
  }, [leaderboard, expenses]);

  // First expense payer (oldest by createdAt)
  const firstExpensePayer = useMemo(() => {
    if (expenses.length === 0) return null;
    const earliest = expenses.reduce(
      (earliest, e) => {
        const ts = e.createdAt ? new Date(e.createdAt as string).getTime() : 0;
        if (ts && (earliest.time === 0 || ts < earliest.time)) {
          return { memberName: e.paidBy ?? null, time: ts };
        }
        return earliest;
      },
      { memberName: null as string | null, time: 0 }
    );
    return earliest.memberName;
  }, [expenses]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Next to Pay Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.sectionTitle}>Next to Pay</Text>
        <View style={styles.nextPayerRow}>
          <Avatar.Text
            label={nextPayer?.username?.[0] || '?'}
            size={56}
            style={{ marginRight: 16, backgroundColor: theme.colors.primary }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextPayerName, { color: theme.colors.text }]}>
              {nextPayer?.username || 'Unknown'}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Payment Rotation Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.sectionTitle}>Payment Rotation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {paymentRotation.map((member) => (
            <View key={member.username} style={styles.rotationItem}>
              <Avatar.Text
                label={member.username?.[0] || '?'}
                size={40}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <Text style={{ color: theme.colors.text, marginTop: 4 }}>
                {member.username || 'Unknown'}
              </Text>
            </View>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12, marginBottom: 4 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
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
        {loadingTotals ? (
          <Text>Loading totals...</Text>
        ) : (
          leaderboard.map((member, idx) => {
            const totalPaid = leaderboardTotals[member.username] || 0;
            const numPaid = expenses.filter((e) => e.paidBy === member.username).length;

            const badges: React.ReactNode[] = [];
            if (idx === 0)
              badges.push(
                <Badge key="gold" style={{ backgroundColor: '#FFD700', color: '#333', marginLeft: 6 }}>
                  🥇
                </Badge>
              );
            if (idx === 1)
              badges.push(
                <Badge key="silver" style={{ backgroundColor: '#C0C0C0', color: '#333', marginLeft: 6 }}>
                  🥈
                </Badge>
              );
            if (idx === 2)
              badges.push(
                <Badge key="bronze" style={{ backgroundColor: '#CD7F32', color: '#fff', marginLeft: 6 }}>
                  🥉
                </Badge>
              );

            if (totalPaid === topPaid && topPaid > 0)
              badges.push(
                <Badge key="spender" style={{ backgroundColor: '#FFB300', color: '#fff', marginLeft: 6 }}>
                  🤑 Sugar Daddy
                </Badge>
              );

            if (member.username === firstExpensePayer)
              badges.push(
                <Badge key="first" style={{ backgroundColor: '#4F46E5', color: '#fff', marginLeft: 6 }}>
                  ☠️ First Victim
                </Badge>
              );

            if (totalPaid === 0)
              badges.push(
                <Badge key="ghost" style={{ backgroundColor: '#B0BEC5', color: '#333', marginLeft: 6 }}>
                  👻 Ghost
                </Badge>
              );

            if (numPaid >= 3)
              badges.push(
                <Badge key="flyer" style={{ backgroundColor: '#8BC34A', color: '#fff', marginLeft: 6 }}>
                  💸 Frequent Payer
                </Badge>
              );

            // Last minute: most recent payer overall
            const mostRecent = expenses.reduce(
              (latest, e) => {
                const t = e.createdAt ? new Date(e.createdAt as string).getTime() : 0;
                return t > latest.paidAt ? { memberId: e.paidBy ?? null, paidAt: t } : latest;
              },
              { memberId: null as string | null, paidAt: 0 }
            );
            if (member.username === mostRecent.memberId)
              badges.push(
                <Badge key="lastminute" style={{ backgroundColor: '#FF7043', color: '#fff', marginLeft: 6 }}>
                  ⏰ Last Minute Payback
                </Badge>
              );

            return (
              <View key={member.username} style={styles.leaderboardRow}>
                <Text style={styles.leaderboardRank}>{idx + 1}.</Text>
                <Avatar.Text
                  label={member.username?.[0] || '?'}
                  size={36}
                  style={{ backgroundColor: theme.colors.primary, marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>
                    {member.username || 'Unknown'}
                  </Text>
                  {badges.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>{badges}</View>}
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                    Paid: {trip.currency || 'USD'} {totalPaid.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </Surface>

      {/* Get Trip Summary Button */}
      <Button mode="outlined" style={styles.backButton}>
        Get Trip Summary
      </Button>
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
  rotationItem: {
    alignItems: 'center',
    marginRight: 24,
    position: 'relative',
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
  backButton: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'center',
    width: 180,
  },
});