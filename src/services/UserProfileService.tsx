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
  username?: string
  fullName?: string
  primaryEmailAddress?: { emailAddress: string }
  profileImageUrl?: string
}) {
  const ref = doc(db, "users", user.username)
  await setDoc(
    ref,
    {
      username: user.username || "",
      fullName: user.fullName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatarUrl: user.profileImageUrl || "",
      updatedAt: new Date(),
      premiumStatus: await getUserPremiumStatus(user.username) || PremiumStatus.FREE,
    },
    { merge: true }
  )
}
