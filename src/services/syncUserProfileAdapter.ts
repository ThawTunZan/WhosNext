// src/services/syncUserProfileAdapter.ts
// Syncs a Clerk-style user payload into your single-table DynamoDB via DynamoDBService.
// Uses userId (stable) for all keys. No Amplify.

import type { UserDDB, PremiumStatus } from "@/src/types/DataTypes";
import {
  createUserIfNotExists,
  getUserById,
  updateUserProfile,
} from "@/src/aws-services/DynamoDBService";

type ClerkLikeUser = {
  id: string;                 // stable Clerk userId (required)
  username?: string | null;   // optional display username
  primaryEmailAddress?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

function deriveUsername(u: ClerkLikeUser): string {
  const emailLocal = u.primaryEmailAddress?.split("@")[0];
  return (u.username || emailLocal || u.id || "user").trim();
}

function deriveFullName(u: ClerkLikeUser): string {
  const first = (u.firstName || "").trim();
  const last = (u.lastName || "").trim();
  const name = `${first} ${last}`.trim();
  return name || deriveUsername(u);
}

export class UserSyncService {
  /**
   * Create-or-update the user profile in DynamoDB from a Clerk-like payload.
   * - Creates the user row if missing (atomic).
   * - If exists: skip if last updated < 30 min ago; else update only if fields changed.
   * Returns the up-to-date UserDDB.
   */
  static async applyUserSync(clerkUser: ClerkLikeUser): Promise<UserDDB> {
    if (!clerkUser || !clerkUser.id) {
      throw new Error("UserSyncService.applyUserSync: missing clerkUser.id");
    }

    const userId = clerkUser.id;
    const username = deriveUsername(clerkUser);
    const email = (clerkUser.primaryEmailAddress || "").trim();
    const fullName = deriveFullName(clerkUser);
    const avatarUrl = (clerkUser.imageUrl || "").trim();

    // 1) Create user if not exists
    const { created, user } = await createUserIfNotExists({
      userId,
      username,
      email,
      fullName,
      avatarUrl,
      premiumStatus: "free" as PremiumStatus,
      friends: [],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      trips: [],
    });

    if (created) {
      return user;
    }

    // 2) Already exists — fetch current
    const existing = await getUserById(userId);
    if (!existing) {
      // Safety net: should not happen because createUserIfNotExists said not created,
      // but no item found. In this rare case, create again without condition.
      const { user: fallbackUser } = await createUserIfNotExists({
        userId,
        username,
        email,
        fullName,
        avatarUrl,
        premiumStatus: "free" as PremiumStatus,
      });
      return fallbackUser;
    }

    // 3) Skip if synced within last 30 minutes
    const last = new Date(existing.updatedAt);
    if (Number.isFinite(last.getTime())) {
      const secondsSince = (Date.now() - last.getTime()) / 1000;
      if (secondsSince < 1800) {
        return existing;
      }
    }

    // 4) Update only if changed
    const changed =
      (email && email !== existing.email) ||
      (fullName && fullName !== existing.fullName) ||
      (avatarUrl && avatarUrl !== (existing.avatarUrl ?? ""));

    if (!changed) {
      return existing;
    }

    const updated = await updateUserProfile(userId, {
      email,
      fullName,
      avatarUrl,
    });
    return updated;
  }
}
