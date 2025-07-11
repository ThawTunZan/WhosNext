// src/services/expenseService.ts
// Utility functions
import {
	collection,
	doc,
	increment,
	writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Expense, Member, Debt, FREE_USER_LIMITS, PREMIUM_USER_LIMITS, ErrorType, FirestoreExpense, TripData, FirestoreTrip } from '@/src/types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from '@/src/services/notification';
import { convertCurrency } from '@/src/services/CurrencyService';

const TRIPS_COLLECTION = 'trips';
const EXPENSES_SUBCOLLECTION = 'expenses';

export const updateExpense = async (expenseId: string, tripId: string, updatedExpenseData: Expense, members: Record<string, Member>, expense: FirestoreExpense): Promise<void> => {

	const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
	const batch = writeBatch(db);

	try {
		if (!expense) {
			throw new Error(`Original expense not found.`);
		}

		const originalExpense = expense as Expense

		const reversalRaw = generateExpenseImpactUpdate({}, originalExpense, members, true);
		reversalRaw['totalAmtLeft'] = getTotalPaid(originalExpense.paidByAndAmounts);
		const applyRaw = generateExpenseImpactUpdate({}, updatedExpenseData, members, false);
		applyRaw['totalAmtLeft'] = -getTotalPaid(updatedExpenseData.paidByAndAmounts);

		const combinedUpdates = mergeIncrements(reversalRaw, applyRaw)

		const expenseUpdatePayload = {
			...updatedExpenseData,
			// TODO
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
	expense: FirestoreExpense
): Promise<void> => {
	if (!tripId || !expenseId) {
		throw new Error("Trip ID and Expense ID are required for update.");
	}

	try {
		await updateExpense(expenseId, tripId, updatedExpenseData, members, expense);
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
	expenseId?: string,
	convertedPaidAmt?: number
  ): { [key: string]: any } => {
  
	const { sharedWith, paidByAndAmounts, currency } = expenseData;
  
	if (!paidByAndAmounts) {
	  throw new Error(`paid by and amount map has error: ${paidByAndAmounts}`);
	}
  
	// Validate payers
	paidByAndAmounts.forEach(p => {
	  if (!members[p.memberName]) {
		throw new Error(`${p.memberName} does not exist in the trip!`);
	  }
	});
  
	const multiplier = reverse ? 1 : -1;
	
	const allMemberNames = Array.from(new Set([
		...paidByAndAmounts.map(p => p.memberName),
		...sharedWith.map(s => s.payeeName)
	]));
	const netBalances: Record<string, number> = {};
  	for (const member of allMemberNames) {
  	  const paid = Number(paidByAndAmounts.find(p => p.memberName === member)?.amount || 0);
  	  const owed = Number(sharedWith.find(s => s.payeeName === member)?.amount || 0);
  	  netBalances[member] = paid - owed;
  	}

  	// 2. List debtors and creditors
  	const debtors = Object.entries(netBalances).filter(([_, net]) => net < -0.001);
  	const creditors = Object.entries(netBalances).filter(([_, net]) => net > 0.001);
	console.log("DEBTORS ARE ", debtors);
	console.log("CREDITORS ARE ", creditors)

  	// 3. Settle debts
  	let debtorsCopy = debtors.map(([name, net]) => [name, -Number(net)] as [string, number]); // amount owed (positive)
  	let creditorsCopy = creditors.map(([name, net]) => [name, Number(net)] as [string, number]); // amount to receive (positive)
	  console.log("debtorsCOPY ARE ", debtorsCopy);
	  console.log("creditorsCOPY ARE ", creditorsCopy)

	for (let i = 0; i < debtorsCopy.length; i++) {
    	let [debtor, amtToSettle] = debtorsCopy[i];
    	for (let j = 0; j < creditorsCopy.length && amtToSettle > 0.001; j++) {
    	  let [creditor, creditAmt] = creditorsCopy[j];
    	  if (creditAmt < 0.001) continue;
    	  const settleAmt = Math.min(amtToSettle, creditAmt);
		  if (settleAmt > 0) {
		    const debtKey = reverse
		  	? `${creditor}#${debtor}`
		  	: `${debtor}#${creditor}`;
		
		    updates[`debts.${currency}.${debtKey}`] =
		  	(updates[`debts.${currency}.${debtKey}`] || 0) + settleAmt;
		  }
    	}
  	}

  
	// Calculate totalPaidAmt
	let totalPaidAmt = 0;
	for (const payer of paidByAndAmounts) {
	  const paidAmount = Number(payer.amount);
	  if (!isNaN(paidAmount) && paidAmount !== 0) {
		// update individual's amt left
		console.log("UPDATING ")
		updates[`members.${payer.memberName}.amtLeft`] =
      		(updates[`members.${payer.memberName}.amtLeft`] || 0) + multiplier * paidAmount;
		//update the total amt left in the trip
	    totalPaidAmt += paidAmount;
	  }
	}

	// === Update totalAmtLeft ===
	if (!isNaN(totalPaidAmt)) {
	  updates[`totalAmtLeft`] =
		(updates[`totalAmtLeft`] || 0) + multiplier * totalPaidAmt;
	  console.log(`totalAmtLeft adjustment = ${multiplier * totalPaidAmt}`);
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
export async function calculateNextPayer(members: Record<string, Member> | null | undefined, tripCurrency: string): Promise<string> {
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
				const convertedAmount = await convertCurrency(amount, currency, tripCurrency);
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

// To add a new expense and update related balances/debts
export const addExpenseAndCalculateDebts = async (
	tripId: string,
	expenseData: Expense,
	members: Record<string, Member>,
	tripData: FirestoreTrip
): Promise<void> => {

	const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);

	if (tripData.expensesCount >= FREE_USER_LIMITS.maxExpensesPerDayPerTrip && !tripData.isTripPremium) {
		throw new Error(ErrorType.MAX_EXPENSES_FREE_USER);
	}

	if (tripData.expensesCount >= PREMIUM_USER_LIMITS.maxExpensesPerDayPerTrip && tripData.isTripPremium) {
		throw new Error(ErrorType.MAX_EXPENSES_PREMIUM_USER);
	}

	const expenseDocData = {
		...expenseData,
		createdAt: expenseData.createdAt,
	};

	const batch = writeBatch(db);
	const newExpenseRef = doc(collection(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION));
	batch.set(newExpenseRef, expenseDocData);

	let updatesRaw: { [key: string]: number } = {};
	const convertedPaidAmt = await convertCurrency(getTotalPaid(expenseData.paidByAndAmounts), expenseData.currency , tripData.currency);
	updatesRaw = generateExpenseImpactUpdate(updatesRaw, expenseData, members, false, expenseData.id, convertedPaidAmt);
	updatesRaw['totalAmtLeft'] = -convertedPaidAmt;
	let updates = formatToFirebase(updatesRaw);
	updates['expensesCount'] = increment(1);

	batch.update(tripDocRef, updates);
	
	try {
		await batch.commit();
		console.log("Expense added and debts updated successfully.");

		// Send notifications to all members involved
		const payerNames = expenseData.paidByAndAmounts.map(p => p.memberName|| 'Someone').join(', ');
		const amount = getTotalPaid(expenseData.paidByAndAmounts).toFixed(2);

		// Notify everyone who needs to pay (not a payer)
		expenseData.sharedWith.forEach(async (shared) => {
			const isPayer = expenseData.paidByAndAmounts.some(p => p.memberName === shared.payeeName);
			if (!isPayer) {
				await NotificationService.sendExpenseAlert(
					"New Expense Added",
					`${payerNames} paid ${amount} for ${expenseData.activityName}`,
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
export const deleteExpense = async (tripId: string, expenseId: string, expense: FirestoreExpense, tripData: FirestoreTrip): Promise<void> => {
	try {
		// Get the expense data first
		const expenseRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);

		const expenseData = expense as Expense;
		const { sharedWith, currency, paidByAndAmounts } = expenseData;

		// Create a batch for atomic operations
		const batch = writeBatch(db);

		// Delete the expense document
		batch.delete(expenseRef);

		// Get current debts
		const tripRef = doc(db, TRIPS_COLLECTION, tripId);
		
		if (!tripData) {
			throw new Error('Trip not found');
		}

		const debts = tripData?.debts || {};
		const currencyDebts = debts[currency] || {};

		// Process each share to update debts
		const updates: { [key: string]: any } = {};

		for (const share of sharedWith) {
			const shareAmount = Number(share.amount);
			if (isNaN(shareAmount) || shareAmount <= 0) continue;

			for (const payer of paidByAndAmounts) {
				if (share.payeeName === payer.memberName) continue; // Skip if share belongs to payer
				const payeeToPayerKey = `${share.payeeName}#${payer.memberName}`;
				const payerToPayeeKey = `${payer.memberName}#${share.payeeName}`;
				const currentPayeeToPayer = currencyDebts[payeeToPayerKey] || 0;
				const payerShareAmount = shareAmount * (Number(payer.amount) / getTotalPaid(paidByAndAmounts));

				if (currentPayeeToPayer >= payerShareAmount) {
					updates[`debts.${currency}.${payeeToPayerKey}`] = increment(-payerShareAmount);
				} else {
					if (currentPayeeToPayer > 0) {
						updates[`debts.${currency}.${payeeToPayerKey}`] = 0;
					}
					const remainingAmount = payerShareAmount - currentPayeeToPayer;
					updates[`debts.${currency}.${payerToPayeeKey}`] = increment(remainingAmount);
				}
			}
		}

		// Restore amtLeft for each payer
		let totalPaidAmt = 0;
		for (const payer of paidByAndAmounts) {
			const paidAmount = Number(payer.amount);
			if (!isNaN(paidAmount) && paidAmount !== 0) {
				updates[`members.${payer.memberName}.amtLeft`] = increment(paidAmount);
				totalPaidAmt += paidAmount;
			}
		}
		updates[`totalAmtLeft`] = increment(totalPaidAmt);

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
	expenses: FirestoreExpense,
): Promise<void> => {
	const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
	const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);
	const batch = writeBatch(db);

	try {
		if (!expenses) {
			console.warn(`Expense document not found. Cannot reverse debts.`);
			return;
		}

		let reversalUpdatesRaw: { [key: string]: number } = {}
		reversalUpdatesRaw = generateExpenseImpactUpdate(reversalUpdatesRaw, expenses as Expense, members, reverse, expenseId);
		let reversalUpdates = formatToFirebase(reversalUpdatesRaw)

		batch.update(tripDocRef, reversalUpdates);
		batch.delete(expenseDocRef);
		await batch.commit();

	} catch (error) {
		console.error(`Error deleting expense ${expenseId} and reversing debts: `, error);
		throw error;
	}
};

// Helper to sum total paid from paidByAndAmounts
function getTotalPaid(paidByAndAmounts: {memberName: string, amount: string}[]): number {
	return paidByAndAmounts.reduce((sum, p) => sum + Number(p.amount), 0);
}