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
	arrayUnion,
	arrayRemove,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Expense, Member, Currency, Debt } from '../types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from './notification';
import { convertCurrency } from './CurrencyService';

const TRIPS_COLLECTION = 'trips';
const EXPENSES_SUBCOLLECTION = 'expenses';

export const updateExpense = async (expenseId: string, tripId: string, updatedExpenseData: Expense, members: Record<string, Member>, profiles: Record<string, string>): Promise<void> => {

	const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
	const batch = writeBatch(db);

	try {
		const originalExpenseSnap = await getDoc(expenseDocRef);
		if (!originalExpenseSnap.exists()) {
			throw new Error(`Original expense with ID ${expenseId} not found.`);
		}

		const originalExpense = originalExpenseSnap.data() as Expense

		const reversalRaw = generateExpenseImpactUpdate({}, originalExpense, members, true, profiles);
		reversalRaw['totalAmtLeft'] = originalExpense.paidAmt
		const applyRaw = generateExpenseImpactUpdate({}, updatedExpenseData, members, false, profiles);
		applyRaw['totalAmtLeft'] = -updatedExpenseData.paidAmt

		const combinedUpdates = mergeIncrements(reversalRaw, applyRaw)

		const expenseUpdatePayload = {
			...updatedExpenseData,
			updatedAt: Timestamp.now(),
		};
		batch.update(expenseDocRef, expenseUpdatePayload); // Update the expense document itself
		updateBalanceAndDebts(batch, tripId, combinedUpdates, expenseId);
		await batch.commit();

	} catch (error) {
		console.error(`Error updating expense ${expenseId}: `, error);
		throw error;
	}

}

export const updateBalanceAndDebts = (batch: any, tripId: string, combinedUpdates: { [key: string]: any }, expenseId: string) => {

	const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
	try {
		batch.update(tripDocRef, combinedUpdates);

	} catch (error) {
		console.error(`Error updating expense ${expenseId}: `, error);
		throw error;
	}
}


export const editExpense = async (
	tripId: string,
	expenseId: string | null,
	updatedExpenseData: Expense,
	members: Record<string, Member>,
	profiles: Record<string, string>
): Promise<void> => {
	if (!tripId || !expenseId) {
		throw new Error("Trip ID and Expense ID are required for update.");
	}

	try {
		await updateExpense(expenseId, tripId, updatedExpenseData, members, profiles);
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
		console.log("a [key] is " + key + " " + a[key])
		console.log("b [key] is " + key + " " + b[key])
		const total = aVal + bVal;

		if (total !== 0) {
			result[key] = increment(total);
		}
	}

	return result;
}

export const generateExpenseImpactUpdate = (
	updates: { [key: string]: any },
	expenseData: Expense,
	members: Record<string, Member>,
	reverse: boolean,
	profiles: Record<string, string>,
	expenseId?: string,
	convertedPaidAmt?: number
): { [key: string]: any } => {

	const { sharedWith, paidById, paidAmt, currency } = expenseData;

	if (!paidById) {
		throw new Error(`Payer ID is missing from expense data ${expenseId ? `for expense ${expenseId}` : ''}`);
	}

	// Check if the payer exists in members
	if (!members[paidById]) {
		throw new Error(`Payer "${profiles[paidById] || paidById}" not found in members. Failed to ${reverse ? 'reverse' : 'process'} expense ${expenseId || ''}.`);
	}

	const multiplier = (reverse) ? 1 : -1;

	// handle debts
	for (const member of sharedWith) {
		const share = Number(member.amount);
		const payeeID = member.payeeID;
		if (payeeID !== paidById && !isNaN(share)) {
			
			const debtAmount = Math.abs(share);
			if (!isNaN(debtAmount) && debtAmount > 0) {
				if (!reverse) {
					const debtKey = `${payeeID}#${paidById}`;
					updates[`debts.${currency}.${debtKey}`] = debtAmount;
				} else {
					const debtKey = `${paidById}#${payeeID}`;
					updates[`debts.${currency}.${debtKey}`] = debtAmount;
				}
			}
		}
	}

	// Only the payer's amtLeft is reduced by the full paidAmt
	if (!isNaN(paidAmt)) {  // Add check for NaN
		updates[`members.${paidById}.amtLeft`] = multiplier * paidAmt;
		updates[`totalAmtLeft`] = multiplier * paidAmt;
	}

	return updates;
};

function formatToFirebase(updates: { [key: string]: any }) {
	const out: { [key: string]: any } = {};
	for (const [k, v] of Object.entries(updates)) {
		if (typeof v === 'number') {
			out[k] = increment(v);
		} else if (k.startsWith('debts.')) {
			// Handle nested debt updates with dot notation
			// The key will be in format: debts.USD.user1#user2
			out[k] = increment(v);
		} else {
			out[k] = v;
		}
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
export async function calculateNextPayer(members: Record<string, Member> | null | undefined, profiles: Record<string, string>, tripCurrency: string): Promise<string> {
	if (!members || Object.keys(members).length === 0) {
		return '';
	}

	let nextPayerId: string | null = null;
	let maxAmountOwe = -9999;

	const memberEntries = Object.entries(members);

	// Filter out members with non-positive budget unless ALL members have non-positive budget
	for (const [id, member] of memberEntries) {
		// Calculate total owed across all currencies
		if (member.owesTotalMap) {
			let totalOwed = 0;
			for (const [currency, amount] of Object.entries(member.owesTotalMap)) {
				// Convert each currency amount to trip's currency before adding
				const convertedAmount = await convertCurrency(amount, currency as Currency, tripCurrency as Currency);
				totalOwed += convertedAmount;
			}

			if (totalOwed > maxAmountOwe) {
				maxAmountOwe = totalOwed;
				nextPayerId = id;
			}
		}
	}

	if (nextPayerId && members[nextPayerId]) {
		return nextPayerId;
	} else if (memberEntries.length > 0) {
		// Fallback if maxOwesTotal <= 0 but members exist: pick first member overall
		const fallbackId = memberEntries[0][0];
		console.log("calculateNextPayer: No one owes money currently, suggesting first member as fallback.");
		return fallbackId;
	}

	return null;
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
				currency: raw.currency,
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
	const tripSnap = await getDoc(tripDocRef);
	const tripData = tripSnap.data();
	let updatesRaw: { [key: string]: number } = {};
	const convertedPaidAmt = await convertCurrency(expenseData.paidAmt, expenseData.currency, tripData.currency);
	updatesRaw = generateExpenseImpactUpdate(updatesRaw, expenseData, members, false, profiles, expenseData.id, convertedPaidAmt);
	updatesRaw['totalAmtLeft'] = -convertedPaidAmt;
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
export const deleteExpense = async (tripId: string, expenseId: string, members: Record<string, Member>, profiles: Record<string, string>): Promise<void> => {
	try {
		// Get the expense data first
		const expenseRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
		const expenseSnap = await getDoc(expenseRef);
		
		if (!expenseSnap.exists()) {
			throw new Error('Expense not found');
		}

		const expenseData = expenseSnap.data() as Expense;
		const { paidById, sharedWith, currency, paidAmt } = expenseData;

		// Create a batch for atomic operations
		const batch = writeBatch(db);

		// Delete the expense document
		batch.delete(expenseRef);

		// Get current debts
		const tripRef = doc(db, TRIPS_COLLECTION, tripId);
		const tripSnap = await getDoc(tripRef);
		
		if (!tripSnap.exists()) {
			throw new Error('Trip not found');
		}
		
		const tripData = tripSnap.data();
		const debts = tripData?.debts || {};
		const currencyDebts = debts[currency] || {};

		// Process each share to update debts
		const updates: { [key: string]: any } = {};

		for (const share of sharedWith) {
			if (share.payeeID === paidById) continue; // Skip if share belongs to payer

			const shareAmount = Number(share.amount);
			if (isNaN(shareAmount) || shareAmount <= 0) continue;

			// Get the current debt values in both directions
			const payeeToPayerKey = `${share.payeeID}#${paidById}`;
			const payerToPayeeKey = `${paidById}#${share.payeeID}`;
			
			const currentPayeeToPayer = currencyDebts[payeeToPayerKey] || 0;

			// If current debt from payee to payer is greater than or equal to share amount
			// simply decrease that debt
			if (currentPayeeToPayer >= shareAmount) {
				updates[`debts.${currency}.${payeeToPayerKey}`] = increment(-shareAmount);
			} else {
				// If there was any existing debt, clear it
				if (currentPayeeToPayer > 0) {
					updates[`debts.${currency}.${payeeToPayerKey}`] = 0;
				}

				// Add the remaining amount to the reverse direction
				const remainingAmount = shareAmount - currentPayeeToPayer;
				updates[`debts.${currency}.${payerToPayeeKey}`] = increment(remainingAmount);
			}
		}

		// Only restore the payer's amtLeft since they were the only one who paid
		console.log("paidAmt is " + paidAmt)
		updates[`members.${paidById}.amtLeft`] = increment(paidAmt);
		updates[`totalAmtLeft`] = increment(paidAmt);

		// Apply all updates
		batch.update(tripRef, updates);

		// Commit the batch
		await batch.commit();
	} catch (error) {
		console.error('Error deleting expense:', error);
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