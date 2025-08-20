// app/create.tsx - Create Trip Screen (no Amplify, uses DynamoDBService)
import 'react-native-get-random-values';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Text, TextInput, Button, IconButton, Menu } from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { PremiumStatus, SUPPORTED_CURRENCIES } from '@/src/types/DataTypes';
import { getUserPremiumStatus } from '@/src/utilities/PremiumUtilities';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateButton from '@/src/components/Common/DateButton';
import { useUserTripsContext } from '@/src/context/UserTripsContext';
import { v4 as uuidv4 } from 'uuid';

// ✅ new: use your DynamoDBService (no Amplify)
import {
  createTrip as ddbCreateTrip,
  addMemberToTrip,
  updateUserProfile,
} from '@/src/aws-services/DynamoDBService';

const { width } = Dimensions.get('window');

// Currency info for the menu
const CURRENCY_INFO: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
};

export default function CreateTripScreen() {
  const [destination, setDestination] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [tripDate, setTripDate] = useState<Date>(new Date());
  const [tripEndDate, setTripEndDate] = useState<Date>(new Date());
  const [errors, setErrors] = useState<{ name?: string; budget?: string; date?: string }>({});
  const { user: ctxUser, fetchTrips, trips } = useUserTripsContext();

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['25%', '75%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setShowFormDrawer(false);
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const openDrawer = () => {
    setShowFormDrawer(true);
    bottomSheetRef.current?.expand();
  };

  const closeDrawer = () => {
    if (showCurrencyMenu) setShowCurrencyMenu(false);
    bottomSheetRef.current?.close();
  };

  useEffect(() => {
    if (showFormDrawer) bottomSheetRef.current?.expand();
  }, [showFormDrawer]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  const Wrapper = Platform.OS === 'web' ? React.Fragment : TouchableWithoutFeedback;

  const handleCreateTrip = async () => {
    setShowFormDrawer(false);
    let hasError = false;
    const newErrors: { name?: string; budget?: string; date?: string } = {};

    // ---------- validation ----------
    if (!destination.trim()) {
      newErrors.name = 'Please enter a destination.';
      hasError = true;
    } else if (destination.length > 25) {
      newErrors.name = 'Trip name must be 25 characters or less.';
      hasError = true;
    }

    const parsedBudget = parseFloat(totalBudget) || 0;
    if (!totalBudget || isNaN(parsedBudget) || parsedBudget <= 0) {
      newErrors.budget = 'Please enter a valid budget.';
      hasError = true;
    } else if (parsedBudget > 1_000_000) {
      newErrors.budget = 'Budget cannot exceed $1,000,000.';
      hasError = true;
    }

    if (!tripDate || !tripEndDate || tripEndDate < tripDate) {
      newErrors.date = 'End date must be after start date.';
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    // ---------- prep ----------
    const tripId = uuidv4();
    const userId = user.id; // stable Clerk ID
    const isoStart = tripDate.toISOString();
    const isoEnd = tripEndDate.toISOString();

    let isTripPremium = false;
    const premium = await getUserPremiumStatus(ctxUser);
    if (premium === PremiumStatus.PREMIUM || premium === PremiumStatus.TRIAL) {
      isTripPremium = true;
    }

    try {
      // ---------- 1) create trip (DynamoDB) ----------
      const createdTrip = await ddbCreateTrip({
        
        tripId,
        destinationName: destination.trim(),
        createdBy: userId,
        currency: selectedCurrency,
        startDate: isoStart,
        endDate: isoEnd,
        totalBudget: parsedBudget,
        debts: [],
        totalAmtLeft: parsedBudget,
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTripPremium,
      });

      console.log('[CreateTrip] Trip created:', createdTrip);

      // ---------- 2) add creator as member ----------
      await addMemberToTrip({
        tripId: createdTrip.tripId,
        userId,
        username:
          user.username ||
          user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'user',
        currency: createdTrip.currency,
        budget: parsedBudget,
      });

      console.log('[CreateTrip] Member created in DynamoDB');

      // ---------- 3) refresh cached data & navigate ----------
      await fetchTrips();
      router.push('/');
    } catch (err) {
      console.error('[CreateTrip] Trip creation error:', err);
      alert('Failed to create trip. Please try again.');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Wrapper {...(Platform.OS !== 'web' ? { onPress: Keyboard.dismiss } : {})}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 60 }}
        >
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.logo, { color: theme.colors.text }]}>Who's Next</Text>
            </View>

            {/* Hero Section */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.heroContainer}>
                <View style={[styles.illustrationPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]} />
                <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Ready to explore?</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.subtext }]}>
                  Create your next adventure and start planning with friends
                </Text>
                <Button
                  mode="contained"
                  onPress={openDrawer}
                  style={styles.heroButton}
                  contentStyle={styles.heroButtonContent}
                  labelStyle={styles.heroButtonLabel}
                  icon="plus"
                >
                  Create New Trip
                </Button>
              </View>
            </ScrollView>

            {/* BottomSheet Drawer */}
            <BottomSheet
              ref={bottomSheetRef}
              index={-1}
              snapPoints={snapPoints}
              onChange={handleSheetChanges}
              enablePanDownToClose={true}
              backdropComponent={renderBackdrop}
              backgroundStyle={{ backgroundColor: theme.colors.surface }}
              handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
            >
              <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.drawerHeader}>
                  <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>Plan your next adventure</Text>
                  <IconButton icon="close" onPress={closeDrawer} size={24} />
                </View>

                {/* Trip Form */}
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Destination */}
                  <TextInput
                    mode="outlined"
                    placeholder="Where are you going?"
                    value={destination}
                    onChangeText={text => text.length <= 25 ? setDestination(text) : null}
                    style={styles.input}
                    left={<TextInput.Icon icon="map-marker" />}
                    theme={{
                      colors: {
                        primary: theme.colors.primary,
                        text: theme.colors.text,
                        placeholder: theme.colors.subtext,
                      },
                    }}
                    maxLength={25}
                    error={!!errors.name}
                  />
                  {errors.name && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.name}</Text>}

                  {/* Budget + Currency */}
                  <View style={styles.budgetContainer}>
                    <TextInput
                      mode="outlined"
                      placeholder="What's your budget?"
                      value={totalBudget}
                      onChangeText={setTotalBudget}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      style={styles.budgetInput}
                      left={<TextInput.Icon icon="currency-usd" />}
                      theme={{
                        colors: {
                          primary: theme.colors.primary,
                          text: theme.colors.text,
                          placeholder: theme.colors.subtext,
                        },
                      }}
                      error={!!errors.budget}
                    />
                    <Menu
                      visible={showCurrencyMenu}
                      onDismiss={() => setShowCurrencyMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => {
                            Keyboard.dismiss();
                            setShowCurrencyMenu(true);
                          }}
                          style={styles.currencyButton}
                        >
                          {selectedCurrency}
                        </Button>
                      }
                    >
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <Menu.Item
                          key={currency}
                          onPress={() => {
                            setSelectedCurrency(currency);
                            setShowCurrencyMenu(false);
                          }}
                          title={`${currency} - ${CURRENCY_INFO[currency]?.name}`}
                          leadingIcon={selectedCurrency === currency ? 'check' : 'currency-usd'}
                        />
                      ))}
                    </Menu>
                  </View>
                  {errors.budget && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.budget}</Text>}

                  {/* Dates */}
                  <View style={styles.dateContainer}>
                    <DateButton value={tripDate} onChange={setTripDate} label="Trip Start Date" style={styles.dateInput} />
                    <DateButton value={tripEndDate} onChange={setTripEndDate} label="Trip End Date" style={styles.dateInput} />
                  </View>
                  {errors.date && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.date}</Text>}

                  {/* Submit */}
                  <Button
                    mode="contained"
                    onPress={openDrawer ? handleCreateTrip : handleCreateTrip}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                    icon="check"
                  >
                    Create Trip
                  </Button>
                </ScrollView>
              </BottomSheetView>
            </BottomSheet>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Wrapper>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  logo: { fontSize: 32, fontWeight: '700' },
  heroContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  illustrationPlaceholder: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    marginBottom: 32,
  },
  heroTitle: { fontSize: 32, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20, lineHeight: 24 },
  heroButton: { borderRadius: 30, paddingHorizontal: 32 },
  heroButtonContent: { paddingVertical: 8, height: 56 },
  heroButtonLabel: { fontSize: 16, fontWeight: '600' },
  bottomSheetContent: { flex: 1 },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  drawerTitle: { fontSize: 24, fontWeight: '700', flex: 1 },
  input: { marginBottom: 16, marginHorizontal: 24 },
  budgetContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginHorizontal: 24, gap: 12 },
  budgetInput: { flex: 1 },
  currencyButton: { minWidth: 80 },
  dateContainer: { flexDirection: 'row', marginBottom: 16, marginHorizontal: 24, gap: 12 },
  dateInput: { flex: 1 },
  errorText: { fontSize: 12, marginBottom: 8, marginHorizontal: 24 },
  submitButton: { marginTop: 24, marginHorizontal: 24, borderRadius: 30 },
  submitButtonContent: { paddingVertical: 8, height: 56 },
  submitButtonLabel: { fontSize: 16, fontWeight: '600' },
});
