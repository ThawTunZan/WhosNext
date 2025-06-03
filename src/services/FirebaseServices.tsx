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
  increment,
  writeBatch,
  Timestamp,
  FieldValue,
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

// Payment-related types
export interface Payment {
  id?: string;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  method: 'cash' | 'transfer' | 'other';
  paymentDate: Date | Timestamp;
  note?: string;
  createdTime: Timestamp | FieldValue;
  createdDate: Timestamp | FieldValue;
}

// Function to record a new payment
export const firebaseRecordPayment = async (payment: Payment): Promise<void> => {
  const batch = writeBatch(db);
  
  try {
    // 1. Add the payment record
    const paymentsRef = collection(db, 'trips', payment.tripId, 'payments');
    const paymentDocRef = doc(paymentsRef);
    
    const paymentData = {
      ...payment,
    };
    paymentData.createdTime = serverTimestamp();
    paymentData.createdDate = Timestamp.now();
    
    batch.set(paymentDocRef, paymentData);

    // 2. Update the debt in the trip document
    const tripRef = doc(db, 'trips', payment.tripId);
    
    // Construct the debt key (fromUserId#toUserId)
    const debtKey = `debts.${payment.fromUserId}#${payment.toUserId}`;
    
    // Decrease the debt by the payment amount
    batch.update(tripRef, {
      [debtKey]: increment(-payment.amount),
      [`members.${payment.fromUserId}.amtLeft`]: increment(payment.amount),
      [`members.${payment.fromUserId}.owesTotal`]: increment(-payment.amount),
    });

    await batch.commit();
    console.log('Payment recorded successfully');
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Function to get all payments for a trip
export const firebaseGetTripPayments = async (tripId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'trips', tripId, 'payments');
    const q = query(paymentsRef, where('tripId', '==', tripId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];
  } catch (error) {
    console.error('Error getting trip payments:', error);
    throw error;
  }
};

// Function to get payments between two users in a trip
export const firebaseGetUserPayments = async (
  tripId: string,
  userId1: string,
  userId2: string
): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'trips', tripId, 'payments');
    const q = query(
      paymentsRef,
      where('tripId', '==', tripId),
      where('fromUserId', 'in', [userId1, userId2])
    );
    
    const querySnapshot = await getDocs(q);
    const payments = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Payment[];
    
    // Filter to only include payments between these two users
    return payments.filter(payment => 
      (payment.fromUserId === userId1 && payment.toUserId === userId2) ||
      (payment.fromUserId === userId2 && payment.toUserId === userId1)
    );
  } catch (error) {
    console.error('Error getting user payments:', error);
    throw error;
  }
};

// Function to delete a payment (and reverse its effects)
export const firebaseDeletePayment = async (tripId: string, payment: Payment): Promise<void> => {
  const batch = writeBatch(db);
  
  try {
    // 1. Delete the payment document
    const paymentRef = doc(db, 'trips', tripId, 'payments', payment.id!);
    batch.delete(paymentRef);

    // 2. Reverse the debt changes
    const tripRef = doc(db, 'trips', tripId);
    const debtKey = `debts.${payment.fromUserId}#${payment.toUserId}`;
    
    batch.update(tripRef, {
      [debtKey]: increment(payment.amount),
      [`members.${payment.fromUserId}.amtLeft`]: increment(-payment.amount),
      [`members.${payment.fromUserId}.owesTotal`]: increment(payment.amount)
    });

    await batch.commit();
    console.log('Payment deleted successfully');
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

// Expense-related helpers
export const getExpenseCollectionRefs = (tripId: string, expenseId?: string) => {
  const tripRef = doc(db, 'trips', tripId);
  const expensesColRef = collection(db, 'trips', tripId, 'expenses');
  const expenseDocRef = expenseId ? doc(db, 'trips', tripId, 'expenses', expenseId) : null;
  return { tripRef, expensesColRef, expenseDocRef };
};

export const updateExpenseCollection = async (expenseDocRef: any, data: any) => {
  if (!expenseDocRef) throw new Error('Expense document reference is required');
  await updateDoc(expenseDocRef, data);
};
