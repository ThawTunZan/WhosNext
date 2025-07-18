// src/services/UserProfileService.ts
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase"
import { getUserPremiumStatus } from "@/src/utilities/PremiumUtilities"
import { PremiumStatus, UserFromFirebase } from "@/src/types/DataTypes"

/** The shape we'll keep in `/users/{username}` */
export interface UserProfile {
  username: string
  avatarUrl: string
  updatedAt: Date
  premiumStatus: PremiumStatus
}

/**
 * Mirror a Clerk user object into Firestore `users/{username}`.
 * Creates or merges the document with the latest Clerk fields.
 */
export async function upsertClerkUserToFirestore(user: UserFromFirebase) {
  if (!user || !user.username) {
    console.warn("upsertClerkUserToFirestore: user or user.username is undefined, skipping upsert.");
    return;
  }
  const ref = doc(db, "users", user.username)
  await setDoc(
    ref,
    {
      username: user.username || "",
      fullName: user.fullName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatarUrl: user.profileImageUrl || "",
      friends: user.friends || [],
      incomingFriendRequests: user.incomingFriendRequests || [],
      outgoingFriendRequests: user.outgoingFriendRequests || [],
      updatedAt: new Date(),
      premiumStatus: await getUserPremiumStatus(user) || PremiumStatus.FREE,
      trips: user.trips || []
    },
    { merge: true }
  )
}
