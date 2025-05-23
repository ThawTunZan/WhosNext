// src/utils/tripUtils.ts
import { collection, getDocs, doc, updateDoc, increment, deleteField, deleteDoc, query, where, runTransaction,
  Timestamp,
  setDoc,
  getDoc, } from 'firebase/firestore';
import { db } from '../../firebase';
import { Member } from '../types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from './notification';

export async function addMemberToTripIfNotExists(tripId: string, userId: string) {
  const tripRef = doc(db, "trips", tripId);
  const tripSnap = await getDoc(tripRef);

  if (!tripSnap.exists()) throw new Error("Trip does not exist");

  const tripData = tripSnap.data();
  const members = tripData.members || {};

  if (!members[userId]) {
    members[userId] = {
      budget: 0,
      amtLeft: 0,
      owesTotal: 0,
    };

    await updateDoc(tripRef, {
      [`members.${userId}`]: members[userId],
    });
  }
}

/**
 * Update a member's personal budget and adjust their amtLeft by the same delta.
 * Throws if trip or member not found.
 */
export async function updatePersonalBudget(
  tripId: string,
  userId: string,
  newBudget: number
): Promise<void> {
  if (!tripId || !userId) {
    throw new Error("Trip ID and User ID are required.")
  }

  const tripRef = doc(db, "trips", tripId)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(tripRef)
    if (!snap.exists()) {
      throw new Error("Trip not found.")
    }
    const data = snap.data()
    const members = data.members || {}
    const userData = members[userId]
    if (!userData) {
      throw new Error("User not a member of this trip.")
    }

    const oldBudget = userData.budget as number
    const oldAmtLeft = userData.amtLeft as number
    const spent = oldBudget - oldAmtLeft
    const diff = oldBudget - newBudget

    const updatedAmtLeft = newBudget - spent

    const updatedMember = {
        ...userData,
        budget: newBudget,
        amtLeft: updatedAmtLeft,
    }

    tx.update(tripRef, {
        [`members.${userId}`]: updatedMember,
        totalBudget: increment(-diff),
        totalAmtLeft: increment(-diff)
    })
  })
}

/**
 * Adds a new member to a trip in Firestore.
 * @param tripId The ID of the trip.
 * @param memberId The ID for the new member.
 * @param name The name of the new member.
 * @param budget The budget for the new member.
 */
export const addMemberToTrip = async (
    tripId: string,
    memberId: string,
    name: string,
    budget: number
): Promise<void> => {
    if (!tripId || !memberId || !name.trim()) {
    throw new Error("Trip ID, Member ID, and Name are required to add a member.");
  }

  const trimmedName = name.trim();
  const budgetNum = Number(budget) || 0;

  const tripRef = doc(db, "trips", tripId);
  const userRef = doc(db, "users", memberId);

  const newMemberData = {
    budget: budgetNum,
    amtLeft: budgetNum,
    owesTotal: 0,
  };

  try {
    // 1) Update the trip's members map and totals
    await updateDoc(tripRef, {
      [`members.${memberId}`]: newMemberData,
      totalBudget: increment(newMemberData.budget),
      totalAmtLeft: increment(newMemberData.amtLeft),
    });
    console.log(`Member ${trimmedName} added to trip ${tripId}`);

    // 2) Ensure the users collection has this user's profile
    await setDoc(
      userRef,
      { username: trimmedName },
      { merge: true }
    );
    console.log(`User profile for ${memberId} upserted in users collection`);

    // Send notification to all existing members
    const tripSnapshot = await getDoc(tripRef);
    const tripData = tripSnapshot.data();
    if (tripData && tripData.members) {
      Object.keys(tripData.members).forEach(async (existingMemberId) => {
        if (existingMemberId !== memberId) { // Don't notify the new member
          await NotificationService.sendTripUpdate(
            "New Member Joined",
            `${trimmedName} has joined the trip!`,
            {
              type: NOTIFICATION_TYPES.TRIP_UPDATE,
              tripId: tripId,
              memberId: memberId
            }
          );
        }
      });
    }
  } catch (error) {
    console.error("Error adding member to trip and/or users:", error);
    throw error;
  }
};

/**
 * Checks if the member can leave the trip and removes them if allowed.
 * Blocks leaving if they have debts, expenses, or proposed activities.
 * @throws Error with reason if the user is not allowed to leave.
 */
export const leaveTripIfEligible = async (
    tripId: string,
    userId: string,
    member: Member,
): Promise<void> => {

    if (!tripId || !userId || !member) {
      throw new Error("Missing trip or user data.");
    }

    const myDebt = member?.owesTotal || 0;
    if (myDebt > 0) {
      throw new Error("You still have outstanding debts.");
    }

    const expensesSnap = await getDocs(collection(db, `trips/${tripId}/expenses`));
    const involvedInExpenses = expensesSnap.docs.some(doc => {
      const data = doc.data();
      return data.paidById === member.id || (data.sharedWith || []).includes(userId);
    });

    if (involvedInExpenses) {
      throw new Error("You are still involved in one or more expenses.");
    }

    const activitiesSnap = await getDocs(collection(db, `trips/${tripId}/proposed_activities`));
    const hasProposed = activitiesSnap.docs.some(doc => {
      const data = doc.data();
      return data.suggestedByID === userId;
    });

    if (hasProposed) {
      throw new Error("You have proposed activities. Remove them first.");
    }

    await removeMemberFromTrip(tripId, userId, member);
};

/**
 * Removes a member from a trip in Firestore.
 * WARNING: This does not currently recalculate debts or reassign expenses
 * if the removed member was involved. This would require more complex logic.
 * @param tripId
 * @param memberIdToRemove
 * @param memberToRemoveData
 */
export const removeMemberFromTrip = async (
    tripId: string,
    memberIdToRemove: string,
    memberToRemoveData: Member
): Promise<void> => {
    if (!tripId || !memberIdToRemove) {
        throw new Error("Trip ID and Member ID are required to remove a member.");
    }
    const docRef = doc(db, "trips", tripId);

    try {
        // Get member name before removing
        const userRef = doc(db, "users", memberIdToRemove);
        const userSnap = await getDoc(userRef);
        const userName = userSnap.exists() ? userSnap.data().username : 'A member';

        await updateDoc(docRef, {
            totalBudget: increment(-(memberToRemoveData.budget || 0)),
            totalAmtLeft: increment(-(memberToRemoveData.amtLeft || 0)),
            [`members.${memberIdToRemove}`]: deleteField(),
        });
        console.log(`Member ${memberIdToRemove} removed from trip ${tripId}`);

        // Get remaining members and notify them
        const tripSnap = await getDoc(docRef);
        const tripData = tripSnap.data();
        if (tripData && tripData.members) {
            Object.keys(tripData.members).forEach(async (memberId) => {
                await NotificationService.sendTripUpdate(
                    "Member Left Trip",
                    `${userName} has left the trip.`,
                    {
                        type: NOTIFICATION_TYPES.TRIP_UPDATE,
                        tripId: tripId,
                        memberId: memberIdToRemove
                    }
                );
            });
        }
    } catch (error) {
        console.error("Error removing member from trip:", error);
        throw error;
    }
};

export const deleteTripAndRelatedData = async (tripId: string): Promise<void> => {
    if (!tripId) throw new Error("Trip ID is required.");

    // TBD deleted related receipt pictures
    console.log("TRIP BUTTON IS PRESSED")

    // 1. Delete receipts
    const receiptsQ = query(collection(db, "receipts"), where("tripId", "==", tripId));
    const receiptDocs = await getDocs(receiptsQ);
    const receiptDeletions = receiptDocs.docs.map(docSnap => deleteDoc(doc(db, "receipts", docSnap.id)));

    // 2. Delete expenses
    const expensesSnap = await getDocs(collection(db, `trips/${tripId}/expenses`));
    const expenseDeletions = expensesSnap.docs.map(docSnap =>
        deleteDoc(doc(db, `trips/${tripId}/expenses`, docSnap.id))
    );


    // 3. Delete activities (from subcollection)
    const activitiesQ = await getDocs(collection(db, `trips/${tripId}/proposed_activities`));
    const activityDeletions = activitiesQ.docs.map(docSnap =>
      deleteDoc(doc(db, `trips/${tripId}/proposed_activities`, docSnap.id))
    );


    // 4. Delete the trip document
    const tripDeletion = deleteDoc(doc(db, "trips", tripId));


    // Run all deletions in parallel
    await Promise.all([
      ...receiptDeletions,
      ...expenseDeletions,
      ...activityDeletions,
      tripDeletion,
    ]);

    console.log(`Trip ${tripId} and all related data deleted.`);
};