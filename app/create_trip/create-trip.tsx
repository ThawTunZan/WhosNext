// app/create.tsx - Create Trip Screen
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
  Modal,
  Animated,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {Text,TextInput,Button,IconButton,Menu} from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { AddMemberType, PremiumStatus, SUPPORTED_CURRENCIES } from '@/src/types/DataTypes';
import { getUserPremiumStatus } from '@/src/utilities/PremiumUtilities';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateButton from '@/src/components/Common/DateButton';
import { useUserTripsContext } from '@/src/context/UserTripsContext';
import { v4 as uuidv4 } from 'uuid';
import { generateClient } from 'aws-amplify/api';
import { createMember, createTrip } from '@/src/graphql/mutations';

const { width } = Dimensions.get('window');

// Currency symbol and name mapping for supported currencies only
const CURRENCY_INFO = {
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
  const { user: userFirebase, fetchTrips } = useUserTripsContext();

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['25%', '75%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setShowFormDrawer(false);
    }
  }, []);

  const handlePresentModalPress = useCallback(() => {
    setShowFormDrawer(true);
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseModalPress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const selectedCurrencyInfo = CURRENCY_INFO[selectedCurrency];

  const openDrawer = () => {
    setShowFormDrawer(true);
    bottomSheetRef.current?.expand();
  };

  const closeDrawer = () => {
    // Close currency menu if it's open
    if (showCurrencyMenu) {
      setShowCurrencyMenu(false);
    }
    
    bottomSheetRef.current?.close();
  };
  
  useEffect(() => {
    if (showFormDrawer) {
      bottomSheetRef.current?.expand();
    }
  }, [showFormDrawer]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  const Wrapper = Platform.OS === 'web' ? React.Fragment : TouchableWithoutFeedback;

  const handleCreateTrip = async () => {
    setShowFormDrawer(false);
    let hasError = false;
    const newErrors: { name?: string; budget?: string; date?: string } = {};
    
    if (!destination.trim()) {
      newErrors.name = "Please enter a destination.";
      hasError = true;
    } else if (destination.length > 25) {
      newErrors.name = "Trip name must be 25 characters or less.";
      hasError = true;
    }
  
    const parsedBudget = parseFloat(totalBudget) || 0;
    if (!totalBudget || isNaN(parsedBudget) || parsedBudget <= 0) {
      newErrors.budget = "Please enter a valid budget.";
      hasError = true;
    } else if (parsedBudget > 1000000) {
      newErrors.budget = "Budget cannot exceed $1,000,000.";
      hasError = true;
    }
  
    if (!tripDate || !tripEndDate || tripEndDate < tripDate) {
      newErrors.date = "End date must be after start date.";
      hasError = true;
    }
  
    setErrors(newErrors);
    if (hasError) return;
  
    const tripId = uuidv4();
    const username = user.username;
  
    let isTripPremium = false;
    const userPremiumStatus = await getUserPremiumStatus(userFirebase);
    if (userPremiumStatus === PremiumStatus.PREMIUM || userPremiumStatus === PremiumStatus.TRIAL) {
      isTripPremium = true;
    }
  
    // Step 1: Create the Trip
    const tripInput = {
      id: tripId,
      name: destination.trim(),
      currency: selectedCurrency,
      createdBy: username,
      totalAmtLeft: parsedBudget,
      totalBudget: parsedBudget,
      isTripPremium,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      debts: JSON.stringify({}), // Must be a string for AWSJSON
    };
  
    try {
      const client = generateClient();
      
      const tripResponse = await client.graphql({
        query: createTrip,
        variables: { input: tripInput }
      });
    
      const createdTrip = tripResponse.data.createTrip;
      console.log("Trip created:", createdTrip);
    
      // Step 2: Create initial Member (current user)
      const memberInput = {
        id: uuidv4(),
        username: username,
        fullName: username,
        tripId: createdTrip.id,
        amtLeft: parsedBudget,
        budget: parsedBudget,
        owesTotalMap: JSON.stringify({
          USD: 0, EUR: 0, GBP: 0, JPY: 0, CNY: 0, SGD: 0
        }),
      };
    
      const memberResponse = await client.graphql({
        query: createMember,
        variables: { input: memberInput }
      });
    
      console.log("Member created:", memberResponse.data.createMember);
      await fetchTrips();
    
      // Done — navigate to home
      router.push('/');
    } catch (err) {
      console.error("Trip creation error:", err);
      alert("Failed to create trip. Please try again.");
    }
  };

        return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Wrapper {...(Platform.OS !== 'web' ? { onPress: Keyboard.dismiss } : {})}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 60 }}
          >
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.logo, { color: theme.colors.text }]}>Who's Next</Text>
              </View>

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
                    <IconButton
                      icon="close"
                      onPress={closeDrawer}
                      size={24}
                    />
                  </View>
                  
                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    keyboardShouldPersistTaps="handled"
                  >
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
                        }
                      }}
                      maxLength={25}
                      error={!!errors.name}
                    />
                    {errors.name && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.name}</Text>}

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
                        }
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
                            leadingIcon={selectedCurrency === currency ? "check" : "currency-usd"}
                          />
                        ))}
                      </Menu>
                    </View>
                    {errors.budget && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.budget}</Text>}
                    
                    <View style={styles.dateContainer}>
                      <DateButton
                        value={tripDate}
                        onChange={setTripDate}
                        label="Trip Start Date"
                        style={styles.dateInput}
                      />
                      <DateButton
                        value={tripEndDate}
                        onChange={setTripEndDate}
                        label="Trip End Date"
                        style={styles.dateInput}
                      />
                    </View>
                    {errors.date && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.date}</Text>}
            

                    <Button 
                      mode="contained" 
                      onPress={handleCreateTrip}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  illustrationPlaceholder: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  heroButton: {
    borderRadius: 30,
    paddingHorizontal: 32,
  },
  heroButtonContent: {
    paddingVertical: 8,
    height: 56,
  },
  heroButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  input: {
    marginBottom: 16,
    marginHorizontal: 24,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 24,
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  currencyButton: {
    minWidth: 80,
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: 24,
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    marginHorizontal: 24,
  },
  submitButton: {
    marginTop: 24,
    marginHorizontal: 24,
    borderRadius: 30,
  },
  submitButtonContent: {
    paddingVertical: 8,
    height: 56,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
});
