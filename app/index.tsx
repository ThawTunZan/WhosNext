// File: app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, Redirect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../firebase'; // adjust path if needed
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Text, Card, Title, Paragraph, IconButton } from 'react-native-paper';

export default function Index() {
  // 1) All hooks at the top, always
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [trips, setTrips] = useState<Array<{ id: string; destination: string; totalBudget: number }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, 'trips'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      setTrips(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [user?.id]);

  // 2) Now it’s safe to early-return
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
        >
          <IconButton
            icon="theme-light-dark"
            onPress={() => {
              /* TODO: toggle theme */
            }}
          />
        </View>

        <Text
          variant="headlineMedium"
          style={{ marginBottom: 20 }}
        >
          🏠 Your Trips
        </Text>

        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push(`/trip/${item.id}`)
              }
            >
              <Card style={{ marginBottom: 16 }}>
                <Card.Content>
                  <Title>{item.destination}</Title>
                  <Paragraph>
                    💰 Budget: ${item.totalBudget}
                  </Paragraph>
                </Card.Content>
              </Card>
            </Pressable>
          )}
        />
      </View>
    </GestureHandlerRootView>
  );
}
