import { addMemberToTrip, leaveTripIfEligible, removeMemberFromTrip, deleteTripAndRelatedData, claimMockUser } from '@/src/utilities/TripUtilities';
import { AddMemberType, FirestoreExpense, MemberDDB, TripsTableDDB } from '@/src/types/DataTypes';
import { generateClient } from 'aws-amplify/api';
import {
  getMembersByTrip,
  getExpensesByTrip,
  getExpense,
  getTrip,
} from '@/src/graphql/queries';
import {
  deleteMember,
  updateExpense,
  updateTrip,
} from '@/src/graphql/mutations';
import type * as APITypes from '@/src/API';

export class TripHandler {
  private static client = generateClient();
  
  static async addMember(
    tripId: string,
    memberName: string,
    trip: TripsTableDDB,
    memberByUserId: Record<string, MemberDDB>,
    options: {
      budget: number;
      addMemberType: AddMemberType;
      currency: string;
    }
  ): Promise<{ success: boolean; error?: any }> {

    try {
      await addMemberToTrip(tripId, memberName, trip, memberByUserId, options);
      return { success: true };
    } catch (error) {
      console.error('[TripHandlers] Error adding member:', error);
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
   * Function is called when a real user claims a mock member.
   * Updates: delete mock Member row, update all Expenses (paidBy/sharedWith),
   * and rewrite Trip.debts AWSJSON.
   * TODO: proposed_activities once modeled in your schema
   */
  static async updateFirebaseAfterClaiming(
    mockUsername: string,
    currentUsername: string,
    tripId: string,
    _expenses: any[],             // no longer used; we fetch from AppSync
    _tripData: any                // no longer used; we fetch from AppSync
  ): Promise<void> {
    const client = TripHandler.client;

    // 0) Find & delete the mock member row for this trip
    const membersResp = await client.graphql({
      query: getMembersByTrip,
      variables: { tripId, limit: 1000 },
    }) as { data?: APITypes.GetMembersByTripQuery };

    const mockMember = membersResp.data?.getMembersByTrip?.items?.find(m => m?.username === mockUsername);
    if (mockMember?.id) {
      await client.graphql({
        query: deleteMember,
        variables: { input: { id: mockMember.id } as APITypes.DeleteMemberInput },
      });
    }

    // 1) Update all expenses in this trip (paidBy + sharedWith.payeeName)
    let nextToken: string | null | undefined = null;
    do {
      const page = await client.graphql({
        query: getExpensesByTrip,
        variables: { tripId, limit: 200, nextToken },
      }) as { data?: APITypes.GetExpensesByTripQuery };

      nextToken = page.data?.getExpensesByTrip?.nextToken ?? null;
      const baseItems = page.data?.getExpensesByTrip?.items ?? [];

      for (const base of baseItems) {
        if (!base?.id) continue;

        // Fetch full expense (ensures sharedWith array present)
        const fullResp = await client.graphql({
          query: getExpense,
          variables: { id: base.id },
        }) as { data?: APITypes.GetExpenseQuery };

        const e = fullResp.data?.getExpense;
        if (!e) continue;

        let changed = false;
        const input: APITypes.UpdateExpenseInput = { id: e.id! };

        if (e.paidBy === mockUsername) {
          input.paidBy = currentUsername;
          changed = true;
        }

        if (Array.isArray(e.sharedWith)) {
          const newShared = e.sharedWith.map(sw =>
            sw?.payeeName === mockUsername ? { ...sw, payeeName: currentUsername } : sw
          );
          if (JSON.stringify(newShared) !== JSON.stringify(e.sharedWith)) {
            input.sharedWith = newShared as any; // SharedWithInput[]
            changed = true;
          }
        }

        if (changed) {
          await client.graphql({ query: updateExpense, variables: { input } });
        }
      }
    } while (nextToken);

    // 2) Update Trip.debts (AWSJSON string) to replace mock username in keys
    const tripResp = await client.graphql({
      query: getTrip,
      variables: { id: tripId },
    }) as { data?: APITypes.GetTripQuery };

    const trip = tripResp.data?.getTrip;
    if (trip?.debts) {
      const debtsObj = typeof trip.debts === 'string' ? JSON.parse(trip.debts) : trip.debts;
      let updated = false;
      const newDebts: Record<string, any> = {};

      for (const [currency, currencyDebts] of Object.entries<any>(debtsObj ?? {})) {
        const rewritten: Record<string, number> = {};
        for (const [pair, amount] of Object.entries<number>(currencyDebts ?? {})) {
          const newKey = pair.includes(mockUsername)
            ? pair.replace(mockUsername, currentUsername)
            : pair;
          if (newKey !== pair) updated = true;
          rewritten[newKey] = amount;
        }
        newDebts[currency] = rewritten;
      }

      if (updated) {
        await client.graphql({
          query: updateTrip,
          variables: {
            input: {
              id: tripId,
              debts: JSON.stringify(newDebts), // AWSJSON must be a string
            } as APITypes.UpdateTripInput,
          },
        });
      }
    }

    // 3) TODO: Update proposed_activities (once modeled in GraphQL)
  }
  /*
 * Function is called when new user join in and claims a mock member
 * To update in the backend the expenses, activities and other stuff the mockmember participated in 
 
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
  */


} 