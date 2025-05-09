// src/services/expenseService.ts
// Utility functions
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    increment,
    writeBatch, // Use batch writes for atomicity when updating multiple docs/fields
    Timestamp,
    getDoc, // Use Firestore Timestamp
  } from 'firebase/firestore';
  import { db } from '../../firebase'; // Adjust path as needed
  import { Expense, NewExpenseData, SharedWith, Member, MembersMap } from '../types/DataTypes'; // Adjust path
import { MemberInfo } from './SettleUpUtilities';
  
  const TRIPS_COLLECTION = 'trips';
  const EXPENSES_SUBCOLLECTION = 'expenses';

  interface DetailedMember extends MemberInfo {
    budget: number;
    amtLeft: number;
    owesTotal?: number;
  }
  
  type DetailedMembersMap = Record<string, DetailedMember>;
  
  interface NextPayerResult {
      id: string | null;
      name: string | null;
  }

  export const updateExpenseAndRecalculateDebts = async (
    tripId: string,
    expenseId: string | null,
    updatedExpenseData: NewExpenseData,
    members: MembersMap,
  ): Promise<void> => {
    if (!tripId || !expenseId) {
        throw new Error("Trip ID and Expense ID are required for update.");
    }

    const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
    const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
    const batch = writeBatch(db);

    try {
        // Fetch the ORIGINAL expense data
        console.log(`Workspaceing original expense data for ID: ${expenseId}`);
        const originalExpenseSnap = await getDoc(expenseDocRef);
        if (!originalExpenseSnap.exists()) {
            throw new Error(`Original expense with ID ${expenseId} not found.`);
        }
        // Assert type carefully or validate fields
        const originalExpense = { id: originalExpenseSnap.id, ...originalExpenseSnap.data() } as Expense;
        console.log("Original expense data:", originalExpense);
        console.log("Updated expense data:", updatedExpenseData);

        const combinedUpdates: { [key: string]: any } = {};

        // Calculate Reversals based on ORIGINAL expense ---
        const originalPayerId = Object.keys(members).find(id => members[id].name === originalExpense.paidBy);
        const updatedPayerId = Object.keys(members).find(id => members[id].name === updatedExpenseData.paidBy);

        if (!originalPayerId) throw new Error(`Original payer '${originalExpense.paidBy}' not found in members map.`);

        originalExpense.sharedWith.forEach(member => {
          const memberId = member.payeeID;
          const originalShare = Number(member.amount || 0);
          console.log(`  Member: ${memberId}, Original Share: ${originalShare}`);
          if (memberId !== originalPayerId) {
            addIncrement(combinedUpdates, `members.${memberId}.amtLeft`, originalShare);
            addIncrement(combinedUpdates, `members.${memberId}.owesTotal`, -originalShare);
            const debtKeyOriginal = `debts.${memberId}#${originalPayerId}`;
            addIncrement(combinedUpdates, debtKeyOriginal, -originalShare);
          } else if (memberId == originalPayerId) {
            addIncrement(combinedUpdates, `members.${memberId}.amtLeft`, originalShare);
          }
            
        });
        console.log("Calculated reversal increments based on original data.");
        console.log("Processing newly added members...");
        updatedExpenseData.sharedWith.forEach(updatedMemberShare => {
            const memberId = updatedMemberShare.payeeID;
            const newShare = Number(updatedMemberShare.amount || 0);
            if (memberId !== updatedPayerId) {
              addIncrement(combinedUpdates, `members.${memberId}.amtLeft`, -newShare);
              addIncrement(combinedUpdates, `members.${memberId}.owesTotal`, newShare);
              const debtKeyNew = `debts.${memberId}#${updatedPayerId}`;
              addIncrement(combinedUpdates, debtKeyNew, newShare);
            } else if (memberId == updatedPayerId) {
              addIncrement(combinedUpdates, `members.${memberId}.amtLeft`, -newShare);
            }           
        });

        const expenseUpdatePayload = {
            ...updatedExpenseData,
            // Optionally add an updatedAt timestamp:
            updatedAt: Timestamp.now(),
        };
        // Add updates to batch ---
        console.log("Final combined updates for Trip doc:", combinedUpdates);
        batch.update(tripDocRef, combinedUpdates); // Apply combined balance/debt changes
        console.log("Updating expense doc with:", expenseUpdatePayload);
        batch.update(expenseDocRef, expenseUpdatePayload); // Update the expense document itself

        // Commit Batch ---
        await batch.commit();
        console.log(`Expense ${expenseId} updated and debts recalculated successfully.`);

    } catch (error) {
        console.error(`Error updating expense ${expenseId}: `, error);
        throw error; // Re-throw for handling in UI
    }
  };

  // Helper function
  function addIncrement(updates: Record<string, any>, key: string, value: number) {
    if (value === 0 || isNaN(value)) return; // Don't add increment(0) or NaN
    const existingIncrement = updates[key];
    if (existingIncrement && typeof existingIncrement.operand === 'number') {
        updates[key] = increment(existingIncrement.operand + value);
    } else {
        updates[key] = increment(value);
    }
  }
  
  /**
   * Calculates who should pay next based on who owe the most
   * relative to their budget (Minimum of budget - amtLeft).
   * Handles members with zero budget by excluding them unless everyone has zero budget.
   *
   * @param members - The members map containing budget and amtLeft info.
   * @returns Object with id and name of the next payer, or { id: null, name: null }.
   */
  export function calculateNextPayer(members: DetailedMembersMap | null | undefined): NextPayerResult {
      if (!members || Object.keys(members).length === 0) {
          return { id: null, name: 'No members in trip' };
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
          return { id: nextPayerId, name: members[nextPayerId].name };
      } else if (memberEntries.length > 0) {
        // Fallback if maxOwesTotal <= 0 but members exist: pick first member overall
        const fallbackId = memberEntries[0][0];
        console.log("calculateNextPayer: No one owes money currently, suggesting first member as fallback.");
        return { id: fallbackId, name: members[fallbackId]?.name || 'Unknown' };
      }
      else {
         return { id: null, name: 'No members found' };
      }
    
      return { id: null, name: 'Calculation error' }; // Should ideally not be reached
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
          paidBy: raw.paidBy, // To add paidById later
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
    expenseData: NewExpenseData,
    members: MembersMap 
  ): Promise<void> => {
    // Find the ID of the member who paid based on the name
    const paidByID = Object.keys(members).find(id => members[id].name === expenseData.paidBy);
  
    if (!paidByID) {
      throw new Error(`Could not find member ID for payer: ${expenseData.paidBy}`);
    }
  
    const expenseDocData = {
        ...expenseData,
        createdAt: Timestamp.now(), // Firestore Timestamp
    };
  
    // atomicity
    const batch = writeBatch(db);
  
    // Add the new expense document
    const newExpenseRef = doc(collection(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION)); // Generate ref beforehand to use ID if needed, though addDoc is fine here.
    batch.set(newExpenseRef, expenseDocData);
  
    const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
    const updates: { [key: string]: any } = {};
  
    expenseData.sharedWith.forEach(member => {
      const share = Number(member.amount);
      // If the payee is not the person who paid
      if (member.payeeID !== paidByID) {
        updates[`members.${member.payeeID}.amtLeft`] = increment(-share); // They owe 'share'
        updates[`members.${member.payeeID}.owesTotal`] = increment(share); // Their total debt increases

        // To change to map structure { [payerId]: { [payeeId]: amount } }
        const debtKey = `debts.${member.payeeID}#${paidByID}`; // Debt: payee owes payer
        updates[debtKey] = increment(share);
      } else {
          updates[`members.${paidByID}.amtLeft`] = increment(-share);
      }
    });
  
    // Apply the updates to the trip document
    batch.update(tripDocRef, updates);
  
    // Commit the batch
    try {
        await batch.commit();
        console.log("Expense added and debts updated successfully.");
    } catch (error) {
        console.error("Error adding expense or updating debts: ", error);
        // Rethrow or handle the error (e.g., show a message to the user)
        throw error;
    }
  };
  
  // Function to delete an expense
  // IMPORTANT: Deleting an expense requires recalculating/reversing the debt updates.
  // This can be complex. A simpler approach might be to "soft delete" (mark as deleted)
  // or to implement a recalculation logic triggered on deletion.
  // The example below just deletes the expense doc, but DOES NOT reverse debt changes.
  export const deleteExpense = async (tripId: string, expenseId: string, members: MembersMap): Promise<void> => {
    const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
    try {
        await updateDebts(tripId,expenseId,members);
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
export const updateDebts = async (
    tripId: string,
    expenseId: string,
    members: MembersMap // Needed for payer ID lookup if not stored on expense
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

    const expenseData = expenseSnap.data() as Omit<Expense, 'id' | 'createdAt'> & {createdAt: Timestamp} ; // Type assertion, adjust if needed
    const sharedWith = expenseData.sharedWith;
    const paidByName = expenseData.paidBy;

    // Look up payer ID from name using the members map (May have to change in the future)
     const paidByID = Object.keys(members).find(id => members[id].name === paidByName);
     if (!paidByID) {
         // Handle case where member might have been deleted or name changed since expense creation
         throw new Error(`Could not find member ID for payer named "${paidByName}" in the provided members map while trying to delete expense ${expenseId}. Debt reversal failed.`);
     }

    const reversalUpdates: { [key: string]: any } = {};

    sharedWith.forEach(member => {
      const share = Number(member.amount); // The amount they originally owed or paid

      // Reverse changes for each person involved in the share *except* the original payer
      if (member.payeeID !== paidByID) {
        // Reverse the amount change for the payee
        // They owed 'share', so reversing adds 'share' back to their balance
        reversalUpdates[`members.${member.payeeID}.amtLeft`] = increment(share);
        // Their total debt increased by 'share', so reversing decreases it
        reversalUpdates[`members.${member.payeeID}.owesTotal`] = increment(-share);

        // Reverse the specific debt: payee owed payer 'share'
        const debtKey = `debts.${member.payeeID}#${paidByID}`;
        reversalUpdates[debtKey] = increment(-share); // Decrease the debt

        
      } else {
        reversalUpdates[`members.${paidByID}.amtLeft`] = increment(share);
      }
    });

    // Reverse the net change for the original payer
    

    // 3. Add update and delete operations to the batch
    batch.update(tripDocRef, reversalUpdates);
    batch.delete(expenseDocRef);

    // 4. Commit the batch
    await batch.commit();
    console.log(`Expense ${expenseId} deleted and debt changes reversed successfully.`);

  } catch (error) {
    console.error(`Error deleting expense ${expenseId} and reversing debts: `, error);
    // Rethrow the error so the calling function knows it failed
    throw error;
  }
};