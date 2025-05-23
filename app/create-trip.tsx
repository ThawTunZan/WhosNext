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
} from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function CreateTripScreen() {
  const [destination, setDestination] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  const handleCreateTrip = async () => {
    if (!destination) {
      alert("Please enter a destination.");
      return;
    }

    const parsedBudget = parseFloat(totalBudget) || 0;
    const userId = user.id;

    const initialMembers = {
      [userId]: {
        budget: parsedBudget,
        amtLeft: parsedBudget,
        owesTotal: 0,
      }
    };

    try {
      await addDoc(collection(db, 'trips'), {
        destination: destination.trim(),
        totalBudget: parsedBudget,
        totalAmtLeft: parsedBudget,
        userId,
        members: initialMembers,
        debts: {},
        createdAt: Timestamp.now()
      });

      router.push('/');
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <StatusBar style="dark" />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>Who's Next</Text>
            <Text 
              style={styles.skip}
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
              <View style={styles.illustrationPlaceholder} />
            </View>

            <View style={styles.bottomCard}>
              <Text style={styles.title}>Plan your next adventure</Text>
              
              <TextInput
                mode="flat"
                placeholder="Where are you going?"
                value={destination}
                onChangeText={setDestination}
                style={styles.input}
                theme={{ colors: { primary: '#6B4EFF' }}}
              />

              <TextInput
                mode="flat"
                placeholder="What's your budget?"
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Affix text="$" />}
                theme={{ colors: { primary: '#6B4EFF' }}}
              />

              <Button
                mode="contained"
                onPress={handleCreateTrip}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Get Started
              </Button>

              <View style={styles.progressDots}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E3FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  skip: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#D1CAFF',
    borderRadius: width * 0.3,
  },
  bottomCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    borderRadius: 30,
    backgroundColor: '#42404F',
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
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#42404F',
    width: 24,
  },
});
