// src/utils/tripUtils.ts
import firestore from '@react-native-firebase/firestore';
import { Member } from '../types/DataTypes';

export const addMemberToTrip = async (
  tripId: string,
  memberId: string,
  name: string,
  budget: number
): Promise<void> => {
  if (!tripId || !memberId || !name.trim()) {
    throw new Error("Trip ID, Member ID, and Name are required to add a member.");
  }

  const docRef = firestore().collection("trips").doc(tripId);
  const newMemberData = {
    name: name.trim(),
    budget: Number(budget) || 0,
    amtLeft: Number(budget) || 0,
    owesTotal: 0,
  };

  try {
    await docRef.update({
      [`members.${memberId}`]: newMemberData,
      totalBudget: firestore.FieldValue.increment(newMemberData.budget),
      totalAmtLeft: firestore.FieldValue.increment(newMemberData.amtLeft),
    });
  } catch (error) {
    console.error("Error adding member to trip:", error);
    throw error;
  }
};

export const leaveTripIfEligible = async (
  tripId: string,
  userId: string,
  member: Member
): Promise<void> => {
  if (!tripId || !userId || !member) {
    throw new Error("Missing trip or user data.");
  }

  if ((member.owesTotal || 0) > 0) {
    throw new Error("You still have outstanding debts.");
  }

  const expensesSnap = await firestore().collection(`trips/${tripId}/expenses`).get();
  const involvedInExpenses = expensesSnap.docs.some((doc) => {
    const data = doc.data();
    return data.paidBy === member.name || (data.sharedWith || []).includes(userId);
  });
  if (involvedInExpenses) {
    throw new Error("You are still involved in one or more expenses.");
  }

  const activitiesSnap = await firestore().collection(`trips/${tripId}/proposed_activities`).get();
  const hasProposed = activitiesSnap.docs.some((doc) => doc.data().suggestedByID === userId);
  if (hasProposed) {
    throw new Error("You have proposed activities. Remove them first.");
  }

  await removeMemberFromTrip(tripId, userId, member);
};

export const removeMemberFromTrip = async (
  tripId: string,
  memberId: string,
  member: Member
): Promise<void> => {
  const docRef = firestore().collection("trips").doc(tripId);

  try {
    await docRef.update({
      totalBudget: firestore.FieldValue.increment(-(member.budget || 0)),
      totalAmtLeft: firestore.FieldValue.increment(-(member.amtLeft || 0)),
      [`members.${memberId}`]: firestore.FieldValue.delete(),
    });
  } catch (error) {
    console.error("Error removing member from trip:", error);
    throw error;
  }
};

export const deleteTripAndRelatedData = async (tripId: string): Promise<void> => {
  if (!tripId) throw new Error("Trip ID is required.");

  const db = firestore();
  const receiptQ = await db.collection("receipts").where("tripId", "==", tripId).get();
  const expenseQ = await db.collection(`trips/${tripId}/expenses`).get();
  const activityQ = await db.collection(`trips/${tripId}/proposed_activities`).get();

  const receiptDeletions = receiptQ.docs.map((d) => d.ref.delete());
  const expenseDeletions = expenseQ.docs.map((d) => d.ref.delete());
  const activityDeletions = activityQ.docs.map((d) => d.ref.delete());

  const tripDeletion = db.collection("trips").doc(tripId).delete();

  await Promise.all([
    ...receiptDeletions,
    ...expenseDeletions,
    ...activityDeletions,
    tripDeletion,
  ]);
};
