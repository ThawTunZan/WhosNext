// src/services/expenseService.ts

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import {
  updateTrip,
  createExpense,
  updateExpense as updateExpenseMutation,
  createDebt,
  deleteDebt,
  updateDebt,
} from '@/src/graphql/mutations';
import { listDebts } from '@/src/graphql/queries';
import {
  Expense,
  Debt,
  TripsTableDDB,
  MemberDDB,
} from '@/src/types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from '@/src/services/notification';
import { v4 as uuidv4 } from 'uuid';

const client = generateClient();

export const updateExpense = async (
  expenseId: string,
  tripId: string,
  updatedExpenseData: Expense,
  originalExpense: Expense,
): Promise<void> => {
  const oldPaidBy = originalExpense.paidBy;
  const oldSharedWith = originalExpense.sharedWith;
  const newPaidBy = updatedExpenseData.paidBy;
  const newSharedWith = updatedExpenseData.sharedWith;

  // Step 1: Update the expense document
  await client.graphql({
    query: updateExpenseMutation,
    variables: {
      input: {
        id: expenseId,
        ...updatedExpenseData,
      },
    },
  });

  // Step 2: Get all existing debts for this trip
  const existingDebtsResp: any = await client.graphql({
    query: listDebts,
    variables: {
      filter: { tripId: { eq: tripId } },
    },
  });

  const existingDebts: Record<string, any> = {};
  existingDebtsResp?.data?.listDebts?.items.forEach((debt: any) => {
    const key = `${debt.currency}#${debt.creditor}#${debt.debtor}`;
    existingDebts[key] = debt;
  });

  // Step 3: Remove old sharedWith effects
  for (const { payeeName, amount, currency } of oldSharedWith) {
    const key = `${currency}#${oldPaidBy}#${payeeName}`;
    if (existingDebts[key]) {
      const newAmount = existingDebts[key].amount - amount;
      await client.graphql({
        query: updateDebt,
        variables: {
          input: {
            id: existingDebts[key].id,
            amount: newAmount,
          },
        },
      });
    }
  }

  // Step 4: Add new sharedWith effects
  for (const { payeeName, amount, currency } of newSharedWith) {
    await simplifyDebts(
      tripId,
      payeeName,
      newPaidBy,
      amount,
      currency,
      existingDebts
    );
  }
};

export async function getExistingDebtsMap(tripId: string): Promise<Record<string, any>> {
  const response: any = await client.graphql({
    query: listDebts,
    variables: {
      filter: { tripId: { eq: tripId } },
    },
  });

  const map: Record<string, any> = {};
  response?.data?.listDebts?.items.forEach((debt: any) => {
    const key = `${debt.currency}#${debt.creditor}#${debt.debtor}`;
    map[key] = debt;
  });
  return map;
}

export async function updateOrCreateDebts(
  tripId: string,
  creditor: string,
  sharedWith: { payeeName: string; amount: number; currency: string }[],
  existingDebts: Record<string, any>
): Promise<void> {
  for (const { payeeName, amount, currency } of sharedWith) {
    const key = `${currency}#${creditor}#${payeeName}`;

    if (existingDebts[key]) {
      const updatedAmount = existingDebts[key].amount + amount;
      await client.graphql({
        query: updateDebt,
        variables: {
          input: {
            id: existingDebts[key].id,
            amount: updatedAmount,
          },
        },
      });
    } else {
      await client.graphql({
        query: createDebt,
        variables: {
          input: {
            id: uuidv4(),
            tripId,
            creditor,
            debtor: payeeName,
            currency,
            amount,
          },
        },
      });
    }
  }
}

export const addExpenseAndCalculateDebts = async (
  tripId: string,
  expenseData: Expense,
): Promise<void> => {
  try {
    // 1. Create the expense entry
    await client.graphql({
      query: createExpense,
      variables: {
        input: {
          ...expenseData,
          tripId,
          createdAt: new Date().toISOString(),
        },
      },
    });

    // 2. Fetch current debts from DynamoDB
    const existingDebts = await getExistingDebtsMap(tripId);

    // 3. Update debts based on the new expense
    for (const { payeeName, amount, currency } of expenseData.sharedWith) {
      await simplifyDebts(
        tripId,
        payeeName,
        expenseData.paidBy,
        amount,
        currency,
        existingDebts
      );
    }

    // 4. Notify affected members (sharedWith excluding payer)
    const payerName = expenseData.paidBy;
    const amount = expenseData.amount.toFixed(2);

    for (const share of expenseData.sharedWith) {
      if (share.payeeName !== payerName) {
        await NotificationService.sendExpenseAlert(
          'New Expense Added',
          `${payerName} paid ${amount} for ${expenseData.activityName}`,
          {
            type: NOTIFICATION_TYPES.EXPENSE_ALERT,
            id: expenseData.id,
            tripId: tripId,
          }
        );
      }
    }

    console.log('Expense and debts successfully added.');
  } catch (error) {
    console.error('Error adding expense or updating debts:', error);
    throw error;
  }
};

export const simplifyDebts = async (
  tripId: string,
  debtor: string,
  creditor: string,
  amount: number,
  currency: string,
  existingDebts: Record<string, Debt>
): Promise<void> => {
  if (debtor === creditor || amount === 0) return;

  const key = `${currency}#${debtor}#${creditor}`;
  const reverseKey = `${currency}#${creditor}#${debtor}`;

  const forwardDebt = existingDebts[key];
  const reverseDebt = existingDebts[reverseKey];

  if (forwardDebt && reverseDebt) {
    const net = reverseDebt.amount - forwardDebt.amount + amount;
    if (net > 0) {
      await client.graphql({
        query: updateDebt,
        variables: { input: { id: reverseKey, amount: net } },
      });
      await client.graphql({
        query: deleteDebt,
        variables: { input: { id: key } },
      });
    } else if (net < 0) {
      await client.graphql({
        query: updateDebt,
        variables: { input: { id: key, amount: -net } },
      });
      await client.graphql({
        query: deleteDebt,
        variables: { input: { id: reverseKey } },
      });
    } else {
      await client.graphql({ query: deleteDebt, variables: { input: { id: key } } });
      await client.graphql({ query: deleteDebt, variables: { input: { id: reverseKey } } });
    }
  } else if (reverseDebt) {
    const net = reverseDebt.amount - amount;
    if (net > 0) {
      await client.graphql({
        query: updateDebt,
        variables: { input: { id: reverseKey, amount: net } },
      });
    } else if (net < 0) {
      await client.graphql({ query: deleteDebt, variables: { input: { id: reverseKey } } });
      await client.graphql({
        query: createDebt,
        variables: {
          input: {
            id: uuidv4(),
            tripId,
            debtor,
            creditor,
            currency,
            amount: -net,
          },
        },
      });
    } else {
      await client.graphql({ query: deleteDebt, variables: { input: { id: reverseKey } } });
    }
  } else if (forwardDebt) {
    const newAmount = forwardDebt.amount + amount;
    if (newAmount > 0) {
      await client.graphql({
        query: updateDebt,
        variables: { input: { id: key, amount: newAmount } },
      });
    } else {
      await client.graphql({ query: deleteDebt, variables: { input: { id: key } } });
    }
  } else {
    if (amount > 0) {
      await client.graphql({
        query: createDebt,
        variables: {
          input: {
            id: uuidv4(),
            tripId,
            debtor,
            creditor,
            currency,
            amount,
          },
        },
      });
    }
  }
};
