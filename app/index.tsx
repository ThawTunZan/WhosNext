// File: app/index.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTrips } from '@/src/hooks/useTrips';
import { useUser } from '@clerk/clerk-expo';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_MARGIN = 8;
const CARD_WIDTH = width - (CARD_PADDING * 2);

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export default function TripsScreen() {
  const router = useRouter();
  const { trips, isTripsLoading } = useTrips();
  const { isLoaded, isSignedIn } = useUser();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();

  // Sort trips by startDate descending (latest first)
  const sortedTrips = [...trips].sort((a, b) => {
    const getDate = (trip) => {
      const d = trip.startDate || trip.createdAt;
      if (!d) return 0;
      if (typeof d.toDate === 'function') return d.toDate().getTime();
      if (d instanceof Date) return d.getTime();
      return new Date(d).getTime();
    };
    return getDate(b) - getDate(a);
  });

  // Memoize the renderItem function to prevent unnecessary re-renders
  const renderTripCard = useCallback(({ item }) => {
    // Format trip dates
    const getDateObj = (d) => {
      if (!d) return null;
      if (typeof d.toDate === 'function') return d.toDate();
      if (d instanceof Date) return d;
      return new Date(d);
    };
    const start = getDateObj(item.startDate);
    const end = getDateObj(item.endDate);
    let dateLabel = '';
    if (start && end) {
      dateLabel = `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (start) {
      dateLabel = start.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const currencySymbol = (CURRENCIES.find(c => c.code === item.currency)?.symbol) || '$';
    return (
      <Pressable onPress={() => router.push(`/trip/${item.id}`)}>
        <Surface style={styles.cardContainer} elevation={2}>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <View style={styles.destinationContainer}>
                <Text style={styles.emoji}>✈️</Text>
                <View>
                  <Text style={[styles.destination, { color: theme.colors.text }]}>
                    {item.destination}
                  </Text>
                  {dateLabel && (
                    <Text style={{ color: theme.colors.subtext, fontSize: 13, marginTop: 2 }}>{dateLabel}</Text>
                  )}
                </View>
              </View>
              <IconButton
                icon="chevron-right"
                size={24}
                iconColor={theme.colors.subtext}
              />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.budgetInfo}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Total Budget</Text>
                <Text style={[styles.amount, { color: theme.colors.text }]}>
                  {currencySymbol}{item.totalBudget.toFixed(2)}
                </Text>
              </View>
              <View style={styles.budgetInfo}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Amount Left</Text>
                <Text style={[styles.amount, { color: theme.colors.success }]}>
                  {currencySymbol}{item.totalAmtLeft.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(item.totalAmtLeft / item.totalBudget) * 100}%`,
                    backgroundColor: theme.colors.success 
                  }
                ]} 
              />
            </View>
          </View>
        </Surface>
      </Pressable>
    );
  }, [theme.colors, router]);

  const keyExtractor = useCallback((item) => item.id, []);

  const isLoading = !isLoaded || isTripsLoading;

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <SafeAreaView 
        style={[{flex: 1, backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 60 }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Trips</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{color: theme.colors.text, margin: 32 }}>Loading your trips...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={styles.emptyStateEmoji}>🌎</Text>
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No trips yet</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
              Create your first trip to start tracking expenses
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/create-trip')}
              style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
              contentStyle={styles.buttonContent}
              labelStyle={{ color: theme.colors.text }}
            >
              Create Trip
            </Button>
          </View>
        ) : (
          <FlatList
            data={sortedTrips}
            renderItem={renderTripCard}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={5}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  listContent: {
    padding: CARD_PADDING,
  },
  cardContainer: {
    marginBottom: CARD_MARGIN * 2,
    borderRadius: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 20,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    height: 56,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
});
