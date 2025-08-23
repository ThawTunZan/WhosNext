// File: src/utils/profileActions.ts

import { useClerk } from "@clerk/clerk-expo"
import { useUser } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { upsertUserFromClerk } from "@/src/firebase/FirebaseUserService"
import { useUserTripsContext } from "../context/UserTripsContext"
import { PremiumStatus, UserDDB } from "../types/DataTypes"

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
  const { user: userData } = useUserTripsContext()

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
      const UserFromDynamo: UserDDB = {
        id: user.id,
        username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatarUrl: user.imageUrl || '',
        friends: userData?.friends || [],
        incomingFriendRequests: userData?.incomingFriendRequests || [],
        outgoingFriendRequests: userData?.outgoingFriendRequests || [],
        premiumStatus: userData?.premiumStatus || PremiumStatus.FREE,
        createdAt: user.createdAt.toString(),
        updatedAt: user.updatedAt.toString(),
        trips: userData.trips || [],
      };
      
      upsertUserFromClerk(UserFromDynamo).catch(console.error)
    }
  }

  return {
    onEditProfile,
    onLogout,
    syncProfile,
    onChangePassword,
  }
}
