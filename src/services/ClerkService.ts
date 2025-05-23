// src/services/ClerkService.ts

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Fetches the canonical username for a given userId.
 * 
 * @param userId  The Clerk/Firebase Auth UID of the user.
 * @returns       The username string stored in your Firestore `users` collection.
 * @throws        If no user-doc is found or on network errors.
 */
export async function getUsernameById(userId: string): Promise<string> {
  if (!userId) {
    throw new Error("getUsernameById: userId is required");
  }

  // 1) Try to read the user's profile doc from Firestore
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error(`User profile not found for ID: ${userId}`);
  }

  const data = snap.data();
  if (!data.username || typeof data.username !== "string") {
    throw new Error(`username field is missing or invalid for user ${userId}`);
  }

  return data.username;
}


