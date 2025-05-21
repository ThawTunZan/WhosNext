// app/edit-profile.tsx
import React, { useState, useEffect } from "react"
import { Redirect, useRouter } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import * as ImagePicker from "expo-image-picker"
import { Alert } from "react-native"
import EditProfileView from "@/src/profile page/EditProfileView"
import {
  fetchOrCreateUserProfile,
  updateUserProfile,
  UserProfile,
} from "@/src/services/UserProfileService"

export default function ProfileSettingsScreen() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />

  const userId = user.id
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  // load from Firestore
  useEffect(() => {
    fetchOrCreateUserProfile(userId).then(setProfile).catch(console.error)
  }, [userId])

  // pick avatar
  const onPickAvatar = async () => {
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })
    if (!canceled && profile) {
      setProfile({ ...profile, avatarUrl: assets[0].uri })
    }
  }

  // save
  const onSave = async () => {
    if (!profile) return
    setLoading(true)
    try {
      await updateUserProfile(userId, {
        username: profile.username.trim(),
        avatarUrl: profile.avatarUrl,
      })
      Alert.alert("Saved!", "Your profile was updated.")
      router.back()
    } catch (err: any) {
      console.error(err)
      Alert.alert("Error", err.message || "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  return profile ? (
    <EditProfileView
      username={profile.username}
      avatarUrl={profile.avatarUrl}
      loading={loading}
      onChangeUsername={(u) => setProfile({ ...profile, username: u })}
      onPickAvatar={onPickAvatar}
      onSave={onSave}
      onCancel={() => router.back()}
    />
  ) : null
}
