import React from 'react';
import { View, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Card, Badge, useTheme, Surface } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useRouter } from 'expo-router';

// Mock data
const members = [
  { id: '1', name: 'Alex', streak: 3, badges: ['On-Time Hero'], avatar: 'A' },
  { id: '2', name: 'Jamie', streak: 2, badges: ['First to Pay'], avatar: 'J' },
  { id: '3', name: 'Taylor', streak: 1, badges: ['Paid for All'], avatar: 'T' },
];
const nextPayer = members[0];
const paymentRotation = [members[1], members[0], members[2]];
const recentPayments = [
  { payer: 'Jamie', desc: 'Dinner 🍽️', date: 'Jul 6' },
  { payer: 'Alex', desc: 'Lunch 🥪', date: 'Jul 5' },
  { payer: 'Taylor', desc: 'Museum 🎟️', date: 'Jul 4' },
];

export default function TripPaymentDashboard() {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      {/* Next to Pay Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Next to Pay</Text>
        <View style={styles.nextPayerRow}>
          <Avatar.Text label={nextPayer.avatar} size={56} style={{ marginRight: 16, backgroundColor: theme.colors.primary }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextPayerName, { color: theme.colors.text }]}>{nextPayer.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Badge style={styles.streakBadge}>{`🔥 ${nextPayer.streak}x`}</Badge>
              {nextPayer.badges.map((badge, i) => (
                <Badge key={i} style={styles.badge}>{badge}</Badge>
              ))}
            </View>
          </View>
          <Button mode="contained" style={styles.payNowButton}>Pay Now</Button>
        </View>
      </Surface>

      {/* Payment Rotation Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Payment Rotation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {paymentRotation.map((member, idx) => (
            <View key={member.id} style={[styles.rotationItem, idx === 1 && styles.rotationNext]}> {/* idx === 1 is next */}
              <Avatar.Text label={member.avatar} size={40} style={{ backgroundColor: theme.colors.primary }} />
              <Text style={{ color: theme.colors.text, marginTop: 4 }}>{member.name}</Text>
              {idx === 1 && <Badge style={styles.nextBadge}>Next</Badge>}
            </View>
          ))}
        </ScrollView>
      </Surface>

      {/* Leaderboard Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {members.map((member, idx) => (
          <View key={member.id} style={styles.leaderboardRow}>
            <Text style={styles.leaderboardRank}>{idx + 1}.</Text>
            <Avatar.Text label={member.avatar} size={36} style={{ backgroundColor: theme.colors.primary, marginRight: 12 }} />
            <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>{member.name}</Text>
            <Badge style={styles.streakBadge}>{`🔥 ${member.streak}x`}</Badge>
            {member.badges.map((badge, i) => (
              <Badge key={i} style={styles.badge}>{badge}</Badge>
            ))}
          </View>
        ))}
        <Button mode="text" style={{ marginTop: 8 }}>View All Badges</Button>
      </Surface>

      {/* Recent Payments Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {recentPayments.map((p, idx) => (
          <View key={idx} style={styles.paymentRow}>
            <Text style={{ color: theme.colors.text }}>{p.payer} paid for {p.desc}</Text>
            <Text style={{ color: theme.colors.subtext, marginLeft: 8 }}>{p.date}</Text>
          </View>
        ))}
      </Surface>

      {/* Back to Trip Button */}
      <Button mode="outlined" style={styles.backButton} onPress={() => router.push('/')}>Back to Trip</Button>
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