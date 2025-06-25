// app/create.tsx - Create Trip Screen
import React, { useState } from 'react';
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
import {
  Text,
  TextInput,
  Button,
  List,
  Portal,
  Modal,
} from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Currency, AddMemberType, PremiumStatus } from '@/src/types/DataTypes';
import { getUserPremiumStatus } from '@/src/utilities/PremiumUtilities';

const { width } = Dimensions.get('window');

const CURRENCIES: { code: Currency; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export default function CreateTripScreen() {
  const [destination, setDestination] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const selectedCurrencyInfo = CURRENCIES.find(c => c.code === selectedCurrency);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  const Wrapper = Platform.OS === 'web' ? React.Fragment : TouchableWithoutFeedback;

  const handleCreateTrip = async () => {
    if (!destination) {
      alert("Please enter a destination.");
      return;
    }

    const parsedBudget = parseFloat(totalBudget) || 0;
    const userId = user.id;

    let isTripPremium = false;
    const userPremiumStatus = await getUserPremiumStatus(userId);
    if (userPremiumStatus === PremiumStatus.PREMIUM || userPremiumStatus === PremiumStatus.TRIAL) {
      isTripPremium = true;
    }

    const initialMembers = {
      [userId]: {
        id: userId,
        budget: parsedBudget,
        amtLeft: parsedBudget,
        currency: selectedCurrency,
        addMemberType: AddMemberType.FRIENDS,
        owesTotalMap: {
          USD: 0,
          EUR: 0,
          GBP: 0,
          JPY: 0,
          CNY: 0,
          SGD: 0
        },
        receiptsCount: 0,
      }
    };

    try {
      await addDoc(collection(db, 'trips'), {
        destination: destination.trim(),
        totalBudget: parsedBudget,
        totalAmtLeft: parsedBudget,
        currency: selectedCurrency,
        userId,
        members: initialMembers,
        debts: [],
        createdAt: Timestamp.now(),
        isTripPremium,
        expensesCount: 0,
        activitiesCount: 0,
      });

      router.push('/');
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Please try again.");
    }
  };

  return (
    <Wrapper {...(Platform.OS !== 'web' ? { onPress: Keyboard.dismiss } : {})}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.logo, { color: theme.colors.text }]}>Who's Next</Text>
            <Text 
              style={[styles.skip, { color: theme.colors.subtext }]}
              onPress={() => router.back()}
            >
              Skip
            </Text>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.illustrationContainer}>
              {/* Placeholder for illustration */}
              <View style={[styles.illustrationPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]} />
            </View>

            <View style={[styles.bottomCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Plan your next adventure</Text>
              
              <TextInput
                mode="flat"
                placeholder="Where are you going?"
                value={destination}
                onChangeText={setDestination}
                style={[styles.input]}
                theme={{ 
                  colors: { 
                    primary: theme.colors.primary,
                    text: theme.colors.text,
                    placeholder: theme.colors.subtext,
                  }
                }}
              />

              <View style={styles.budgetContainer}>
                <TextInput
                  mode="flat"
                  placeholder="What's your budget?"
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  keyboardType="numeric"
                  style={[styles.budgetInput]}
                  left={<TextInput.Affix text={selectedCurrencyInfo?.symbol} textStyle={{ color: theme.colors.text }} />}
                  theme={{ 
                    colors: { 
                      primary: theme.colors.primary,
                      text: theme.colors.text,
                      placeholder: theme.colors.subtext,
                    }
                  }}
                />
                <Button
                  mode="outlined"
                  onPress={() => setShowCurrencyModal(true)}
                  style={styles.currencyButton}
                >
                  {selectedCurrency}
                </Button>
              </View>

              <Button 
                mode="contained" 
                onPress={handleCreateTrip}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={[styles.buttonLabel, { color: theme.colors.text }]}
              >
                Get Started
              </Button>

              <View style={styles.progressDots}>
                <View style={[styles.dot, styles.activeDot, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.dot, { backgroundColor: theme.colors.surfaceVariant }]} />
                <View style={[styles.dot, { backgroundColor: theme.colors.surfaceVariant }]} />
              </View>
            </View>
          </ScrollView>

          <Portal>
            <Modal
              visible={showCurrencyModal}
              onDismiss={() => setShowCurrencyModal(false)}
              contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Currency</Text>
              {CURRENCIES.map((currency) => (
                <List.Item
                  key={currency.code}
                  title={`${currency.code} - ${currency.name}`}
                  description={`Symbol: ${currency.symbol}`}
                  onPress={() => {
                    setSelectedCurrency(currency.code);
                    setShowCurrencyModal(false);
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={selectedCurrency === currency.code ? "check" : "currency-usd"}
                    />
                  )}
                  style={[
                    styles.currencyItem,
                    selectedCurrency === currency.code && { backgroundColor: theme.colors.surfaceVariant }
                  ]}
                />
              ))}
            </Modal>
          </Portal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
  },
  skip: {
    fontSize: 16,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationPlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
  bottomCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  budgetInput: {
    flex: 1,
  },
  currencyButton: {
    minWidth: 80,
  },
  button: {
    marginTop: 20,
    borderRadius: 30,
  },
  buttonContent: {
    paddingVertical: 8,
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  currencyItem: {
    borderRadius: 8,
    marginVertical: 2,
  },
});
