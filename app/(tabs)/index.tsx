// app/(tabs)/index.tsx - Home Screen (Upgraded with React Native Paper + Clerk)
import { useEffect, useState } from 'react'
import { View, FlatList, Pressable } from 'react-native'
import 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useRouter, Redirect } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'
import { db } from '../../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Text, Card, Title, Paragraph, IconButton } from 'react-native-paper'

export default function HomeScreen() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [trips, setTrips] = useState<Array<{ id: string; destination: string; totalBudget: number }>>([])

  // 1) Wait for Clerk to initialize
  if (!isLoaded) {
    return null
  }

  // 2) Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />
  }

  // 3) Now that we're signed in, use the real user ID
  const userId = user.id

  useEffect(() => {
    const q = query(collection(db, 'trips'), where('userId', '==', userId))
    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      setTrips(data)
    })
    return unsubscribe
  }, [userId])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 }}>
          <IconButton icon="theme-light-dark" onPress={() => { /* your theme toggle */ }} />
        </View>

        <Text variant="headlineMedium" style={{ marginBottom: 20 }}>
          🏠 Your Trips
        </Text>

        <FlatList
          data={trips}
          keyExtractor={item => item.id}
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
  )
}
