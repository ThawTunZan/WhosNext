// File: app/profile.tsx
import React from "react"
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native"
import { Text } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useClerk, useUser } from "@clerk/clerk-expo"

import { upsertClerkUserToFirestore } from "@/src/services/UserProfileService"
import { useProfileActions } from "@/src/utilities/profileAction"

export default function ProfileScreen() {
  const router = useRouter()
  const { onEditProfile, onLogout } = useProfileActions()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  if (!isLoaded || !isSignedIn) {
    return null
  }

  // Fallback avatar
  const avatarUri = "https://placekitten.com/200/200"
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        upsertClerkUserToFirestore(user).catch(console.error);
      }
    }, [user])
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profilePicContainer}>
        <Image source={{ uri: avatarUri }} style={styles.profilePic} />
      </View>

      {/* Settings List */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={onEditProfile}
        >
          <Text style={styles.settingText}>Edit Profile</Text>
          <Ionicons name="pencil-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>App Settings</Text>
          <Ionicons name="settings-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Privacy Settings</Text>
          <Ionicons name="lock-closed-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Referral / Invite Code</Text>
          <Ionicons name="share-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Change Password</Text>
          <Ionicons name="key-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={onLogout}
        >
          <Text style={styles.settingText}>Logout</Text>
          <Ionicons name="log-out-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Rate Who’s Next</Text>
          <Ionicons name="star-outline" size={20} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Contact Us</Text>
          <Ionicons name="call-outline" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profilePicContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  settingsContainer: {
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  settingText: {
    fontSize: 18,
  },
})
