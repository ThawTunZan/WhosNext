import { db } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';

// User-related operations
export const getUserById = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const getUserByUsername = async (username: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Friend-related operations
export const getFriendsList = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];
    
    const userData = userSnap.data();
    return userData.friends || [];
  } catch (error) {
    console.error('Error getting friends list:', error);
    throw error;
  }
};

export const addFriend = async (userId: string, friendId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      friends: arrayUnion(friendId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding friend:', error);
    throw error;
  }
};

export const removeFriend = async (userId: string, friendId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      friends: arrayRemove(friendId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

// Friend requests operations
export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  try {
    const receiverRef = doc(db, 'users', receiverId);
    const senderRef = doc(db, 'users', senderId);
    const timestamp = new Date().toISOString(); // Use ISO string instead of serverTimestamp
    
    await updateDoc(senderRef, {
      outgoingFriendRequests: arrayUnion({
        receiverId: receiverId,
        status: 'pending',
        timestamp: timestamp,
      }),
    });

    await updateDoc(receiverRef, {
        incomingFriendRequests: arrayUnion({
          senderId: senderId,
          status: 'pending',
          timestamp: timestamp,
        }),
      });

  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

export const acceptFriendRequest = async (userId: string, requesterId: string) => {
  try {
    // Get both users' data to find the request with timestamp
    const userData = await getUserById(userId);
    const requesterData = await getUserById(requesterId);

    if (!userData || !requesterData) {
      throw new Error('Could not find user data');
    }

    // Find the matching request with its timestamp
    const incomingRequest = userData?.incomingFriendRequests?.find(
      (request: any) => request.senderId === requesterId && request.status === 'pending'
    );
    
    const outgoingRequest = requesterData?.outgoingFriendRequests?.find(
      (request: any) => request.receiverId === userId && request.status === 'pending'
    );

    if (!incomingRequest || !outgoingRequest) {
      throw new Error('Could not find matching friend request');
    }

    // Add each user to the other's friends list
    await Promise.all([
      addFriend(userId, requesterId),
      addFriend(requesterId, userId),
    ]);

    // Remove the friend request using the timestamp
    const userRef = doc(db, 'users', userId);
    const requesterRef = doc(db, 'users', requesterId);
    
    await updateDoc(userRef, {
      incomingFriendRequests: arrayRemove({
        senderId: requesterId,
        status: 'pending',
        timestamp: incomingRequest.timestamp,
      }),
    });
    
    await updateDoc(requesterRef, {
      outgoingFriendRequests: arrayRemove({
        receiverId: userId,
        status: 'pending',
        timestamp: outgoingRequest.timestamp,
      }),
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

export const declineFriendRequest = async (userId: string, requesterId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const requesterRef = doc(db, 'users', requesterId);
    await updateDoc(userRef, {
      incomingFriendRequests: arrayRemove({
        senderId: requesterId,
        status: 'pending',
      }),
    });
    await updateDoc(requesterRef, {
        outgoingFriendRequests: arrayRemove({
          receiverId: userId,
          status: 'pending',
        }),
      });
  } catch (error) {
    console.error('Error declining friend request:', error);
    throw error;
  }
};

// User search operations
export const searchUsers = async (searchTerm: string, currentUserId: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.id !== currentUserId); // Exclude current user
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// User status operations
export const updateUserStatus = async (userId: string, status: 'online' | 'offline') => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Block user operations
export const blockUser = async (userId: string, blockedUserId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(blockedUserId),
      friends: arrayRemove(blockedUserId), // Remove from friends if they were friends
    });
    const blockedUserRef = doc(db, 'users', blockedUserId);
    await updateDoc(blockedUserRef, {
      blockedBy: arrayUnion(userId),
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (userId: string, blockedUserId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(blockedUserId),
    });
    const blockedUserRef = doc(db, 'users', blockedUserId);
    await updateDoc(blockedUserRef, {
      blockedBy: arrayRemove(userId),
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

// Utility functions
export const checkIfFriends = async (userId1: string, userId2: string) => {
  try {
    const user1Friends = await getFriendsList(userId1);
    return user1Friends.includes(userId2);
  } catch (error) {
    console.error('Error checking if friends:', error);
    throw error;
  }
};

export const checkIfBlocked = async (userId: string, targetUserId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    return userData.blockedUsers?.includes(targetUserId) || false;
  } catch (error) {
    console.error('Error checking if blocked:', error);
    throw error;
  }
};
