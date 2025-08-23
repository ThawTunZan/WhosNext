// src/services/expenseService.ts
import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";
import {ExpenseDDB,} from "@/src/types/DataTypes";
import {
  addExpenseToTrip,
  updateExpense as ddbUpdateExpense,
  getTripById,
} from "@/src/aws-services/DynamoDBService";
import { NotificationService, NOTIFICATION_TYPES } from "@/src/services/notification";
import { updateTripMetaData } from '@/src/firebase/FirebaseTripService';

/**
 * Simplify debts by netting them out and convert to array of strings.
 * Format: creditor#debtor#amount#currency
 */
export function simplifyDebtsToArray(
  debts: Record<string, Record<string, number>>
): string[] {
  const simplified: string[] = [];

  for (const [currency, pairs] of Object.entries(debts)) {
    const temp: Record<string, number> = {};

    for (const [pair, amount] of Object.entries(pairs)) {
      const [creditor, debtor] = pair.split("#");
      const reverseKey = `${debtor}#${creditor}`;

      if (temp[reverseKey] !== undefined) {
        const net = temp[reverseKey] - amount;
        if (net > 0) {
          temp[reverseKey] = net;
        } else if (net < 0) {
          delete temp[reverseKey];
          temp[pair] = -net;
        } else {
          delete temp[reverseKey];
        }
      } else {
        temp[pair] = amount;
      }
    }

    for (const [pair, amount] of Object.entries(temp)) {
      if (amount > 0) {
        const [creditor, debtor] = pair.split("#");
        simplified.push(`${creditor}#${debtor}#${amount.toFixed(2)}#${currency}`);
      }
    }
  }

  return simplified;
}

/**
 * Add a new expense to a trip and update debts.
 */
export const addExpenseAndCalculateDebts = async (
  tripId: string,
  expenseData: Omit<ExpenseDDB, "expenseId" | "tripId" | "createdAt" | "updatedAt">
): Promise<ExpenseDDB> => {
  const expenseId = uuidv4();
  const now = new Date().toISOString();

  const expense: ExpenseDDB = {
    ...expenseData,
    expenseId,
    tripId,
    createdAt: now,
    updatedAt: now,
  };

  await addExpenseToTrip(tripId, expenseId, expense);

  const trip = await getTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  const debtsMap: Record<string, Record<string, number>> = {};

  // turn debts to map for easier insert
  for (const d of trip.debts ?? []) {
    const [creditor, debtor, amount, currency] = d.split("#");
    debtsMap[currency] = debtsMap[currency] || {};
    const key = `${creditor}#${debtor}`;
    debtsMap[currency][key] = (debtsMap[currency][key] || 0) + parseFloat(amount);
  }

  for (const { payeeName, amount, currency } of expense.sharedWith ?? []) {
    if (payeeName === expense.paidBy) continue;
    debtsMap[currency] = debtsMap[currency] || {};
    const key = `${expense.paidBy}#${payeeName}`;
    debtsMap[currency][key] = (debtsMap[currency][key] || 0) + amount;
  }

  const simplifiedDebts = simplifyDebtsToArray(debtsMap);
  await updateTripMetaData(tripId, { debts: simplifiedDebts });

  for (const share of expense.sharedWith ?? []) {
    if (share.payeeName !== expense.paidBy) {
      await NotificationService.sendExpenseAlert(
        "New Expense Added",
        `${expense.paidBy} paid ${expense.amount.toFixed(2)} for ${expense.activityName}`,
        {
          type: NOTIFICATION_TYPES.EXPENSE_ALERT,
          id: expense.expenseId,
          tripId: tripId,
        }
      );
    }
  }

  return expense;
};

/**
 * Update an expense and recalculate debts.
 */
export const updateExpense = async (
  tripId: string,
  expenseId: string,
  newExpenseData: Partial<ExpenseDDB>,
  originalExpense: ExpenseDDB
) => {
  const updated = await ddbUpdateExpense(tripId, expenseId, newExpenseData);

  const trip = await getTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  const debtsMap: Record<string, Record<string, number>> = {};

  for (const d of trip.debts ?? []) {
    const [creditor, debtor, amount, currency] = d.split("#");
    debtsMap[currency] = debtsMap[currency] || {};
    const key = `${creditor}#${debtor}`;
    debtsMap[currency][key] = (debtsMap[currency][key] || 0) + parseFloat(amount);
  }

  // update debts as if the expense being updated is being deleted
  for (const { payeeName, amount, currency } of originalExpense.sharedWith ?? []) {
    const key = `${originalExpense.paidBy}#${payeeName}`;
    if (debtsMap[currency]?.[key]) {
      debtsMap[currency][key] = Math.max(0, debtsMap[currency][key] - amount);
      if (debtsMap[currency][key] === 0) delete debtsMap[currency][key];
    }
  }

  // update debts with the new expense data
  for (const { payeeName, amount, currency } of newExpenseData.sharedWith ?? []) {
    if (payeeName === newExpenseData.paidBy) continue;
    debtsMap[currency] = debtsMap[currency] || {};
    const key = `${newExpenseData.paidBy}#${payeeName}`;
    debtsMap[currency][key] = (debtsMap[currency][key] || 0) + amount;
  }

  const simplifiedDebts = simplifyDebtsToArray(debtsMap);
  await updateTripMetaData(tripId, { debts: simplifiedDebts });

  return updated;
};
