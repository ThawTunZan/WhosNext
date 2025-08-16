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
import { Debt, Payment, UserFromDynamo } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { deletePayment } from '@/src/components/Trip/Payment/utilities/PaymentUtilities';


export const getUserByUsername = async (username: string): Promise<UserFromDynamo | null> => {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    console.error('getUserByUsername called with invalid username:', username);
    return null;
  }
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const data = userSnap.data() || {};
    return {
      username: data.username || '',
      fullName: data.fullName || '',
      primaryEmailAddress: data.primaryEmailAddress || { emailAddress: data.email || '' },
      profileImageUrl: data.profileImageUrl || '',
      friends: data.friends || [],
      incomingFriendRequests: data.incomingFriendRequests || [],
      outgoingFriendRequests: data.outgoingFriendRequests || [],
      trips: data.trips || [],
      premiumStatus: data.premiumStatus || 'free'
      // Add any other required fields with defaults
    };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
};

export const addFriend = async (userName: string, friendUsername: string) => {
  try {
    const userRef = doc(db, 'users', userName);
    await updateDoc(userRef, {
      friends: arrayUnion(friendUsername),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding friend:', error);
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
    console.error('Error removing friend:', error);
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
    console.error('Error sending friend request:', error);
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
    console.error('Error accepting friend request:', error);
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
    console.error('Error blocking user:', error);
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
    console.error('Error unblocking user:', error);
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
    console.error('Error checking if blocked:', error);
    throw error;
  }
};


// Function to record a new payment
export const firebaseRecordPayment = async (payment: Payment): Promise<void> => {
  const batch = writeBatch(db);
  
  try {
    // 1. Add the payment document
    const paymentsRef = collection(db, 'trips', payment.tripId, 'payments');
    const paymentDocRef = doc(paymentsRef);
    batch.set(paymentDocRef, {
      ...payment,
      id: paymentDocRef.id,
      createdTime: serverTimestamp(),
      createdDate: serverTimestamp(),
    });

    // 2. Update trip debts and member amounts
    const tripRef = doc(db, 'trips', payment.tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (!tripSnap.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripSnap.data();
    const debts = tripData?.debts || {};
    const currencyDebts = debts[payment.currency] || {};

    // Get the current debt values in both directions
    const paidByToPaidTo = `${payment.fromUserName}#${payment.toUserName}`;
    const paidToToPaidBy = `${payment.toUserName}#${payment.fromUserName}`;
    
    const currentPaidByToPaidTo = currencyDebts[paidByToPaidTo] || 0;
    const paymentAmount = payment.amount;

    // If current debt from paidBy to paidTo is greater than or equal to payment amount
    // simply decrease that debt
    if (currentPaidByToPaidTo >= paymentAmount) {
      batch.update(tripRef, {
        [`debts.${payment.currency}.${paidByToPaidTo}`]: increment(-paymentAmount),
        [`members.${payment.fromUserName}.amtLeft`]: increment(-paymentAmount),
        [`members.${payment.toUserName}.amtLeft`]: increment(paymentAmount),
      });
    } 
    // If payment amount is greater than current debt
    else {
      // First, clear out the existing debt
      const remainingAmount = paymentAmount - currentPaidByToPaidTo;
      
      // Create update object
      const updates: any = {
        [`members.${payment.fromUserName}.amtLeft`]: increment(-paymentAmount),
        [`members.${payment.toUserName}.amtLeft`]: increment(paymentAmount),
      };

      // If there was any existing debt, clear it
      if (currentPaidByToPaidTo > 0) {
        updates[`debts.${payment.currency}.${paidByToPaidTo}`] = 0;
      }

      // Add the remaining amount to the reverse direction
      updates[`debts.${payment.currency}.${paidToToPaidBy}`] = increment(remainingAmount);

      batch.update(tripRef, updates);
    }

    await batch.commit();
    console.log('Payment recorded successfully');
  } catch (error) {
    console.error('Error recording payment:', error);
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

    // 2. Get current debts
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (!tripSnap.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripSnap.data();
    const debts = tripData?.debts || {};

    // 3. Calculate updates using the utility function
    const updates = deletePayment(payment, debts);

    // 4. Apply updates
    batch.update(tripRef, updates);

    await batch.commit();
    console.log('Payment deleted successfully');
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

export async function cancelFriendRequest(senderUsername, receiverUsername) {
  // Remove from sender's outgoingFriendRequests
  const senderRef = doc(db, "users", senderUsername);
  const senderSnap = await getDoc(senderRef);
  if (senderSnap.exists()) {
    const outgoing = senderSnap.data().outgoingFriendRequests || [];
    const updatedOutgoing = outgoing.filter(req => req.username !== receiverUsername);
    await updateDoc(senderRef, { outgoingFriendRequests: updatedOutgoing });
  }

  // Remove from receiver's incomingFriendRequests
  const receiverRef = doc(db, "users", receiverUsername);
  const receiverSnap = await getDoc(receiverRef);
  if (receiverSnap.exists()) {
    const incoming = receiverSnap.data().incomingFriendRequests || [];
    const updatedIncoming = incoming.filter(req => req.username !== senderUsername);
    await updateDoc(receiverRef, { incomingFriendRequests: updatedIncoming });
  }
}

