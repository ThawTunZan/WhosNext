  // app/(tabs)/index.tsx - Home Screen (Upgraded with React Native Paper)
  import { View, FlatList, Pressable } from 'react-native';
  import 'react-native-gesture-handler';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { useRouter } from 'expo-router';
  import { useEffect, useState } from 'react';
  import { db } from '../../firebase';
  import { collection, query, where, onSnapshot } from 'firebase/firestore';
  import { Text, Card, Title, Paragraph } from 'react-native-paper';
  //import { useThemeContext } from '../../src/theme/ThemeContext';
  import { IconButton } from 'react-native-paper';
  import {DUMMY_USER_ID, DUMMY_USER_NAME} from '../../src/constants/auth';

  export default function HomeScreen() {
    //const { toggleTheme } = useThemeContext();
    const router = useRouter();
    const [trips, setTrips] = useState<any[]>([]);

    useEffect(() => {
      //const userId = auth.currentUser?.uid || 'test-user-id';
      const userId = DUMMY_USER_ID;
      const q = query(collection(db, 'trips'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tripData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTrips(tripData);
      });
      return () => unsubscribe();
    }, []);
    function doNothing () {
      return;
    }
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 }}>
          <IconButton
            icon="theme-light-dark"
            onPress={doNothing}
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
