
import { UserSyncService } from "./syncUserProfileAdapter"
import { UserDDB } from "@/src/types/DataTypes"

/** The shape we'll keep in DynamoDB */
export interface UserProfile {
  username: string
  avatarUrl: string
  updatedAt: Date
  premiumStatus: string
}

/**
 * Mirror a Clerk user object into DynamoDB.
 * Creates or merges the user with the latest Clerk fields.
 */
export async function syncUserProfileToDynamoDB(user: UserDDB) {
  if (!user || !user.username) {
    console.warn("syncUserProfileToDynamoDB: user or user.username is undefined, skipping sync.");
    console.log("User data received:", user);
    return;
  }

  try {
    const clerkUser = {
      id: user.username,
      username: user.username,
      primaryEmailAddress: user.email,
      firstName: user.fullName?.split(' ')[0] || '',
      lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
      imageUrl: user.avatarUrl || ''
    };

    await UserSyncService.applyUserSync(clerkUser);
    console.log('User synced to DynamoDB successfully');
  } catch (error) {
    console.error('Error syncing user to DynamoDB:', error);
    throw error;
  }
}

