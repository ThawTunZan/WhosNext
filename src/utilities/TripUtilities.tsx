// src/utilities/TripUtilities.ts
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  MemberDDB,
  AddMemberType as LocalAddMemberType,
  TripsTableDDB,
  ExpenseDDB,
} from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';

import {
  // reads
  getTripById,
  getMembersByTrip,
  getExpensesByTrip,
  addExpenseToTrip as ddbAddExpenseToTrip,
  addActivityToTrip as ddbAddActivityToTrip,
  updateExpense as ddbUpdateExpense,
  updateActivity as ddbUpdateActivity,
  ddbUpdateMember,     
} from '@/src/aws-services/DynamoDBService';
import { addMemberToFirebase } from '@/src/firebase/FirebaseMemberService';
import { updateTripMetaData } from '@/src/firebase/FirebaseTripService';

async function fetchTrip(tripId: string) {
  return await getTripById(tripId);
}

async function fetchMembersByTrip(tripId: string) {
  const res = await getMembersByTrip(tripId, { limit: 200 });
  return res.items ?? [];
}

async function fetchExpensesByTrip(tripId: string) {
  // pull all (paged) – caller can optimize with sinceISO if needed
  const all: ExpenseDDB[] = [];
  let next: string | undefined = undefined;

  do {
    const page = await getExpensesByTrip(tripId, { limit: 200, nextToken: next });
    all.push(...(page.items ?? []));
    next = page.nextToken;
  } while (next);

  return all;
}
/* -------------------------------------------------------------------------- */
/*                          Public: updatePersonalBudget                       */
/* -------------------------------------------------------------------------- */
/**
 * Update a member's personal budget and adjust their amtLeft by the same delta (in trip totals).
 * - Updates Member (budget, amtLeft, currency)
 * - Updates Trip (totalBudget, totalAmtLeft)
 *
 */
export async function updatePersonalBudget(
  tripId: string,
  userId: string,
  newBudget: number,
  newCurrency: string
): Promise<void> {
  if (!tripId || !userId) {
    throw new Error('Trip ID and user ID are required.');
  }

  const trip = await fetchTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  const members = await fetchMembersByTrip(tripId);
  const member = members.find(m => m?.userId === userId);
  if (!member) throw new Error('User not a member of this trip.');

  const oldBudget = member.budget ?? 0;
  const oldAmtLeft = member.amtLeft ?? 0;
  const spent = oldBudget - oldAmtLeft;

  // Convert budgets for totals (into trip currency)
  const newBudgetInTripCurrency = await convertCurrency(newBudget, newCurrency, trip.currency);
  const oldBudgetInTripCurrency = await convertCurrency(oldBudget, member.currency, trip.currency);
  const diff = oldBudgetInTripCurrency - newBudgetInTripCurrency; // positive if old > new

  // Keep the "spent" constant across currency change
  const spentInNewCurrency = await convertCurrency(spent, member.currency, newCurrency);
  const updatedAmtLeft = newBudget - spentInNewCurrency;

  // 1) Update member table
  await ddbUpdateMember(tripId, userId, {
    budget: newBudget,
    amtLeft: updatedAmtLeft,
    currency: newCurrency,
    updatedAt: new Date().toISOString(),
  });

  await updateTripMetaData(tripId, {
    totalBudget: Math.max(0, (trip.totalBudget ?? 0) - diff),
    totalAmtLeft: Math.max(0, (trip.totalAmtLeft ?? 0) - diff),
    updatedAt: new Date().toISOString(),
  });
}

/* -------------------------------------------------------------------------- */
/*                          Public: addMemberToTrip                            */
/* -------------------------------------------------------------------------- */
/**
 * Adds a member to a trip (DynamoDB):
 * - If REAL (not MOCK): up to you to verify user existence before calling this.
 * - Creates a Member row.
 * - Adjusts Trip totals in trip currency.
 */
export const addMemberToTrip = async (
  tripData: TripsTableDDB,
  memberData: MemberDDB,
  options?: {
    skipIfExists?: boolean;
  }
): Promise<void> => {
  if (!tripData?.tripId || !memberData?.userId) {
    throw new Error("Trip ID and Member userId are required.");
  }

  // 1) Check if member already exists in DynamoDB
  const existingMembers = tripData.members;
  const alreadyExists = existingMembers?.some(
    (m) => m === memberData.userId
  );

  if (alreadyExists) {
    if (options?.skipIfExists) return; // silently ignore
    throw new Error("Member already exists in this trip.");
  }

  // 2) Add new member
  await addMemberToFirebase(tripData, memberData);

  // 3) Adjust trip totals (convert member budget to trip currency)
  const budgetInTripCurrency = await convertCurrency(
    memberData.budget,
    memberData.currency,
    tripData.currency
  );

  await updateTripMetaData(tripData.tripId, {
    totalBudget: (tripData.totalBudget ?? 0) + budgetInTripCurrency,
    totalAmtLeft: (tripData.totalAmtLeft ?? 0) + budgetInTripCurrency,
    members: (tripData.members ?? []).concat([memberData.userId]),
    updatedAt: new Date().toISOString(),
  });
};

/* -------------------------------------------------------------------------- */
/*                          Public: claimMockUser (DDB)                        */
/* -------------------------------------------------------------------------- */
/**
 * Minimal validation step: ensure a mock Member with `mockUsername` exists in this trip.
 * The actual rewrite (expenses + debts + delete mock) is handled by your caller (TripHandler).
 * `claimCode` is ignored here because it isn’t part of the DDB schema.
 */
export const claimMockUser = async (
  tripId: string,
  mockUsername: string,
  _claimCode: string,
  _newUsername: string
): Promise<void> => {
  const members = await fetchMembersByTrip(tripId);
  const mock = members.find(m => m?.username === mockUsername);
  if (!mock) throw new Error('Mock user not found in this trip.');
  if (mock.addMemberType !== 'mock') {
    throw new Error('This member is not marked as a mock user.');
  }
};

/* -------------------------------------------------------------------------- */
/*                         Public: leaveTripIfEligible                         */
/* -------------------------------------------------------------------------- */
/**
 * Blocks leaving if user has debts (Trip.debts) or is involved in expenses.
 * If clear, removes the Member and updates trip totals.
 */
export const leaveTripIfEligible = async (
  tripId: string,
  username: string,
  member: MemberDDB, // uses: budget, amtLeft, currency, id(userId)
): Promise<void> => {
  if (!tripId || !username || !member) {
    throw new Error('Missing trip or user data.');
  }

  const trip = await fetchTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  // 1) Debts check
  const hasDebts = (trip.debts ?? []).some((d) => {
    const [creditor, debtor] = d.split("#");
    return creditor === username || debtor === username;
  });

  if (hasDebts) throw new Error('You still have outstanding debts.');

  // 2) Expense involvement check
  const expenses = await fetchExpensesByTrip(tripId);
  const involvedInExpenses = expenses.some(e =>
    e?.paidBy === username ||
    (Array.isArray(e?.sharedWith) && e.sharedWith!.some(sw => sw?.payeeName === username))
  );
  if (involvedInExpenses) throw new Error('You are still involved in one or more expenses.');

  // 3) Remove member + adjust totals
  // Convert member values to trip currency before subtracting
  const convertedBudget = await convertCurrency(member.budget ?? 0, member.currency, trip.currency);
  const convertedAmtLeft = await convertCurrency(member.amtLeft ?? 0, member.currency, trip.currency);

  // Delete the member row
  //await ddbDeleteMember(tripId, member.id);

  // Update trip totals
  await updateTripMetaData(tripId, {
    totalBudget: Math.max(0, (trip.totalBudget ?? 0) - convertedBudget),
    totalAmtLeft: Math.max(0, (trip.totalAmtLeft ?? 0) - convertedAmtLeft),
    updatedAt: new Date().toISOString(),
  });
};

/* -------------------------------------------------------------------------- */
/*                        Public: removeMemberFromTrip                         */
/* -------------------------------------------------------------------------- */
export const removeMemberFromTrip = async (
  tripId: string,
  memberNameToRemove: string,
  memberToRemoveData: MemberDDB
): Promise<void> => {
  if (!tripId || !memberNameToRemove) {
    throw new Error('Trip ID and Member username are required.');
  }

  const trip = await fetchTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  // delete by userId (memberToRemoveData.id)
  //await ddbDeleteMember(tripId, memberToRemoveData.id);

  // Convert to trip currency and adjust totals
  const convertedBudget = await convertCurrency(memberToRemoveData.budget ?? 0, memberToRemoveData.currency, trip.currency);
  const convertedAmtLeft = await convertCurrency(memberToRemoveData.amtLeft ?? 0, memberToRemoveData.currency, trip.currency);

  await updateTripMetaData(tripId, {
    totalBudget: Math.max(0, (trip.totalBudget ?? 0) - convertedBudget),
    totalAmtLeft: Math.max(0, (trip.totalAmtLeft ?? 0) - convertedAmtLeft),
    updatedAt: new Date().toISOString(),
  });
};

/* -------------------------------------------------------------------------- */
/*                       Public: deleteTripAndRelatedData                      */
/* -------------------------------------------------------------------------- */
/**
 * Deletes all Expenses, all Members, then the Trip META.
 */
/*
export const deleteTripAndRelatedData = async (tripId: string): Promise<void> => {
  if (!tripId) throw new Error('Trip ID is required.');

  // 1) Delete expenses
  const expenses = await fetchExpensesByTrip(tripId);
  for (const e of expenses) {
    if (!e?.id) continue;
    await ddbDeleteExpense(tripId, e.id);
  }

  // 2) Delete members
  const members = await fetchMembersByTrip(tripId);
  for (const m of members) {
    await ddbDeleteMember(tripId, m.id);
  }

  // 3) Delete the trip META
  await ddbDeleteTrip(tripId);
};
*/

/* -------------------------------------------------------------------------- */
/*                Public: add expense / activity convenience wrappers         */
/* -------------------------------------------------------------------------- */
export async function addExpense(
  tripId: string,
  data: Omit<ExpenseDDB, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>
) {
  const expenseId = uuidv4();
  const now = new Date().toISOString();

  return await ddbAddExpenseToTrip(tripId, expenseId, {
    ...data,
    expenseId,
    tripId,
    createdAt: now,
    updatedAt: now,
  });
}

export async function addActivity(
  tripId: string,
  data: Record<string, any> // define your ActivityDDB type when you finalize schema
) {
  const activityId = uuidv4();
  const now = new Date().toISOString();

  return await ddbAddActivityToTrip(tripId, activityId, {
    ...data,
    activityId,
    tripId,
    createdAt: now,
    updatedAt: now,
  });
}

/* -------------------------------------------------------------------------- */
/*              Public: update expense / trip meta / activity wrappers        */
/* -------------------------------------------------------------------------- */
export async function updateExpense(
  tripId: string,
  expenseId: string,
  patch: Partial<ExpenseDDB>
) {
  return await ddbUpdateExpense(tripId, expenseId, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateActivity(
  tripId: string,
  activityId: string,
  patch: Record<string, any>
) {
  return await ddbUpdateActivity(tripId, activityId, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}
