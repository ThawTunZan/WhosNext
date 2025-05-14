  // app/(tabs)/index.tsx - Home Screen (Upgraded with React Native Paper)
  import { View, FlatList, Pressable } from 'react-native';
  import 'react-native-gesture-handler';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { useRouter } from 'expo-router';
  import { useEffect, useState } from 'react';
  import { Text, Card, Title, Paragraph } from 'react-native-paper';
  import { useCurrentUser } from '@/src/hooks/useCurrentUser';
  import firestore from '@react-native-firebase/firestore';

  export default function HomeScreen() {
    const router = useRouter();
    const [trips, setTrips] = useState<any[]>([]);
    const { id: currUserId } = useCurrentUser();

    useEffect(() => {
    if (!currUserId) return;

    const unsubscribe = firestore()
      .collection('trips')
      .where('currUserId', '==', currUserId)
      .onSnapshot(snapshot => {
        const tripData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTrips(tripData);
      });

    return () => unsubscribe();
  }, [currUserId]);

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 }}>
          {/*<IconButton
            icon="theme-light-dark"
            onPress={toggleTheme}
          />*/}
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
