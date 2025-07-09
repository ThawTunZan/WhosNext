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
import { Currency, Debt, Payment } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { deletePayment } from '@/src/TripSections/Payment/utilities/PaymentUtilities';
import { useUserTripsContext } from '@/src/context/UserTripsContext';

// User-related operations (now use context)
// Usage: const { user } = useUserTripsContext();
export const getUserById = (userId: string) => {
  // Deprecated: Use useUserTripsContext().user in components
  throw new Error('getUserById is deprecated. Use useUserTripsContext().user instead.');
};

export const getUserByUsername = (username: string) => {
  // Deprecated: Use useUserTripsContext().user in components
  throw new Error('getUserByUsername is deprecated. Use useUserTripsContext().user instead.');
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
  // Deprecated: This function relies on getUserById, which is now deprecated. Refactor to use context-based user data in components.
  throw new Error('acceptFriendRequest is deprecated. Use context-based user data and update logic in components.');
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

export async function cancelFriendRequest(senderId, receiverId) {
  // Remove from sender's outgoingFriendRequests
  const senderRef = doc(db, "users", senderId);
  const senderSnap = await getDoc(senderRef);
  if (senderSnap.exists()) {
    const outgoing = senderSnap.data().outgoingFriendRequests || [];
    const updatedOutgoing = outgoing.filter(req => req.receiverId !== receiverId);
    await updateDoc(senderRef, { outgoingFriendRequests: updatedOutgoing });
  }

  // Remove from receiver's incomingFriendRequests
  const receiverRef = doc(db, "users", receiverId);
  const receiverSnap = await getDoc(receiverRef);
  if (receiverSnap.exists()) {
    const incoming = receiverSnap.data().incomingFriendRequests || [];
    const updatedIncoming = incoming.filter(req => req.senderId !== senderId);
    await updateDoc(receiverRef, { incomingFriendRequests: updatedIncoming });
  }
}

