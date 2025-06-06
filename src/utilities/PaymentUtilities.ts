import { Payment, Currency } from '@/src/types/DataTypes';
import { increment } from 'firebase/firestore';

interface PaymentDeletionUpdates {
  [key: string]: any;
}

export const deletePayment = (payment: Payment, currentDebts: { [currency: string]: { [userPair: string]: number } }): PaymentDeletionUpdates => {
  const updates: PaymentDeletionUpdates = {};
  const { fromUserId, toUserId, amount, currency } = payment;

  // Get the current debt values in both directions
  const fromToKey = `${fromUserId}#${toUserId}`;
  const toFromKey = `${toUserId}#${fromUserId}`;
  
  const currentFromTo = currentDebts[currency]?.[fromToKey] || 0;
  const currentToFrom = currentDebts[currency]?.[toFromKey] || 0;

  // remaining or spillover or leftover
  const toFromAfterDeletion = currentToFrom - amount;

  if (toFromAfterDeletion >= 0) {
    // Simply add the amount back to toUserId#fromUserId
    updates[`debts.${currency}.${toFromKey}`] = increment(-amount);
  } else {
    // Clear toUserId#fromUserId and put the remainder in fromUserId#toUserId
    if (currentToFrom > 0) {
      updates[`debts.${currency}.${toFromKey}`] = 0;
    }
    updates[`debts.${currency}.${fromToKey}`] = increment(-toFromAfterDeletion);
  }

  // Update member balances
  updates[`members.${fromUserId}.amtLeft`] = increment(amount);
  updates[`members.${toUserId}.amtLeft`] = increment(-amount);

  return updates;
};
