import { db } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';

export const addFriend = async (userName: string, friendUsername: string) => {
  try {
    const userRef = doc(db, 'users', userName);
    await updateDoc(userRef, {
      friends: arrayUnion(friendUsername),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[FriendService] Error adding friend:', error);
    throw error;
  }
};

export const removeFriend = async (userName: string, friendUsername: string) => {
  try {
    const userRef = doc(db, 'users', userName);
    await updateDoc(userRef, {
      friends: arrayRemove(friendUsername),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[FriendService] Error removing friend:', error);
    throw error;
  }
};

// Friend requests operations
export const sendFriendRequest = async (senderUsername: string, receiverUsername: string) => {
  try {
    const receiverRef = doc(db, 'users', receiverUsername);
    const senderRef = doc(db, 'users', senderUsername);
    const timestamp = new Date().toISOString(); // Use ISO string instead of serverTimestamp
    
    await updateDoc(senderRef, {
      outgoingFriendRequests: arrayUnion({
        username: receiverUsername,
        status: 'pending',
        timestamp: timestamp,
      }),
    });

    await updateDoc(receiverRef, {
        incomingFriendRequests: arrayUnion({
          username: senderUsername,
          status: 'pending',
          timestamp: timestamp,
        }),
      });

  } catch (error) {
    console.error('[FriendService] Error sending friend request:', error);
    throw error;
  }
};

export const acceptFriendRequest = async (username: string, requesterUsername: string) => {
  try {
    // Add each other as friends
    const userRef = doc(db, 'users', username);
    const requesterRef = doc(db, 'users', requesterUsername);
    await updateDoc(userRef, {
      friends: arrayUnion(requesterUsername),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(requesterRef, {
      friends: arrayUnion(username),
      updatedAt: serverTimestamp(),
    });

    // Remove from user's incomingFriendRequests
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const incoming = userSnap.data().incomingFriendRequests || [];
      const updatedIncoming = incoming.filter((req: any) => req.username !== requesterUsername);
      await updateDoc(userRef, { incomingFriendRequests: updatedIncoming });
    }

    // Remove from requester's outgoingFriendRequests
    const requesterSnap = await getDoc(requesterRef);
    if (requesterSnap.exists()) {
      const outgoing = requesterSnap.data().outgoingFriendRequests || [];
      const updatedOutgoing = outgoing.filter((req: any) => req.username !== username);
      await updateDoc(requesterRef, { outgoingFriendRequests: updatedOutgoing });
    }
  } catch (error) {
    console.error('[FriendService] Error accepting friend request:', error);
    throw error;
  }
};

export const declineFriendRequest = async (username: string, requesterUsername: string) => {
  try {
    // Remove from user's incomingFriendRequests
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const incoming = userSnap.data().incomingFriendRequests || [];
      const updatedIncoming = incoming.filter((req: any) => req.username !== requesterUsername);
      await updateDoc(userRef, { incomingFriendRequests: updatedIncoming });
    }

    // Remove from requester's outgoingFriendRequests
    const requesterRef = doc(db, 'users', requesterUsername);
    const requesterSnap = await getDoc(requesterRef);
    if (requesterSnap.exists()) {
      const outgoing = requesterSnap.data().outgoingFriendRequests || [];
      const updatedOutgoing = outgoing.filter((req: any) => req.username !== username);
      await updateDoc(requesterRef, { outgoingFriendRequests: updatedOutgoing });
    }
  } catch (error) {
    console.error('[FriendService] Error declining friend request:', error);
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
    console.error('[FriendService] Error searching users:', error);
    throw error;
  }
};

// Block user operations
export const blockUser = async (userName: string, blockUserName: string) => {
  try {
    const userRef = doc(db, 'users', userName);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(blockUserName),
      friends: arrayRemove(blockUserName), // Remove from friends if they were friends
    });
    const blockedUserRef = doc(db, 'users', blockUserName);
    await updateDoc(blockedUserRef, {
      blockedBy: arrayUnion(userName),
    });
  } catch (error) {
    console.error('[FriendService] Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (username: string, blockUsername: string) => {
  try {
    const userRef = doc(db, 'users', username);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(blockUsername),
    });
    const blockedUserRef = doc(db, 'users', blockUsername);
    await updateDoc(blockedUserRef, {
      blockedBy: arrayRemove(username),
    });
  } catch (error) {
    console.error('[FriendService] Error unblocking user:', error);
    throw error;
  }
};

export const checkIfBlocked = async (username: string, targetUsername: string) => {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    return userData.blockedUsers?.includes(targetUsername) || false;
  } catch (error) {
    console.error('[FriendService] Error checking if blocked:', error);
    throw error;
  }
};
