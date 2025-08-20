// src/services/syncUserProfile.ts
// Thin wrapper that your app calls with a UserDDB-like object,
// converts it to a Clerk-like payload, and delegates to the adapter.

import { UserSyncService } from "./syncUserProfileAdapter";
import type { UserDDB } from "@/src/types/DataTypes";

/** Optional local interface (for docs only) */
export interface UserProfile {
  username: string;
  avatarUrl: string;
  updatedAt: Date;
  premiumStatus: string;
}

/**
 * Mirror a UserDDB object (from your app) into DynamoDB.
 * - Requires user.id (treated as userId)
 * - Uses username/email/fullName/avatarUrl if provided
 */
export async function syncUserProfileToDynamoDB(user: UserDDB) {
  if (!user || !user.id) {
    console.warn(
      "syncUserProfileToDynamoDB: user or user.id is undefined, skipping sync."
    );
    console.log("User data received:", user);
    return;
  }

  try {
    // Build a minimal Clerk-like payload expected by the adapter.
    const item = {
    PK: `USER#${user.id}`,
    SK: `PROFILE`,
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl || "",
    premiumStatus: user.premiumStatus,
    friends: user.friends || [],
    incomingFriendRequests: user.incomingFriendRequests || [],
    outgoingFriendRequests: user.outgoingFriendRequests || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

    await UserSyncService.applyUserSync(item);
    console.log("User synced to DynamoDB successfully");
  } catch (error) {
    console.error("Error syncing user to DynamoDB:", error);
    throw error;
  }
}
