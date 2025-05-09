  // app/(tabs)/index.tsx - Home Screen (Upgraded with React Native Paper)
  import { View, FlatList, Pressable } from 'react-native';
  import 'react-native-gesture-handler';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { useRouter } from 'expo-router';
  import { useEffect, useState } from 'react';
  import { db } from '../../firebase';
  import { collection, query, where, onSnapshot } from 'firebase/firestore';
  import { Text, Card, Title, Paragraph } from 'react-native-paper';
  import { useThemeContext } from '../theme/ThemeContext';
  import { IconButton } from 'react-native-paper';
  import { deleteTripDocument } from '../../src/services/TripService';
  //import * as functions from "firebase-functions";
  ///import * as admin from "firebase-admin";
/*
  admin.initializeApp();
  const db = admin.firestore();
  // Optional: Adjust settings for faster writes, etc.
  // db.settings({ ignoreUndefinedProperties: true });

  const BATCH_SIZE = 400;
  export const onTripDeleted = functions.firestore
    .document("trips/{tripId}")
    .onDelete(async (snap, context) => {
        const tripId = context.params.tripId;
        const tripPath = snap.ref.path; // Path of the deleted document
        functions.logger.log(`Trip ${tripId} deleted at path ${tripPath}, cleaning up subcollections...`);

        // Define paths to subcollections
        const expensesPath = `${tripPath}/expenses`;
        const activitiesPath = `${tripPath}/proposed_activities`;

        try {
            // Delete expenses subcollection
            await deleteCollection(db, expensesPath, BATCH_SIZE);
            functions.logger.log(`Successfully deleted expenses for trip ${tripId}`);

            // Delete proposed_activities subcollection
            await deleteCollection(db, activitiesPath, BATCH_SIZE);
            functions.logger.log(`Successfully deleted proposed activities for trip ${tripId}`);

        } catch (error) {
            functions.logger.error(`Error cleaning up subcollections for trip ${tripId}:`, error);
            // Consider adding retry logic or logging for monitoring
        }
    });


  /**
   * Deletes a collection or subcollection in batches.
   */
  /*
  async function deleteCollection(
      firestore: admin.firestore.Firestore,
      collectionPath: string,
      batchSize: number
  ): Promise<void> {
      const collectionRef = firestore.collection(collectionPath);
      // Limit query to batch size for efficiency
      const query = collectionRef.orderBy("__name__").limit(batchSize);

      return new Promise((resolve, reject) => {
          deleteQueryBatch(firestore, query, resolve).catch(reject);
      });
  }

  /**
   * Recursively deletes documents returned by a query in batches.
   */
  /*
  async function deleteQueryBatch(
      firestore: admin.firestore.Firestore,
      query: admin.firestore.Query,
      resolve: () => void
  ): Promise<void> {
      const snapshot = await query.get();

      // When there are no documents left, we are done
      if (snapshot.size === 0) {
          resolve();
          return;
      }

      // Delete documents in a batch
      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();

      // Recurse on the next process tick, to avoid exploding the stack.
      process.nextTick(() => {
          deleteQueryBatch(firestore, query, resolve);
      });
  }
*/

  export default function HomeScreen() {
    const { toggleTheme } = useThemeContext();
    const router = useRouter();
    const [trips, setTrips] = useState<any[]>([]);

    useEffect(() => {
      //const userId = auth.currentUser?.uid || 'test-user-id';
      const userId = 'test-user-id';
      const q = query(collection(db, 'trips'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tripData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTrips(tripData);
      });
      return () => unsubscribe();
    }, []);

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 }}>
          <IconButton
            icon="theme-light-dark"
            onPress={toggleTheme}
          />
        </View>
        <Text variant="headlineMedium" style={{ marginBottom: 20 }}>
          🏠 Your Trips
        </Text>

        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`./trip/${item.id}`)}>
              <Card style={{ marginBottom: 16 }}>
                <Card.Content>
                  <Title>{item.destination}</Title>
                  <Paragraph>💰 Budget: ${item.totalBudget}</Paragraph>
                </Card.Content>
              </Card>
            </Pressable>
          )}
        />
      </View>
      </GestureHandlerRootView>
    );
  }
