// src/services/expenseService.ts
// Utility functions
import {
	collection,
	doc,
	increment,
	writeBatch,
	updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Expense, Member, Debt, FREE_USER_LIMITS, PREMIUM_USER_LIMITS, ErrorType, FirestoreExpense, TripData, TripsTableDDB } from '@/src/types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from '@/src/services/notification';
import { convertCurrency } from '@/src/services/CurrencyService';

const TRIPS_COLLECTION = 'trips';
const EXPENSES_SUBCOLLECTION = 'expenses';

export const updateExpense = async (expenseId: string, tripId: string, updatedExpenseData: Expense, members: Record<string, Member>, expense: FirestoreExpense, tripCurrency: string): Promise<void> => {

	const expenseDocRef = doc(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION, expenseId);
	const batch = writeBatch(db);

	try {
		if (!expense) {
			throw new Error(`Original expense not found.`);
		}

		const originalExpense = expense as Expense

		const reversalRaw = await generateExpenseImpactUpdate({}, originalExpense, members, true, tripCurrency);
		reversalRaw['totalAmtLeft'] = getTotalPaid(originalExpense.paidByAndAmounts);
		const applyRaw = await generateExpenseImpactUpdate({}, updatedExpenseData, members, false, tripCurrency);
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
		// This function is not async, so it doesn't need to await updateExpense
		// The updateExpense function itself is async and needs to be awaited
		// For now, we'll call it directly, but in a real scenario, this would need to be awaited
		// or the signature of editExpense would need to be changed.
		// For now, assuming updateExpense is called within this function.
		// If updateExpense is truly async, this function would need to be async.
		// Given the original code, it's not.
		await updateExpense(expenseId, tripId, updatedExpenseData, members, expense, 'USD'); // Placeholder for tripCurrency
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

export const generateExpenseImpactUpdate = async (
	updates: { [key: string]: any },
	expenseData: Expense,
	members: Record<string, Member>,
	reverse: boolean,
  tripCurrency: string,
	expenseId?: string,
	convertedPaidAmt?: number
): Promise<{ [key: string]: any }> => {
  const { sharedWith, paidByAndAmounts } = expenseData;
	if (!paidByAndAmounts) {
	  throw new Error(`paid by and amount map has error: ${paidByAndAmounts}`);
	}
  // Group paidByAndAmounts by currency
  const payersByCurrency: { [currency: string]: { memberName: string, amount: string }[] } = {};
	paidByAndAmounts.forEach(p => {
    const cur = (p as any).currency || expenseData.currency || tripCurrency || 'USD';
    if (!payersByCurrency[cur]) payersByCurrency[cur] = [];
    payersByCurrency[cur].push(p);
  });
  let totalPaidInTripCurrency = 0;
  // For each currency, calculate net balances and update debts
  await Promise.all(Object.entries(payersByCurrency).map(async ([currency, payers]) => {
    // Net balances for all members in this currency
	const allMemberNames = Array.from(new Set([
      ...payers.map(p => p.memberName),
      ...sharedWith.filter(sw => sw.currency === currency).map(s => s.payeeName)
	]));
	const netBalances: Record<string, number> = {};
  	for (const member of allMemberNames) {
      const paid = Number(payers.find(p => p.memberName === member)?.amount || 0);
      const owed = Number(sharedWith.filter(sw => sw.currency === currency).find(s => s.payeeName === member)?.amount || 0);
  	  netBalances[member] = paid - owed;
  	}
    const multiplier = reverse ? 1 : -1;
    // List debtors and creditors
  	const debtors = Object.entries(netBalances).filter(([_, net]) => net < -0.001);
  	const creditors = Object.entries(netBalances).filter(([_, net]) => net > 0.001);
    // Settle debts in this currency
    let debtorsCopy = debtors.map(([name, net]) => [name, -Number(net)] as [string, number]);
    let creditorsCopy = creditors.map(([name, net]) => [name, Number(net)] as [string, number]);
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
    // Update member balances in this currency
    for (const payer of payers) {
	  const paidAmount = Number(payer.amount);
	  if (!isNaN(paidAmount) && paidAmount !== 0) {
		updates[`members.${payer.memberName}.amtLeft`] =
      		(updates[`members.${payer.memberName}.amtLeft`] || 0) + multiplier * paidAmount;
        // Convert to trip currency and add to total
        const converted = await convertCurrency(paidAmount, currency, tripCurrency);
        totalPaidInTripCurrency += multiplier * converted;
	  }
	}
  }));
  // Update totalAmtLeft in trip currency only
  if (!isNaN(totalPaidInTripCurrency)) {
    updates[`totalAmtLeft`] = (updates[`totalAmtLeft`] || 0) + totalPaidInTripCurrency;
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
	tripData: TripsTableDDB
): Promise<void> => {

	const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);

	// TODO: add premium feature later
	/*
	const isPremium = tripData.isTripPremium || tripData.premiumStatus === 'premium';
	const today = new Date().toISOString().slice(0, 10);

	if (!isPremium) {
		const amtLeft = tripData.dailyExpenseLimit?.[today] ?? FREE_USER_LIMITS.maxExpensesPerDayPerTrip;
		if (amtLeft <= 0) {
		throw new Error(ErrorType.MAX_EXPENSES_FREE_USER);
		}
	}
		*/

	const expenseDocData = {
		...expenseData,
		createdAt: expenseData.createdAt,
	};

	const batch = writeBatch(db);
	const newExpenseRef = doc(collection(db, TRIPS_COLLECTION, tripId, EXPENSES_SUBCOLLECTION));
	batch.set(newExpenseRef, expenseDocData);

	let updatesRaw: { [key: string]: number } = {};
	const convertedPaidAmt = await convertCurrency(getTotalPaid(expenseData.paidByAndAmounts), expenseData.currency , tripData.currency);
	updatesRaw = await generateExpenseImpactUpdate(updatesRaw, expenseData, members, false, tripData.currency);
	updatesRaw['totalAmtLeft'] = -convertedPaidAmt;
	let updates = formatToFirebase(updatesRaw);
	updates['expensesCount'] = increment(1);

	// TODO: premium feature
	/*
	if (!isPremium) {
		const amtLeft = tripData.dailyExpenseLimit?.[today] ?? FREE_USER_LIMITS.maxExpensesPerDayPerTrip;
		const newAmtLeft = amtLeft - 1;
		updates[`dailyExpenseLimit.${today}`] = newAmtLeft;
	}
	*/
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
export const deleteExpense = async (tripId: string, expenseId: string, expense: FirestoreExpense, tripData: TripsTableDDB): Promise<void> => {
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
	tripData: TripsTableDDB
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
		reversalUpdatesRaw = await generateExpenseImpactUpdate(reversalUpdatesRaw, expenses as Expense, members, reverse, tripData.currency);
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

export async function incrementDailyExpenseLimitForTrip(tripId: string, trip: any, incrementBy = 10) {
  const today = new Date().toISOString().slice(0, 10);
  const dailyExpenseLimit = { ...(trip.dailyExpenseLimit || {}) };
  dailyExpenseLimit[today] = (dailyExpenseLimit[today] || FREE_USER_LIMITS.maxExpensesPerDayPerTrip) + incrementBy;
  await updateDoc(doc(db, "trips", tripId), { dailyExpenseLimit });
}