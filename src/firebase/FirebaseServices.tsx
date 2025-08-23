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
  increment,
  writeBatch,
} from 'firebase/firestore';
import { Payment, UserDDB } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { deletePayment } from '@/src/components/Trip/Payment/utilities/PaymentUtilities';

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
    console.error('[FirebaseService] Error recording payment:', error);
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
    console.error('[FirebaseService] Error deleting payment:', error);
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

