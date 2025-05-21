// File: src/utils/profileActions.ts

import { useClerk } from "@clerk/clerk-expo"
import { useUser } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { upsertClerkUserToFirestore } from "@/src/services/UserProfileService"

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

  /** Navigate to your custom Profile Settings screen */
  const onEditProfile = () => {
    router.push("/profile_screens/ProfileSettingsScreen")
  }

  /** Sign out via Clerk and send the user to the sign-in page */
  const onLogout = async () => {
    await signOut()
    router.replace("/auth/sign-in")
  }

  /**
   * Mirror the current Clerk user into your Firestore `users/{id}` doc.
   * Call this in a focus‐effect or whenever you want to keep Firestore in sync.
   */
  const syncProfile = () => {
    if (isLoaded && isSignedIn && user) {
      upsertClerkUserToFirestore(user).catch(console.error)
    }
  }

  return {
    onEditProfile,
    onLogout,
    syncProfile,
  }
}
