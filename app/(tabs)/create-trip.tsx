// app/(tabs)/create.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, Button,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useCurrentUser } from '@/src/hooks/useCurrentUser';

export default function CreateTripScreen() {
  const [destination, setDestination] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const router = useRouter();
  const { id: currUserId, name: currUsername } = useCurrentUser();

  const handleCreateTrip = async () => {
    if (!destination) {
      alert("Please enter a destination.");
      return;
    }

    const initialBudget = totalBudget;
    const initialMembers = {
      [currUserId]: {
        name: currUsername,
        budget: initialBudget,
        amtLeft: initialBudget,
        owesTotal: 0,
      }
    };

    try {
      console.log("Creating trip with:", {
        destination: destination.trim(),
        totalBudget: initialBudget,
        totalAmtLeft: initialBudget,
        currUserId,
        members: initialMembers,
      });

      await firestore().collection('trips').add({
        destination: destination.trim(),
        totalBudget: initialBudget,
        totalAmtLeft: initialBudget,
        currUserId,
        members: initialMembers,
        debts: {},
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      setDestination('');
      router.push('/'); // Go back to home

    } catch (error) {
      console.error("Trip creation error:", error);
      alert("Failed to create trip.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>➕ Create New Trip</Text>

        <TextInput
          placeholder="Destination"
          placeholderTextColor="#555"
          value={destination}
          onChangeText={setDestination}
          style={styles.input}
        />

        <TextInput
          placeholder="YOUR Budget"
          placeholderTextColor="#555"
          keyboardType="numeric"
          value={String(totalBudget)}
          onChangeText={(text) => {
            const num = parseFloat(text);
            setTotalBudget(isNaN(num) ? 0 : num);
          }}
          style={styles.input}
        />

        <Button title="Create Trip" onPress={handleCreateTrip} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 25,
    fontSize: 16,
  }
});
