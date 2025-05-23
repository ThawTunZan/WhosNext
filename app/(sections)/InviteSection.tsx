// app/(sections)/InviteSection.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Share, ActivityIndicator } from 'react-native'
import { Button, Text, Snackbar } from 'react-native-paper'
import * as Linking from 'expo-linking'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { createInvite } from '@/src/services/InviteUtilities'
import QRCode from 'react-native-qrcode-svg';
import { ScrollView } from 'react-native';


type InviteSectionProps = { tripId: string }

export default function InviteSection({ tripId }: InviteSectionProps) {
  const { isLoaded, isSignedIn, user } = useUser()
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [showQR, setShowQR] = useState(false)

  // 1. Guard: wait for Clerk, redirect if not signed in
  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />
  console.log("INVITE SECTION LOADED")

  const inviteUrl = `https://myapp.com/invite?tripId=${tripId}`


  const userId = user.id
  const userName =
    user.fullName ??
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  // 2. Create a fresh invite whenever this section mounts
  useEffect(() => {
    let mounted = true
    setLoading(true)
    createInvite(tripId, { id: userId, name: userName })
      .then((id) => {
        if (mounted) {
            setInviteId(id);
            console.log('DEV INVITE URL:', Linking.createURL(`invite/${id}`))
        }
      })
      .catch((err) => {
        console.error('Failed to create invite:', err)
        setSnackbarMessage('Error generating invite link.')
        setSnackbarVisible(true)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [tripId, userId, userName])

  // 3. Handler: share the link
  const handleShareLink = useCallback(async () => {
    if (!inviteId) return
    const url = Linking.createURL(`invite/${inviteId}`)
    try {
      await Share.share({
        message: `Join my trip on Who’s Next:\n\n${url}`,
      })
    } catch (err) {
      console.error('Share error:', err)
      setSnackbarMessage('Error sharing invite link.')
      setSnackbarVisible(true)
    }
  }, [inviteId])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} size="large" />
      ) : (
        <>
          <Text style={styles.header}>Invite Friends</Text>
          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShareLink}
            disabled={!inviteId}
            style={styles.button}
          >
            Share Invite Link
          </Button>
          <Button
            mode="outlined"
            icon="qrcode-scan"
            onPress={() => setShowQR(true)}
            style={styles.button}
          >
            Show QR Code
          </Button>

          {showQR && inviteId && (
            <View style={styles.qrWrapper}>
              <QRCode
                value={Linking.createURL(`invite/${inviteId}`)} // This generates your deep link
                size={200}
              />
            </View>
          )}
        </>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  qrWrapper: {
    marginTop: 24,
    marginBottom: 60, // prevent overlap with bottom nav
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    marginBottom: 16,
    fontWeight: '600',
  },
  button: {
    marginVertical: 8,
    width: '100%',
  },
})
