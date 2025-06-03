// src/services/expenseService.ts
// Utility functions
import {
    collection,
    onSnapshot,
    doc,
    deleteDoc,
    increment,
    writeBatch, 
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path as needed
import { Expense, Member } from '../types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from './notification';

const TRIPS_COLLECTION = 'trips';
const EXPENSES_SUBCOLLECTION = 'expenses';

export const updateExpenseAndRecalculateDebts = async (
  tripId: string,
  expenseId: string | null,
  updatedExpenseData: Expense,
  members: Record<string, Member>,
  profiles: Record<string, string>
): Promise<void> => {
  if (!tripId || !expenseId) {
      throw new Error("Trip ID and Expense ID are required for update.");
  }
  const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
  const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
  const batch = writeBatch(db);
  try {
      console.log(`Workspaceing original expense data for ID: ${expenseId}`);
      const originalExpenseSnap = await getDoc(expenseDocRef);

      if (!originalExpenseSnap.exists()) {
          throw new Error(`Original expense with ID ${expenseId} not found.`);
      }

      const originalExpense = originalExpenseSnap.data() as Expense

      const reversalRaw = generateExpenseImpactUpdate({}, originalExpense, members, true, profiles);
      reversalRaw['totalAmtLeft'] = originalExpense.paidAmt
      const applyRaw = generateExpenseImpactUpdate({}, updatedExpenseData, members, false, profiles);
      applyRaw['totalAmtLeft'] = -updatedExpenseData.paidAmt

      // Merge them manually by summing values
      const combinedUpdates = mergeIncrements(reversalRaw, applyRaw)
      const expenseUpdatePayload = {
          ...updatedExpenseData,
          // Optionally add an updatedAt timestamp: 
          updatedAt: Timestamp.now(),
      };
      batch.update(tripDocRef, combinedUpdates); // Apply combined balance/debt changes
      batch.update(expenseDocRef, expenseUpdatePayload); // Update the expense document itself
      await batch.commit();
  } catch (error) {
      console.error(`Error updating expense ${expenseId}: `, error);
      throw error;
  }
};
// Helper functions
//------------------------------------------------------------------------------------------------------------

function mergeIncrements(
  a: { [key: string]: number },
  b: { [key: string]: number }
): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    console.log ("a [key] is "+ key + " " + a[key])
    console.log ("b [key] is "+ key + " " + b[key])
    const total = aVal + bVal;

    if (total !== 0) {
      result[key] = increment(total);
    }
  }

  return result;
}

function formatToFirebase (updates: { [key: string]: number }) {
  const out: { [key: string]: any } = {};
  for (const [k, v] of Object.entries(updates)) {
    out[k] = increment(v);
  }
  return out;
}

//-----------------------------------------------------------------------------------------------------------

/**
 * Calculates who should pay next based on who owe the most
 * relative to their budget (Minimum of budget - amtLeft).
 * Handles members with zero budget by excluding them unless everyone has zero budget.
 *
 * @param members - The members map containing budget and amtLeft info.
 * @returns Object with id and name of the next payer, or { id: null, name: null }.
 */
export function calculateNextPayer(members: Record<string, Member> | null | undefined, profiles: Record<string, string>): string {

    if (!members || Object.keys(members).length === 0) {
        return 
          ''
        ;
    }
  
    let nextPayerId: string | null = null;
    let maxAmountOwe = -9999
  
    const memberEntries = Object.entries(members);
  
    // Filter out members with non-positive budget unless ALL members have non-positive budget
    memberEntries.forEach(([id, member]) => {
      // This line correctly handles undefined owesTotal before comparison
      const currentOwesTotal = Number(member.owesTotal) || 0;
  
      if (currentOwesTotal > maxAmountOwe) {
          maxAmountOwe = currentOwesTotal;
          nextPayerId = id;
      }
    });
  
    if (nextPayerId && members[nextPayerId]) {
        return nextPayerId;
    } else if (memberEntries.length > 0) {
      // Fallback if maxOwesTotal <= 0 but members exist: pick first member overall
      const fallbackId = memberEntries[0][0];
      console.log("calculateNextPayer: No one owes money currently, suggesting first member as fallback.");
      return  fallbackId;
    }
    else {
       return null;
    }
  
    return null; // Should ideally not be reached
}

// To get real-time updates on expenses
export const subscribeToExpenses = (
  tripId: string,
  callback: (expenses: Expense[]) => void
): (() => void) => { // Returns the unsubscribe function
  const expensesColRef = collection(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION);

  const unsubscribe = onSnapshot(expensesColRef, (snapshot) => {
    const data: Expense[] = snapshot.docs.map((doc) => {
      const raw = doc.data();
      return {
        id: doc.id,
        activityName: raw.activityName,
        paidById: raw.paidById, // To add paidById later
        paidAmt: raw.paidAmt,
        sharedWith: raw.sharedWith,
        // Handle potential Timestamp conversion if you store dates as Timestamps
        createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toLocaleDateString() : 'N/A',
      };
    });
    callback(data);
  }, (error) => {
    console.error("Error fetching expenses: ", error);
    // Handle error appropriately, update UI state. TBD later
    callback([]); // Clear expenses on error or show an error state
  });

  return unsubscribe;
};

// To add a new expense and update related balances/debts
export const addExpenseAndCalculateDebts = async (
  tripId: string,
  expenseData: Expense,
  members: Record<string, Member>,
  profiles: Record<string, string>
): Promise<void> => {
  const paidByID = expenseData.paidById;

  if (!paidByID) {
    throw new Error(`Could not find member ID for payer: ${expenseData.paidById}`);
  }

  const expenseDocData = {
    ...expenseData,
    createdAt: Timestamp.now(),
  };

  const batch = writeBatch(db);
  const newExpenseRef = doc(collection(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION));
  batch.set(newExpenseRef, expenseDocData);
  const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
  let updatesRaw: { [key: string]: number } = {};
  updatesRaw = generateExpenseImpactUpdate(updatesRaw, expenseData, members, false, profiles);
  updatesRaw['totalAmtLeft'] = -expenseData.paidAmt;
  let updates = formatToFirebase(updatesRaw);

  batch.update(tripDocRef, updates);
  try {
    await batch.commit();
    console.log("Expense added and debts updated successfully.");

    // Send notifications to all members involved
    const paidByName = profiles[paidByID] || 'Someone';
    const amount = expenseData.paidAmt.toFixed(2);

    // Notify everyone who needs to pay
    expenseData.sharedWith.forEach(async (shared) => {
      if (shared.payeeID !== paidByID) { // Don't notify the person who paid
        await NotificationService.sendExpenseAlert(
          "New Expense Added",
          `${paidByName} paid ${amount} for ${expenseData.activityName}`,
          {
            type: NOTIFICATION_TYPES.EXPENSE_ALERT,
            id: newExpenseRef.id,
            tripId: tripId
          }
        );
      }
    });

  } catch (error) {
    console.error("Error adding expense or updating debts: ", error);
    throw error;
  }
};

// Function to delete an expense
// IMPORTANT: Deleting an expense requires recalculating/reversing the debt updates.
// This can be complex. A simpler approach might be to "soft delete" (mark as deleted)
// or to implement a recalculation logic triggered on deletion.
// The example below just deletes the expense doc, but DOES NOT reverse debt changes.
export const deleteExpense = async (tripId: string, expenseId: string, members: Record<string, Member>, profiles: Record<string, string>): Promise<void> => {
  const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
  try {
      await reverseExpensesAndUpdate(tripId,expenseId,members,true, profiles);
      await deleteDoc(expenseDocRef);
    
      console.log("Expense deleted successfully (debts not automatically reversed).");
      // TODO: Implement debt reversal logic if required. This might involve fetching the
      // expense data before deleting it to know what changes to reverse.
  } catch (error) {
      console.error("Error deleting expense: ", error);
      throw error;
  }
};

  /**
 * Deletes an expense and reverses the corresponding debt/balance changes.
 *
 * @param tripId The ID of the trip.
 * @param expenseId The ID of the expense to delete.
 * @param members The current members map (needed to find payer ID if not stored on expense).
 */
export const reverseExpensesAndUpdate = async (
    tripId: string,
    expenseId: string,
    members: Record<string, Member>, // Needed for payer ID lookup if not stored on expense
    reverse: boolean,
    profiles: Record<string, string>
): Promise<void> => {
  const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
  const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
  const batch = writeBatch(db);

  try {
    const expenseSnap = await getDoc(expenseDocRef);

    if (!expenseSnap.exists()) {
      console.warn(`Expense document with ID ${expenseId} not found. Cannot reverse debts.`);
      return; 
    }
    
    let reversalUpdatesRaw: { [key: string]: number } = {}
    reversalUpdatesRaw = generateExpenseImpactUpdate(reversalUpdatesRaw, expenseSnap.data() as Expense, members, reverse, profiles, expenseId);
    let reversalUpdates = formatToFirebase(reversalUpdatesRaw)
    
    batch.update(tripDocRef, reversalUpdates);
    batch.delete(expenseDocRef);
    await batch.commit();
    console.log(`Expense ${expenseId} deleted and debt changes reversed successfully.`);

  } catch (error) {
    console.error(`Error deleting expense ${expenseId} and reversing debts: `, error);
    throw error;
  }
};

export const generateExpenseImpactUpdate = (
  updates: { [key: string]: number },
  expenseData: Expense,
  members: Record<string, Member>,
  reverse: boolean,
  profiles: Record<string, string>,
  expenseId?: string,
): { [key: string]: any } => {

  const { sharedWith, paidById, paidAmt } = expenseData;

  if (!paidById) {
    throw new Error(`Payer ID is missing from expense data ${expenseId ? `for expense ${expenseId}` : ''}`);
  }

  // Check if the payer exists in members
  if (!members[paidById]) {
    throw new Error(`Payer "${profiles[paidById] || paidById}" not found in members. Failed to ${reverse ? 'reverse' : 'process'} expense ${expenseId || ''}.`);
  }

  const multiplier = (reverse)? 1 : -1;

  for (const member of sharedWith) {
    const share = Number(member.amount) * multiplier;
    const payeeID = member.payeeID;
    if (payeeID !== paidById) {
      updates[`members.${payeeID}.owesTotal`] = -share;
      updates[`debts.${payeeID}#${paidById}`] = -share;
    }
  }

  // Only the payer's amtLeft is reduced by the full paidAmt
  updates[`members.${paidById}.amtLeft`] = multiplier * paidAmt;

  // Use increment for totalAmtLeft
  updates[`totalAmtLeft`] = multiplier * paidAmt;

  return updates;
};