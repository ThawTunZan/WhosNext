// File: app/index.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTrips } from '@/src/hooks/useTrips';
import { useUser } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_MARGIN = 8;
const CARD_WIDTH = width - (CARD_PADDING * 2);

export default function TripsScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const { isLoaded, isSignedIn } = useUser();
  const theme = useTheme();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const renderTripCard = ({ item }) => (
    <Pressable onPress={() => router.push(`/trip/${item.id}`)}>
      <Surface style={styles.card} elevation={2}>
        <View style={styles.cardHeader}>
          <View style={styles.destinationContainer}>
            <Text style={styles.emoji}>✈️</Text>
            <Text style={styles.destination}>{item.destination}</Text>
          </View>
          <IconButton
            icon="chevron-right"
            size={24}
            iconColor="#666"
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.budgetInfo}>
            <Text style={styles.label}>Total Budget</Text>
            <Text style={styles.amount}>${item.totalBudget.toFixed(2)}</Text>
          </View>
          <View style={styles.budgetInfo}>
            <Text style={styles.label}>Amount Left</Text>
            <Text style={[styles.amount, { color: '#4CAF50' }]}>
              ${item.totalAmtLeft.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${(item.totalAmtLeft / item.totalBudget) * 100}%` }
            ]} 
          />
        </View>
      </Surface>
    </Pressable>
  );

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Trips</Text>
          <IconButton
            icon="plus"
            mode="contained"
            containerColor="#42404F"
            iconColor="white"
            size={24}
            onPress={() => router.push('/create-trip')}
          />
        </View>

        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Text style={styles.emptyStateEmoji}>🌎</Text>
            </View>
            <Text style={styles.emptyStateTitle}>No trips yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first trip to start tracking expenses
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/create-trip')}
              style={styles.createButton}
              contentStyle={styles.buttonContent}
            >
              Create Trip
            </Button>
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={renderTripCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  listContent: {
    padding: CARD_PADDING,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: CARD_MARGIN * 2,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  destination: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateEmoji: {
    fontSize: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 30,
    backgroundColor: '#42404F',
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    height: 56,
  },
});
