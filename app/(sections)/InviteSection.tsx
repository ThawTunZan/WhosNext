// app/(sections)/InviteSection.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { View, Share, ScrollView } from 'react-native'
import { Button, Text, Snackbar } from 'react-native-paper'
import * as Linking from 'expo-linking'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { createInvite } from '@/src/utilities/InviteUtilities'
import QRCode from 'react-native-qrcode-svg';
import { BaseSection } from '@/app/common_components/BaseSection';
import { CommonCard } from '@/app/common_components/CommonCard';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/app/styles/section_comp_styles';

type InviteSectionProps = { tripId: string }

export default function InviteSection({ tripId }: InviteSectionProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
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
        message: `Join my trip on Who's Next:\n\n${url}`,
      })
    } catch (err) {
      console.error('Share error:', err)
      setSnackbarMessage('Error sharing invite link.')
      setSnackbarVisible(true)
    }
  }, [inviteId])

  const renderContent = () => (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
      <CommonCard
        title="Invite Friends to Your Trip"
        subtitle="Share your trip with friends using the link or QR code"
        leftIcon="account-multiple-plus"
        style={{ width: '100%', marginBottom: 20 }}
      >
        <View style={{ gap: 12 }}>
          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShareLink}
            disabled={!inviteId}
            style={sectionStyles.actionButton}
          >
            Share Invite Link
          </Button>
          <Button
            mode="outlined"
            icon="qrcode-scan"
            onPress={() => setShowQR(!showQR)}
            style={sectionStyles.actionButton}
          >
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </Button>
        </View>
      </CommonCard>

      {showQR && inviteId && (
        <CommonCard
          title="QR Code"
          subtitle="Scan this code to join the trip"
          style={{ width: '100%' }}
        >
          <View style={{ alignItems: 'center', padding: 20 }}>
            <QRCode
              value={Linking.createURL(`invite/${inviteId}`)}
              size={200}
            />
          </View>
        </CommonCard>
      )}
    </ScrollView>
  );

  return (
    <BaseSection
      title="Invite Friends"
      icon="👥"
      loading={loading}
      keyboardAvoiding={false}
    >
      {renderContent()}
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </BaseSection>
  )
}
