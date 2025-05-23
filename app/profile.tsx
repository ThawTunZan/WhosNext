// File: app/profile.tsx
import React, { useState } from "react"
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from "react-native"
import { Text, Surface, Button } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useClerk, useUser } from "@clerk/clerk-expo"
import * as ImagePicker from 'expo-image-picker'

import { upsertClerkUserToFirestore } from "@/src/services/UserProfileService"
import { useProfileActions } from "@/src/utilities/profileAction"

const { width } = Dimensions.get('window')

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', icon: 'pencil-outline', action: 'onEditProfile' },
      { label: 'App Settings', icon: 'settings-outline', route: '/profile_screens/settings' },
      { label: 'Payment Methods', icon: 'card-outline', route: '/profile_screens/PaymentMethodsScreen' },
      { label: 'Change Password', icon: 'key-outline', action: 'onChangePassword' },
    ],
  },
  {
    title: 'Social',
    items: [
      { label: 'Friends & Groups', icon: 'people-outline', route: '/profile_screens/FriendsScreen' },
      { label: 'Referral / Invite Code', icon: 'share-outline', route: '/profile_screens/referral' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Privacy Settings', icon: 'lock-closed-outline', route: '/profile_screens/privacy' },
      { label: 'Rate Who\'s Next', icon: 'star-outline', route: '/profile_screens/rate' },
      { label: 'Contact Us', icon: 'call-outline', route: '/profile_screens/ContactUsScreen' },
      { label: 'Logout', icon: 'log-out-outline', action: 'onLogout', danger: true },
    ],
  },
]

export default function ProfileScreen() {
  const router = useRouter()
  const { onEditProfile, onLogout, onChangePassword } = useProfileActions()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [uploading, setUploading] = useState(false)

  if (!isLoaded || !isSignedIn) {
    return null
  }

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        upsertClerkUserToFirestore(user).catch(console.error);
      }
    }, [user])
  );

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled) {
        setUploading(true)
        try {
          // TODO: Implement image upload to storage and update user profile
          // For now, we'll just show an alert
          Alert.alert('Success', 'Profile photo updated!')
        } catch (error) {
          Alert.alert('Error', 'Failed to update profile photo')
        } finally {
          setUploading(false)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'onEditProfile':
        onEditProfile()
        break
      case 'onChangePassword':
        onChangePassword()
        break
      case 'onLogout':
        onLogout()
        break
    }
  }

  const stats = [
    { label: 'Trips', value: '12' },
    { label: 'Friends', value: '48' },
    { label: 'Expenses', value: '256' },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
            <View style={styles.profilePicContainer}>
              <Image 
                source={{ uri: user.imageUrl || "https://placekitten.com/200/200" }} 
                style={styles.profilePic} 
              />
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.name}>{user.fullName || user.username}</Text>
          <Text style={styles.email}>{user.primaryEmailAddress?.emailAddress}</Text>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Surface style={styles.sectionContent} elevation={1}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={() => {
                    if (item.action) {
                      handleAction(item.action)
                    } else if (item.route) {
                      router.push(item.route)
                    }
                  }}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons 
                      name={item.icon} 
                      size={22} 
                      color={item.danger ? '#EF4444' : '#374151'} 
                    />
                    <Text style={[
                      styles.settingText,
                      item.danger && styles.dangerText,
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={item.danger ? '#EF4444' : '#9CA3AF'} 
                  />
                </TouchableOpacity>
              ))}
            </Surface>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
    marginBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  dangerText: {
    color: '#EF4444',
  },
});
