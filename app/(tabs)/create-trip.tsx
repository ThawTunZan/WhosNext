// app/(tabs)/create.tsx - Create Trip Screen
import { useState } from 'react';
import {
  View, Text, TextInput, Button,
  Keyboard, TouchableWithoutFeedback, ScrollView, KeyboardAvoidingView, Platform,StyleSheet
} from 'react-native';
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function CreateTripScreen() {
  const [destination, setDestination] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const router = useRouter();

  const { userId, userName } = useAuth();
  const initialBudgetForCreator = totalBudget;

  const handleCreateTrip = async () => {
    
    if (!destination) {
      alert("Please enter a destination.");
      return;
    }
    // This first entry is for the test account
    const initialMembers = {
      [userId]: {
        name: userName,
        budget: initialBudgetForCreator,
        amtLeft: initialBudgetForCreator,
        owesTotal: 0
      }
    };

    try {
      console.log("Creating trip with data:", {
          destination: destination.trim(),
          totalBudget: Number(initialBudgetForCreator),
          totalAmtLeft: Number(initialBudgetForCreator),
          userId, 
          members: initialMembers,
          debts: {}, 
          createdAt: Timestamp.now()
      });

      await addDoc(collection(db, 'trips'), {
          destination: destination.trim(),
          totalBudget: initialBudgetForCreator,
          totalAmtLeft: initialBudgetForCreator,
          userId, // Trip owner
          members: initialMembers,
          debts: {}, // Initialize empty debts map
          createdAt: Timestamp.now()
      });

      setDestination('');
      router.push('/'); // Navigate home after creation

    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Please try again."); 
    }
  };


  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}>
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
            value={String(totalBudget)}
            onChangeText=
            {(text: string) => {
              const numericValue = parseFloat(text); // Or Number(text)
              setTotalBudget(isNaN(numericValue) ? 0 : numericValue); // Set to number, or 0 if input is not a valid number
            }}
            style={styles.input}
          />

          <Button title="Create Trip" onPress={() => {
            handleCreateTrip();
          }} />
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

// Add styles
const styles = StyleSheet.create({
  scrollViewContent: {
      flexGrow: 1,
      padding: 20,
      justifyContent: 'center'
  },
  title: {
      fontSize: 24,
      fontWeight: 'bold', // Make title bold
      marginBottom: 30, // Increase spacing
      textAlign: 'center',
  },
  input: {
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#fff', // Add background
      paddingHorizontal: 15, // Increase padding
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 25, // Increase spacing
      fontSize: 16, // Set font size
  }
});
