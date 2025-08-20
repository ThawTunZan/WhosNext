// File: app/profile.tsx
import React, { useState } from "react"
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native"
import { Text, Surface, } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useClerk, useUser } from "@clerk/clerk-expo"
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '@/src/context/ThemeContext'
import { lightTheme, darkTheme } from '@/src/theme/theme'
import { syncUserProfileToDynamoDB } from "@/src/services/syncUserProfile"
import { useProfileActions } from "@/src/utilities/profileAction"
import { useUserTripsContext } from "@/src/context/UserTripsContext"
import { PremiumStatus } from "@/src/types/DataTypes"


const SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'App Settings', icon: 'settings-outline', route: '/profile/profile_screens/AppSettings' },
      { label: 'Edit Profile', icon: 'create-outline', route: '/profile/profile_screens/EditProfileScreen' },
      { label: 'Payment Methods', icon: 'card-outline', route: '/profile/profile_screens/PaymentMethodsScreen' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Notification Settings', icon: 'notifications-outline', route: '/profile/profile_screens/NotificationSettingsScreen' },
      { label: 'Rate Who\'s Next', icon: 'star-outline', route: '/profile/profile_screens/rate' },
      { label: 'Contact Us', icon: 'mail-outline', route: '/profile/profile_screens/ContactUsScreen' },
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
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? darkTheme : lightTheme
  const { trips, user:userData } = useUserTripsContext()
  const [friendCount, setFriendCount] = useState<number>(0);


  if (!isLoaded || !isSignedIn) {
    return null
  }

  useFocusEffect(
    React.useCallback(() => {
      if (user && userData?.friends) {
        // Convert Clerk user to the format expected by UserProfileService
        const UserFromDynamo = {
          id: user.id,
          username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          email: user.primaryEmailAddress?.emailAddress || '',
          profileImageUrl: user.imageUrl || '',
          friends: userData?.friends || [],
          incomingFriendRequests: userData?.incomingFriendRequests || [],
          outgoingFriendRequests: userData?.outgoingFriendRequests || [],
          premiumStatus: userData?.premiumStatus || PremiumStatus.FREE,
          createdAt: userData?.createdAt || new Date().toISOString(),
          updatedAt: userData?.updatedAt || new Date().toISOString(),
        };

        syncUserProfileToDynamoDB(UserFromDynamo).catch(console.error);
        setFriendCount(userData.friends.length);
      }
    }, [user, userData])
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
          // For now,  just show an alert
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
      case 'onLogout':
        onLogout()
        break
    }
  }

  const tripCount = trips ? trips.length : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.username, { color: theme.colors.text }]}>{user?.username || 'Unknown username'}</Text>
        <Text style={[styles.email, { color: theme.colors.subtext }]}>{user?.emailAddresses[0].emailAddress}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{tripCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{friendCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>Friends</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
            <Surface style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]} elevation={1}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                    { borderBottomColor: theme.colors.border }
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
                      name={item.icon as any} 
                      size={22} 
                      color={item.danger ? '#EF4444' : theme.colors.text} 
                    />
                    <Text style={[
                      styles.settingText,
                      { color: theme.colors.text },
                      item.danger && styles.dangerText,
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={item.danger ? '#EF4444' : theme.colors.subtext} 
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
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
  },
  email: {
    fontSize: 16,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#EF4444',
  },
});
