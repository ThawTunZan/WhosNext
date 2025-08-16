import { generateClient } from 'aws-amplify/api';
import { createUser, updateUser } from '@/src/graphql/mutations';
import { getUserByUsername as getUserByUsernameQuery } from '@/src/graphql/queries';
import { UserFromDynamo } from '@/src/types/DataTypes';

export class UserSyncService {
  private static client = generateClient();

  // Sync user data from Clerk to DynamoDB
  static async applyUserSync(clerkUser: any) {
    try {
      if (!clerkUser) {
        throw new Error('No authenticated user found');
      }

      const userData = {
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        avatarUrl: clerkUser.imageUrl || '',
        premiumStatus: 'free' as any,
        friends: [],
        trips: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('User data to sync:', userData);
      
      const existingUser = await this.getUserData(userData.username);

      if (existingUser?.items?.length > 0) {
        const existing = existingUser.items[0];

        // Check if recently synced (within 30 minutes)
        const lastSync = new Date(existing.updatedAt);
        const now = new Date();
        const secondsSinceLastSync = (now.getTime() - lastSync.getTime()) / 1000;
        if (secondsSinceLastSync < 1800) {
          console.log('[UserSyncService] Skipping sync - user recently synced.');
          return existing;
        }

        // Check if values have changed
        const shouldUpdate = (
          userData.email !== existing.email ||
          userData.fullName !== existing.fullName ||
          userData.avatarUrl !== existing.avatarUrl
        );

        if (shouldUpdate) {
          return await this.updateUserData(userData.username, userData);
        } else {
          console.log('[UserSyncService] No changes detected. Skipping update.');
          return existing;
        }
      }

      // Create new user if user not found
      const result = await this.client.graphql({
        query: createUser,
        variables: {
          input: userData
        }
      });

      console.log('User created successfully:', result);
      return result.data.createUser;
    } catch (error) {
      console.error('Error syncing user from Clerk:', error);
      throw error;
    }
  }

  // Update user data in DynamoDB
  static async updateUserData(username: string, updates: Partial<any>) {
    try {
      // Filter out fields that are not expected by UpdateUserInput
      const { incomingFriendRequests, outgoingFriendRequests, ...validUpdates } = updates;
      
      const result = await this.client.graphql({
        query: updateUser,
        variables: {
          input: {
            id: username,
            ...validUpdates,
            updatedAt: new Date().toISOString()
          }
        }
      });

      console.log('User updated successfully:', result);
      return result.data.updateUser;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Get user data from DynamoDB
  static async getUserData(username: string) {
    
    try {
      const result = await this.client.graphql({
        query: getUserByUsernameQuery,
        variables: {
          username
        }
      });

      console.log('User data retrieved:', result);
      return result.data.getUserByUsername;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }
}