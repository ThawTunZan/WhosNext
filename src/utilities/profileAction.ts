// File: src/utils/profileActions.ts

import { useClerk } from "@clerk/clerk-expo"
import { useUser } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { upsertClerkUserToDynamoDB } from "@/src/services/syncUserProfile"
import { useUserTripsContext } from "../context/UserTripsContext"

/**
 * A custom hook that centralizes all "profile screen" actions:
 *  - onEditProfile: navigate into your ProfileSettingsScreen
 *  - onLogout: sign the user out and redirect to sign-in
 *  - syncProfile: mirror the Clerk user into Firestore
 */
export function useProfileActions() {
  const router = useRouter()
  const { openUserProfile, signOut } = useClerk()
  const { user, isLoaded, isSignedIn } = useUser()
  const {userData} = useUserTripsContext()

  /** Navigate to your custom Profile Settings screen */
  const onEditProfile = () => {
    router.push("/profile_screens/ProfileSettingsScreen")
  }

  /** Sign out via Clerk and send the user to the sign-in page */
  const onLogout = async () => {
    await signOut()
    router.push("/auth/sign-in")
  }
  const onChangePassword = async () => {
    router.push("/profile_screens/ChangePasswordScreen/")
  }

  /**
   * Mirror the current Clerk user into DynamoDB
   */
  const syncProfile = () => {
    if (isLoaded && isSignedIn && user && userData) {
      // Convert Clerk user to the format expected by UserProfileService
      const UserFromDynamo = {
        username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        primaryEmailAddress: {
          emailAddress: user.primaryEmailAddress?.emailAddress || ''
        },
        profileImageUrl: user.imageUrl || '',
        friends: userData?.friends || [],
        incomingFriendRequests: userData?.incomingFriendRequests || [],
        outgoingFriendRequests: userData?.outgoingFriendRequests || [],
        trips: userData?.trips || [],
        premiumStatus: userData?.premiumStatus || 'free'
      };
      
      upsertClerkUserToDynamoDB(UserFromDynamo).catch(console.error)
    }
  }

  return {
    onEditProfile,
    onLogout,
    syncProfile,
    onChangePassword,
  }
}
