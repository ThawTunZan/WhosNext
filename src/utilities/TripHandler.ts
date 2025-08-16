import { addMemberToTrip, leaveTripIfEligible, removeMemberFromTrip, deleteTripAndRelatedData, claimMockUser } from '@/src/utilities/TripUtilities';
import { AddMemberType, FirestoreExpense, TripsTableDDB, Member } from '@/src/types/DataTypes';

import { collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore';
import { Alert } from 'react-native';

export class TripHandler {
  static async addMember(
    tripId: string,
    memberName: string,
    trip: TripsTableDDB,
    options: {
      budget: number;
      addMemberType: AddMemberType;
      currency: string;
    }
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await addMemberToTrip(tripId, memberName, trip, options);
      return { success: true };
    } catch (error) {
      console.error('Error adding member:', error);
      return { success: false, error };
    }
  }

  static async removeMember(
    tripId: string,
    memberNameToRemove: string,
    memberData: any,
    expenses: any,
    trip: TripsTableDDB,
  ): Promise<{ success: boolean; error?: any }> {
    try {
        if (await TripHandler.canBeRemoved(memberNameToRemove, expenses, trip)) {
            await removeMemberFromTrip(tripId, memberNameToRemove, memberData);
            return { success: true };
        }
        else {
            return {success:false};
        }
    } catch (error) {
      console.error('Error removing member:', error);
      return { success: false, error };
    }
  }

  static async leaveTrip(
    tripId: string,
    currentUserName: string,
    memberData: any
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await leaveTripIfEligible(tripId, currentUserName, memberData);
      return { success: true };
    } catch (error) {
      console.error('Error leaving trip:', error);
      return { success: false, error };
    }
  }

  static async deleteTrip(
    tripId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await deleteTripAndRelatedData(tripId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting trip:', error);
      return { success: false, error };
    }
  }

  static async handleClaimMockUser(
    tripId: string,
    mockUsername: string,
    claimCode: string,
    currentUserName: string,
    expenses: any,
    trip: any,
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await claimMockUser(tripId, mockUsername, claimCode, currentUserName);
      await TripHandler.updateFirebaseAfterClaiming(mockUsername, currentUserName, tripId, expenses, trip);
      return { success: true };
    } catch (error) {
      console.error('Error claiming mock user:', error);
      return { success: false, error };
    }
  }


  static canBeRemoved(
    memberName: string,
    expenses: any[],
    trip: TripsTableDDB
  ): boolean {
    const isPartOfTrip = (
      expenses.some(expense =>
        expense.paidByAndAmounts?.some((pba: any) => pba.memberName === memberName) ||
        expense.sharedWith?.some((sw: any) => sw.payeeName === memberName)
      ) ||
      Object.values(trip?.debts || {}).some(currencyDebts =>
        Object.keys(currencyDebts).some(pair => pair.includes(memberName))
      )
    );
    return !isPartOfTrip;
  }
  /*
 * Function is called when new user join in and claims a mock member
 * To update in the backend the expenses, activities and other stuff the mockmember participated in 
 */
static async updateFirebaseAfterClaiming(mockUserId: string, currentUserName: string, tripId: string, expenses: FirestoreExpense[], tripData: TripsTableDDB) {
	const db = getFirestore();

	// 1. Update Expenses
	for (const expense of expenses) {
		let updated = false;
    	const newPaidBy = expense.paidByAndAmounts.map(pba =>
    	  pba.memberName === mockUserId ? { ...pba, memberName: currentUserName } : pba
    	);
    	const newSharedWith = expense.sharedWith.map(sw =>
    	  sw.payeeName === mockUserId ? { ...sw, payeeName: currentUserName } : sw
    	);
    	if (
    	  JSON.stringify(newPaidBy) !== JSON.stringify(expense.paidByAndAmounts) ||
    	  JSON.stringify(newSharedWith) !== JSON.stringify(expense.sharedWith)
    	) {
    	  updated = true;
    	}
		//TODO maybe try updating all at once?
    	if (updated) {
    	  await updateDoc(doc(db, "trips", tripId, "expenses", expense.id), {
    	    paidByAndAmounts: newPaidBy,
    	    sharedWith: newSharedWith,
    	  });
    	}
	}

	// 2. Update Proposed Activities
	const activitiesRef = collection(db, "trips", tripId, "proposed_activities");
	const activitiesSnap = await getDocs(activitiesRef);
	for (const activityDoc of activitiesSnap.docs) {
		const activity = activityDoc.data();
		let updated = false;

		if (activity.suggestedByName === mockUserId) {
			activity.suggestedByName = currentUserName;
			updated = true;
		}

		// If there are other fields referencing the mock user, update them here

		if (updated) {
			await updateDoc(activityDoc.ref, activity);
		}
	}

	// 3. Update Debts
	const tripRef = doc(db, "trips", tripId);
	if (tripData) {
		let updated = false;
		const newDebts = {};

		for (const [currency, currencyDebts] of Object.entries(tripData.debts)) {
			const newCurrencyDebts = {};
			for (const [key, value] of Object.entries(currencyDebts)) {
				let newKey = key;
				if (key.includes(mockUserId)) {
					newKey = key.replace(mockUserId, currentUserName);
					updated = true;
				}		
				newCurrencyDebts[newKey] = value;		//remains old value if mockUserId is not found
			}
			newDebts[currency] = newCurrencyDebts;
		}

		if (updated) {
			await updateDoc(tripRef, {
				debts: newDebts,
			});
		}
	}
}


} 