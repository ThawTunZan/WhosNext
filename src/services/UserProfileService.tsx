// src/services/UserProfileService.ts
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase"
import { getUserPremiumStatus } from "@/src/utilities/PremiumUtilities"
import { PremiumStatus } from "@/src/types/DataTypes"

/** The shape we'll keep in `/users/{userId}` */
export interface UserProfile {
  username: string
  avatarUrl: string
  updatedAt: Date
  premiumStatus: PremiumStatus
}

/**
 * Mirror a Clerk user object into Firestore `users/{userId}`.
 * Creates or merges the document with the latest Clerk fields.
 */
export async function upsertClerkUserToFirestore(user: {
  id: string
  username?: string
  fullName?: string
  primaryEmailAddress?: { emailAddress: string }
  profileImageUrl?: string
}) {
  const ref = doc(db, "users", user.id)
  await setDoc(
    ref,
    {
      username: user.username || "",
      fullName: user.fullName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatarUrl: user.profileImageUrl || "",
      updatedAt: new Date(),
      premiumStatus: await getUserPremiumStatus(user.id) || PremiumStatus.FREE,
    },
    { merge: true }
  )
}

/** Read the profile for the current user (or create if missing) */
export async function fetchOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const ref = doc(db, "users", userId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return snap.data() as UserProfile
  } else {
    const initial: UserProfile = {
      username: "",
      avatarUrl: "",
      updatedAt: new Date(),
      premiumStatus: PremiumStatus.FREE,
    }
    await setDoc(ref, initial)
    return initial
  }
}

/** Update just these fields on the user's profile doc */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "username" | "avatarUrl">>
) {
  const ref = doc(db, "users", userId)
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date(),
  })
}
