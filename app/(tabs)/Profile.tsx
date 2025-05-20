// File: app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';



export default function ProfileScreen() {
    
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      await signOut();               // Clerk sign out
      router.replace('/auth/sign-in'); // Redirect to login
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

    return (
      <ScrollView style={styles.container}>
        {/* Profile Picture Section */}
        <View style={styles.profilePicContainer}>
          <Image
            source={{ uri: 'https://placekitten.com/200/200' }} // Placeholder image for profile picture
            style={styles.profilePic}
          />
        </View>

       {/* Profile Details and Settings */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Edit Profile</Text>
            <Ionicons name="pencil-outline" size={20} color="black" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Ionicons name="lock-closed-outline" size={20} color="black" />
          </TouchableOpacity>

         <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="notifications-outline" size={20} color="black" />
          </TouchableOpacity>

         <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons name="key-outline" size={20} color="black" />
          </TouchableOpacity>

         <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Language</Text>
            <Ionicons name="language-outline" size={20} color="black" />
          </TouchableOpacity>

         <TouchableOpacity style={styles.settingItem}  onPress={handleLogout}>
            <Text style={styles.settingText}>Logout</Text>
            <Ionicons name="log-out-outline" size={20} color="black" />
          </TouchableOpacity>

         <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Rate Whos Next</Text>
            <Ionicons name="star-half-outline" size={20} color="black" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Contact us</Text>
            <Ionicons name="call-outline" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profilePicContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  settingsContainer: {
    marginLeft: 20,
    marginRight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  settingText: {
    fontSize: 18,
  },
});
