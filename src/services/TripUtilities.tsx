// src/utils/tripUtils.ts
import { doc, updateDoc, increment, deleteField, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path
import { TripData, Member } from '../types/DataTypes'; // Adjust path

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
    const docRef = doc(db, "trips", tripId);
    const newMemberData = {
        name: name.trim(),
        budget: Number(budget) || 0,
        amtLeft: Number(budget) || 0,
        owesTotal: 0,
    };

    try {
        await updateDoc(docRef, {
            [`members.${memberId}`]: newMemberData,
            totalBudget: increment(newMemberData.budget),
            totalAmtLeft: increment(newMemberData.amtLeft)
        });
        console.log(`Member ${name} added to trip ${tripId}`);
    } catch (error) {
        console.error("Error adding member to trip:", error);
        throw error;
    }
};

/**
 * Removes a member from a trip in Firestore.
 * WARNING: This does not currently recalculate debts or reassign expenses
 * if the removed member was involved. This would require more complex logic.
 * @param tripId The ID of the trip.
 * @param memberIdToRemove The ID of the member to remove.
 * @param memberToRemoveData The data of the member being removed (for budget/amtLeft reversal).
 */
export const removeMemberFromTrip = async (
    tripId: string,
    memberIdToRemove: string,
    memberToRemoveData: Member // Pass the member's data for budget reversal
): Promise<void> => {
    if (!tripId || !memberIdToRemove) {
        throw new Error("Trip ID and Member ID are required to remove a member.");
    }
    const docRef = doc(db, "trips", tripId);

    try {
        await updateDoc(docRef, {
            [`members.${memberIdToRemove}`]: deleteField(), // Delete the member map entry
            totalBudget: increment(-(memberToRemoveData.budget || 0)),
            totalAmtLeft: increment(-(memberToRemoveData.amtLeft || 0))
            // TODO: Consider what happens to expenses/debts involving this member.
            // This might require a more complex cleanup, potentially a Cloud Function.
        });
        console.log(`Member ${memberIdToRemove} removed from trip ${tripId}`);
    } catch (error) {
        console.error("Error removing member from trip:", error);
        throw error;
    }
};