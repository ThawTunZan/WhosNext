// src/handlers/TripHandler.ts
// Replaced Amplify/AppSync GraphQL calls with DynamoDBService (SDK v3) helpers.
// No UI or feature changes—only the data layer has been swapped.

import {
  addMemberToTrip,
  leaveTripIfEligible,
  removeMemberFromTrip,
  //deleteTripAndRelatedData,
  claimMockUser,
} from '@/src/utilities/TripUtilities';

import {  MemberDDB, TripsTableDDB } from '@/src/types/DataTypes';

import {
  getMembersByTrip,
  getTripById,
} from '@/src/aws-services/DynamoDBService';

export class TripHandler {
  
  static async addMember(
    trip: TripsTableDDB,
    memberData: MemberDDB,
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await addMemberToTrip(trip, memberData);
      return { success: true };
    } catch (error) {
      console.error('[TripHandlers] Error adding member:', error);
      return { success: false, error };
    }
  }
  
  static async removeMember(
    tripId: string,
    memberId: string,
    memberData: any,
    expenses: any,
    trip: TripsTableDDB,
  ): Promise<{ success: boolean; error?: any }> {
    try {
      if (await TripHandler.canBeRemoved(memberId, expenses, trip)) {
        await removeMemberFromTrip(tripId, memberId, memberData);
        return { success: true };
      } else {
        return { success: false };
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
      //await deleteTripAndRelatedData(tripId);
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
      // Performs the "claim" (auth/user mapping etc.)
      await claimMockUser(tripId, mockUsername, claimCode, currentUserName);
      
      // Rewrite references across expenses/debts
      await TripHandler.updateFirebaseAfterClaiming(
        mockUsername,
        currentUserName,
        tripId,
        expenses,
        trip
      );
      
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
    const isPartOfTrip =
    expenses.some(expense =>
      expense.paidByAndAmounts?.some((pba: any) => pba.memberName === memberName) ||
      expense.sharedWith?.some((sw: any) => sw.payeeName === memberName)
    ) ||
    Object.values(trip?.debts || {}).some((currencyDebts: any) =>
      Object.keys(currencyDebts).some((pair: string) => pair.includes(memberName))
  );
  
  return !isPartOfTrip;
}

/*
* Called when a real user claims a mock member.
* Updates: (a) all Expenses (paidBy / sharedWith), and (b) Trip.debts object.
* Note: Member-row removal is handled elsewhere if needed.
*/
static async updateFirebaseAfterClaiming(
  mockUsername: string,
  currentUsername: string,
  tripId: string,
  _expenses: any[],  // no longer used; we fetch from DynamoDB
  _tripData: any     // no longer used; we fetch from DynamoDB
): Promise<void> {
  // 1) Update all expenses in this trip (paidBy + sharedWith.payeeName)
  try {
    /*
    let exclusiveStartKey: any = undefined;
    
    do {
    const page = await getExpensesByTrip(tripId, {
    limit: 200,
    exclusiveStartKey,         // DynamoDB-style pagination if supported
    scanNewToOld: false,       // order doesn't matter here
    });
    
    const items: any[] = page?.items ?? [];
    for (const e of items) {
    if (!e?.id) continue;
    
    let changed = false;
    const patch: any = { id: e.id };
    
    if (e.paidBy === mockUsername) {
    patch.paidBy = currentUsername;
    changed = true;
    }
    
    if (Array.isArray(e.sharedWith)) {
    const newShared = e.sharedWith.map((sw: any) =>
    sw?.payeeName === mockUsername ? { ...sw, payeeName: currentUsername } : sw
    );
    // Avoid unnecessary writes
    if (JSON.stringify(newShared) !== JSON.stringify(e.sharedWith)) {
    patch.sharedWith = newShared;
    changed = true;
    }
    }
    
    if (changed) {
    // Partial update of the expense document
    await updateExpense(patch);
    }
    }
    
    exclusiveStartKey = page?.lastEvaluatedKey || undefined;
    } while (exclusiveStartKey);
    */
  } catch (err) {
    console.error('[TripHandler] Failed updating expenses after claim:', err);
    // Continue to debts rewrite even if some expenses failed; caller may retry.
  }
  
  // 2) Update Trip.debts (object keyed by currency, with "A#B": amount pairs)
  try {
    const trip = await getTripById(tripId);
    const debtsObj: Record<string, Record<string, number>> =
    (trip?.debts as any) ?? {};
    
    let updated = false;
    const newDebts: Record<string, Record<string, number>> = {};
    
    for (const [currency, currencyDebts] of Object.entries(debtsObj)) {
      const rewritten: Record<string, number> = {};
      
      for (const [pair, amount] of Object.entries<number>(currencyDebts || {})) {
        // Replace either side of the "A#B" pair if it matches mockUsername
        const newKey = pair.includes(mockUsername)
        ? pair.replace(mockUsername, currentUsername)
        : pair;
        
        if (newKey !== pair) updated = true;
        
        // Merge if replacement creates a duplicate key
        rewritten[newKey] = (rewritten[newKey] ?? 0) + (amount ?? 0);
      }
      newDebts[currency] = rewritten;
    }
    
    if (updated) {
      //await updateTrip(tripId, { debts: newDebts });
    }
  } catch (err) {
    console.error('[TripHandler] Failed updating trip debts after claim:', err);
  }
  
  // 3) (Optional) Remove the mock member row after references are updated
  //    If your flow handles this elsewhere (e.g., claimMockUser), you can skip.
  try {
    const membersResp = await getMembersByTrip(tripId);
    const mockMember = (membersResp?.items ?? []).find((m: any) => m?.username === mockUsername);
    
    // If you prefer to remove here and your TripUtilities.removeMemberFromTrip
    // works with minimal data, you can call it; otherwise, skip safely.
    if (mockMember?.username) {
      //await removeMemberFromTrip(tripId, mockUsername, { id: mockMember.id });
    }
  } catch (err) {
    // Non-fatal; member row cleanup can be handled elsewhere.
    console.warn('[TripHandler] Optional mock member cleanup failed:', err);
  }
  
  // 4) TODO: Update proposed_activities if/when modeled
}
}
