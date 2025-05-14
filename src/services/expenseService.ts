import firestore from '@react-native-firebase/firestore';
import { Expense, MembersMap } from '../types/DataTypes';
import { MemberInfo } from './SettleUpUtilities';

const TRIPS_COLLECTION = 'trips';
const EXPENSES_SUBCOLLECTION = 'expenses';

interface DetailedMember extends MemberInfo {
  budget: number;
  amtLeft: number;
  owesTotal?: number;
}

type DetailedMembersMap = Record<string, DetailedMember>;
interface NextPayerResult { id: string | null; name: string | null; }

export const subscribeToExpenses = (
  tripId: string,
  callback: (expenses: Expense[]) => void
): (() => void) => {
  return firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(EXPENSES_SUBCOLLECTION)
    .onSnapshot(snapshot => {
      const expenses: Expense[] = snapshot.docs.map(doc => ({
        id: doc.id,
        activityName: doc.data().activityName,
        paidBy: doc.data().paidBy,
        paidAmt: doc.data().paidAmt,
        sharedWith: doc.data().sharedWith,
        createdAt: doc.data().createdAt?.toDate?.().toLocaleDateString?.() || 'N/A',
      }));
      callback(expenses);
    }, err => {
      console.error("Error fetching expenses:", err);
      callback([]);
    });
};

export const updateExpenseAndRecalculateDebts = async (
  tripId: string,
  expenseId: string | null,
  updatedExpenseData: Expense,
  members: MembersMap,
): Promise<void> => {
  if (!tripId || !expenseId) {
    throw new Error("Trip ID and Expense ID are required for update.");
  }

  const tripDocRef = firestore().collection('trips').doc(tripId);
  const expenseDocRef = tripDocRef.collection('expenses').doc(expenseId);
  const batch = firestore().batch();

  try {
    const originalExpenseSnap = await expenseDocRef.get();
    if (!originalExpenseSnap.exists) {
      throw new Error(`Original expense with ID ${expenseId} not found.`);
    }

    const originalExpense = originalExpenseSnap.data() as Expense;

    const reversalRaw = generateExpenseImpactUpdate({}, originalExpense, members, true);
    reversalRaw['totalAmtLeft'] = originalExpense.paidAmt;
    const applyRaw = generateExpenseImpactUpdate({}, updatedExpenseData, members, false);
    applyRaw['totalAmtLeft'] = -updatedExpenseData.paidAmt;

    const combinedUpdates = mergeIncrements(reversalRaw, applyRaw);

    const expenseUpdatePayload = {
      ...updatedExpenseData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    batch.update(tripDocRef, combinedUpdates);
    batch.update(expenseDocRef, expenseUpdatePayload);

    await batch.commit();
  } catch (error) {
    console.error(`Error updating expense ${expenseId}: `, error);
    throw error;
  }
};

export const addExpenseAndCalculateDebts = async (
  tripId: string,
  expenseData: Expense,
  members: MembersMap
): Promise<void> => {
  const paidByID = Object.keys(members).find(id => members[id].name === expenseData.paidBy);
  if (!paidByID) throw new Error(`Payer ${expenseData.paidBy} not found.`);

  const batch = firestore().batch();
  const expenseRef = firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(EXPENSES_SUBCOLLECTION)
    .doc();

  const tripRef = firestore().collection(TRIPS_COLLECTION).doc(tripId);
  const updates = generateExpenseImpactUpdate({}, expenseData, members, false);
  updates['totalAmtLeft'] = -expenseData.paidAmt;

  batch.set(expenseRef, {
    ...expenseData,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  for (const key in updates) {
    batch.update(tripRef, { [key]: firestore.FieldValue.increment(updates[key]) });
  }

  await batch.commit();
};

export const reverseExpensesAndUpdate = async (
  tripId: string,
  expenseId: string,
  members: MembersMap,
  reverse: boolean
): Promise<void> => {
  const expenseRef = firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(EXPENSES_SUBCOLLECTION)
    .doc(expenseId);
  const tripRef = firestore().collection(TRIPS_COLLECTION).doc(tripId);

  const snap = await expenseRef.get();
  if (!snap.exists) throw new Error("Expense does not exist.");

  const updates = generateExpenseImpactUpdate({}, snap.data() as Expense, members, reverse);

  const batch = firestore().batch();
  for (const key in updates) {
    batch.update(tripRef, { [key]: firestore.FieldValue.increment(updates[key]) });
  }
  batch.delete(expenseRef);
  await batch.commit();
};

export function calculateNextPayer(members: DetailedMembersMap | null | undefined): NextPayerResult {
  if (!members || Object.keys(members).length === 0) {
    return { id: null, name: 'No members in trip' };
  }
  let nextPayerId: string | null = null;
  let maxAmountOwe = -Infinity;
  Object.entries(members).forEach(([id, member]) => {
    const owes = member.owesTotal || 0;
    if (owes > maxAmountOwe) {
      maxAmountOwe = owes;
      nextPayerId = id;
    }
  });
  return nextPayerId && members[nextPayerId]
    ? { id: nextPayerId, name: members[nextPayerId].name }
    : { id: null, name: 'Calculation error' };
}

export const deleteExpense = async (tripId: string, expenseId: string, members: any): Promise<void> => {
  const expenseDocRef = firestore().collection('trips').doc(tripId).collection('expenses').doc(expenseId);
  const tripDocRef = firestore().collection('trips').doc(tripId);

  try {
    const expenseSnap = await expenseDocRef.get();
    if (!expenseSnap.exists) {
      console.warn(`Expense document with ID ${expenseId} not found. Cannot reverse debts.`);
      return;
    }

    const expense = expenseSnap.data();

    const rawUpdates = generateExpenseImpactUpdate({}, expense, members, true, expenseId);
    const firebaseUpdates = formatToFirebase(rawUpdates);

    const batch = firestore().batch();
    batch.update(tripDocRef, firebaseUpdates);
    batch.delete(expenseDocRef);

    await batch.commit();
    console.log(`Expense ${expenseId} deleted and reversed.`);
  } catch (error) {
    console.error(`Failed to delete expense:`, error);
    throw error;
  }
};

export const generateExpenseImpactUpdate = (
  updates: { [key: string]: number },
  expenseData: any,
  members: any,
  reverse: boolean,
  expenseId?: string
): { [key: string]: number } => {
  const { sharedWith, paidBy } = expenseData;
  const paidByID = Object.keys(members).find(id => members[id].name === paidBy);

  if (!paidByID) throw new Error(`Payer "${paidBy}" not found in members for expense ${expenseId}`);

  const multiplier = reverse ? 1 : -1;

  for (const member of sharedWith) {
    const share = Number(member.amount) * multiplier;
    const payeeID = member.payeeID;

    if (payeeID !== paidByID) {
      updates[`members.${payeeID}.amtLeft`] = (updates[`members.${payeeID}.amtLeft`] || 0) + share;
      updates[`members.${payeeID}.owesTotal`] = (updates[`members.${payeeID}.owesTotal`] || 0) - share;
      updates[`debts.${payeeID}#${paidByID}`] = (updates[`debts.${payeeID}#${paidByID}`] || 0) - share;
    } else {
      updates[`members.${payeeID}.amtLeft`] = (updates[`members.${payeeID}.amtLeft`] || 0) + share;
    }
  }

  return updates;
};

//
//-------------------- Helper Functions --------------------------------
function mergeIncrements(
  a: { [key: string]: number },
  b: { [key: string]: number }
): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    const total = aVal + bVal;

    if (total !== 0) {
      result[key] = firestore.FieldValue.increment(total);
    }
  }

  return result;
}

function formatToFirebase(updates: { [key: string]: number }) {
  const newUpdates: { [key: string]: any } = {};
  for (const key in updates) {
    newUpdates[key] = firestore.FieldValue.increment(updates[key]);
  }
  return newUpdates;
}

//----------------------------------------------------------------------