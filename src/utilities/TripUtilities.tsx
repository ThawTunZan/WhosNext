// src/utilities/TripUtilities.ts
import { v4 as uuidv4 } from 'uuid';
import { generateClient } from 'aws-amplify/api';
import type * as APITypes from '@/src/API';

import {
  getUserByUsername,
  getTrip,
  getMembersByTrip,
  getExpensesByTrip,
  getExpense,
} from '@/src/graphql/queries';

import {
  createMember,
  updateMember,
  updateTrip,
  deleteMember,
  deleteExpense,
  deleteTrip,
  updateExpense,
} from '@/src/graphql/mutations';

import {
  MemberDDB,
  AddMemberType as LocalAddMemberType,
  TripsTableDDB,
} from '@/src/types/DataTypes';

import { convertCurrency } from '@/src/services/CurrencyService';

/* -------------------------------------------------------------------------- */
/*                               Amplify client                               */
/* -------------------------------------------------------------------------- */
const client = generateClient();
const GET_EXPENSES_BY_TRIP_WITH_SHARED = /* GraphQL */ `
  query GetExpensesByTripWithShared(
    $tripId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    getExpensesByTrip(
      tripId: $tripId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        tripId
        activityName
        amount
        currency
        paidBy
        sharedWith {
          payeeName
          amount
          currency
        }
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;

/* -------------------------------------------------------------------------- */
/*                               Helper utilities                             */
/* -------------------------------------------------------------------------- */

function toApiAddMemberType(t: LocalAddMemberType): APITypes.AddMemberType {
  // Your local enum uses string values: 'mock' | 'invite_link' | 'qr_code' | 'friends'
  // API enum (codegen) is typically the SAME string union type.
  // This cast is safe as long as the literals match.
  return t as unknown as APITypes.AddMemberType;
}

async function fetchTrip(tripId: string) {
  const resp = await client.graphql({
    query: getTrip,
    variables: { id: tripId },
  }) as { data?: APITypes.GetTripQuery };
  return resp.data?.getTrip ?? null;
}

async function fetchMembersByTrip(tripId: string) {
  const all: NonNullable<APITypes.GetMembersByTripQuery['getMembersByTrip']>['items'] = [];
  let nextToken: string | null | undefined = null;
  do {
    const page = await client.graphql({
      query: getMembersByTrip,
      variables: { tripId, limit: 200, nextToken },
    }) as { data?: APITypes.GetMembersByTripQuery };
    nextToken = page.data?.getMembersByTrip?.nextToken ?? null;
    const items = page.data?.getMembersByTrip?.items?.filter(Boolean) ?? [];
    all.push(...items);
  } while (nextToken);
  return all;
}

type SharedWithRow = { payeeName: string; amount: number; currency: string };
type ExpenseWithShared = {
  id: string;
  tripId: string;
  activityName: string;
  amount: number;
  currency: string;
  paidBy: string;
  sharedWith?: SharedWithRow[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GetExpensesByTripWithSharedQuery = {
  getExpensesByTrip?: {
    items?: (ExpenseWithShared | null)[];
    nextToken?: string | null;
  } | null;
};

async function fetchExpensesByTrip(tripId: string) {
  const all: ExpenseWithShared[] = [];
  let nextToken: string | null | undefined = null;

  do {
    const res = await client.graphql({
      query: GET_EXPENSES_BY_TRIP_WITH_SHARED,
      variables: { tripId, limit: 200, nextToken },
    }) as { data?: GetExpensesByTripWithSharedQuery };

    nextToken = res.data?.getExpensesByTrip?.nextToken ?? null;
    const items = (res.data?.getExpensesByTrip?.items ?? []).filter(Boolean) as ExpenseWithShared[];
    all.push(...items);
  } while (nextToken);

  return all;
}

function parseAwsJson<T = any>(v: unknown): T | null {
  if (!v) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return null; }
  }
  // Some codegens type AWSJSON as any (already object)
  return v as T;
}

/* -------------------------------------------------------------------------- */
/*                          Public: updatePersonalBudget                       */
/* -------------------------------------------------------------------------- */
/**
 * Update a member's personal budget and adjust their amtLeft by the same delta (in trip totals).
 * - Updates Member (budget, amtLeft, currency)
 * - Updates Trip (totalBudget, totalAmtLeft)
 */
export async function updatePersonalBudget(
  tripId: string,
  username: string,
  newBudget: number,
  newCurrency: string
): Promise<void> {
  if (!tripId || !username) {
    throw new Error('Trip ID and username are required.');
  }

  const trip = await fetchTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  const members = await fetchMembersByTrip(tripId);
  const member = members.find(m => m?.username === username);
  if (!member || !member.id) {
    throw new Error('User not a member of this trip.');
  }

  const oldBudget = member.budget ?? 0;
  const oldAmtLeft = member.amtLeft ?? 0;
  const spent = oldBudget - oldAmtLeft;

  // Convert budgets for totals (in trip currency)
  const newBudgetInTripCurrency = await convertCurrency(newBudget, newCurrency, trip.currency!);
  const oldBudgetInTripCurrency = await convertCurrency(oldBudget, member.currency!, trip.currency!);
  const diff = oldBudgetInTripCurrency - newBudgetInTripCurrency; // positive if old > new

  // New amtLeft in NEW currency (keep what was spent)
  const spentInNewCurrency = await convertCurrency(spent, member.currency!, newCurrency);
  const updatedAmtLeft = newBudget - spentInNewCurrency;

  // 1) Update the member
  const memberInput: APITypes.UpdateMemberInput = {
    id: member.id,
    budget: newBudget,
    amtLeft: updatedAmtLeft,
    currency: newCurrency,
  };
  await client.graphql({ query: updateMember, variables: { input: memberInput } });

  // 2) Update the trip totals
  const tripInput: APITypes.UpdateTripInput = {
    id: tripId,
    totalBudget: (trip.totalBudget ?? 0) - diff,
    totalAmtLeft: (trip.totalAmtLeft ?? 0) - diff,
  };
  await client.graphql({ query: updateTrip, variables: { input: tripInput } });
}

/* -------------------------------------------------------------------------- */
/*                          Public: addMemberToTrip                            */
/* -------------------------------------------------------------------------- */
/**
 * Adds a member to a trip (AppSync only):
 * - If REAL (not MOCK): verifies the user exists in Users table; throws if not found.
 * - Creates a Member row.
 * - Adjusts Trip totals.
 */
export const addMemberToTrip = async (
  tripId: string,
  memberName: string,
  tripData: TripsTableDDB,
  membersByUsername: Record<string, MemberDDB>,
  options: {
    budget?: number;
    addMemberType?: LocalAddMemberType;
    currency?: string;
    skipIfExists?: boolean;
    sendNotifications?: boolean; // optional; implement as you like
  } = {}
): Promise<void> => {
  if (!tripId || !memberName) {
    throw new Error('Trip ID and Member username are required.');
  }

  const {
    budget = 0,
    addMemberType = LocalAddMemberType.MOCK,
    currency = 'USD',
    skipIfExists = false,
  } = options;

  // Already in trip?
  if (membersByUsername?.[memberName]) {
    if (skipIfExists) return;
    throw new Error('Member already exists in this trip.');
  }

  // If REAL user, verify user exists
  if (addMemberType !== LocalAddMemberType.MOCK) {
    const userResp = await client.graphql({
      query: getUserByUsername,
      variables: { username: memberName, limit: 1 },
    }) as { data?: APITypes.GetUserByUsernameQuery };
    const userExists = (userResp.data?.getUserByUsername?.items ?? []).some(Boolean);
    if (!userExists) {
      throw new Error(`User "${memberName}" does not exist.`);
    }
  }

  // Create member
  const input: APITypes.CreateMemberInput = {
    id: uuidv4(),
    username: memberName,
    fullName: memberName, // If you resolve full name, do it before and place here
    tripId,
    budget,
    amtLeft: budget,
    currency,
    owesTotalMap: JSON.stringify({ USD: 0, EUR: 0, GBP: 0, JPY: 0, CNY: 0, SGD: 0 }) as any, // AWSJSON → string
    receiptsCount: 0,
    addMemberType: toApiAddMemberType(addMemberType),
  };

  await client.graphql({ query: createMember, variables: { input } });

  // Update trip totals in trip currency
  const budgetInTripCurrency = await convertCurrency(budget, currency, tripData.currency);
  const tripInput: APITypes.UpdateTripInput = {
    id: tripId,
    totalBudget: (tripData.totalBudget ?? 0) + budgetInTripCurrency,
    totalAmtLeft: (tripData.totalAmtLeft ?? 0) + budgetInTripCurrency,
  };
  await client.graphql({ query: updateTrip, variables: { input: tripInput } });

  // TODO: send notifications if desired (no Firestore)
};

/* -------------------------------------------------------------------------- */
/*                          Public: claimMockUser (DDB)                        */
/* -------------------------------------------------------------------------- */
/**
 * Minimal validation step: ensure a mock Member with `mockUsername` exists in this trip.
 * The actual rewrite (expenses + debts + delete mock) is handled by your TripHandler.updateFirebaseAfterClaiming().
 * We keep the signature compatible; `claimCode` is ignored here (not in schema).
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
  // No-op: TripHandler.updateFirebaseAfterClaiming() will do the heavy lifting.
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
  member: MemberDDB, // fields used: budget, amtLeft, currency
): Promise<void> => {
  if (!tripId || !username || !member) {
    throw new Error('Missing trip or user data.');
  }

  // Check debts from Trip.debts (AWSJSON)
  const trip = await fetchTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  const debtsObj = parseAwsJson<Record<string, Record<string, number>>>(trip.debts) || {};
  const hasDebts = Object.values(debtsObj).some(currencyDebts =>
    Object.keys(currencyDebts || {}).some(pair => pair.includes(username))
  );
  if (hasDebts) throw new Error('You still have outstanding debts.');

  // Check expenses involvement
  const expenses = await fetchExpensesByTrip(tripId);
  const involvedInExpenses = expenses.some(e =>
    e?.paidBy === username ||
    (Array.isArray(e?.sharedWith) && e!.sharedWith!.some(sw => sw?.payeeName === username))
  );
  if (involvedInExpenses) throw new Error('You are still involved in one or more expenses.');

  // TODO: proposed activities once modeled in your schema

  // If eligible, remove
  await removeMemberFromTrip(tripId, username, member);
};

/* -------------------------------------------------------------------------- */
/*                        Public: removeMemberFromTrip                         */
/* -------------------------------------------------------------------------- */
/**
 * Deletes the Member row and adjusts Trip totals (subtract member budget/amtLeft converted to trip currency).
 */
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

  const members = await fetchMembersByTrip(tripId);
  const target = members.find(m => m?.username === memberNameToRemove);
  if (!target || !target.id) throw new Error('Member not found.');

  // Convert to trip currency
  const convertedBudget = await convertCurrency(
    memberToRemoveData.budget ?? 0,
    memberToRemoveData.currency,
    trip.currency!
  );
  const convertedAmtLeft = await convertCurrency(
    memberToRemoveData.amtLeft ?? 0,
    memberToRemoveData.currency,
    trip.currency!
  );

  // 1) Delete Member
  const delInput: APITypes.DeleteMemberInput = { id: target.id };
  await client.graphql({ query: deleteMember, variables: { input: delInput } });

  // 2) Adjust Trip totals
  const tripInput: APITypes.UpdateTripInput = {
    id: tripId,
    totalBudget: Math.max(0, (trip.totalBudget ?? 0) - convertedBudget),
    totalAmtLeft: Math.max(0, (trip.totalAmtLeft ?? 0) - convertedAmtLeft),
  };
  await client.graphql({ query: updateTrip, variables: { input: tripInput } });

  // Optional: notifications – implement if desired (no Firestore)
};

/* -------------------------------------------------------------------------- */
/*                       Public: deleteTripAndRelatedData                      */
/* -------------------------------------------------------------------------- */
/**
 * Deletes: all Expenses, all Members, then the Trip.
 * (Receipts/other collections are not in your GraphQL schema; add if/when modeled.)
 */
export const deleteTripAndRelatedData = async (tripId: string): Promise<void> => {
  if (!tripId) throw new Error('Trip ID is required.');

  // 1) Delete expenses
  const expenses = await fetchExpensesByTrip(tripId);
  for (const e of expenses) {
    if (!e?.id) continue;
    const del: APITypes.DeleteExpenseInput = { id: e.id };
    await client.graphql({ query: deleteExpense, variables: { input: del } });
  }

  // 2) Delete members
  const members = await fetchMembersByTrip(tripId);
  for (const m of members) {
    if (!m?.id) continue;
    const del: APITypes.DeleteMemberInput = { id: m.id };
    await client.graphql({ query: deleteMember, variables: { input: del } });
  }

  // 3) Delete the trip
  const delTrip: APITypes.DeleteTripInput = { id: tripId };
  await client.graphql({ query: deleteTrip, variables: { input: delTrip } });
};

/* -------------------------------------------------------------------------- */
/*                    Extra: helper to rewrite expenses (optional)            */
/* -------------------------------------------------------------------------- */
/**
 * Utility you can call if you need to rewrite all expenses for a user rename (used by claims).
 * Not used directly above because you already implemented this in TripHandler.
 */
export async function rewriteAllExpensesForUser(
  tripId: string,
  fromUsername: string,
  toUsername: string
): Promise<void> {
  const bases = await fetchExpensesByTrip(tripId);
  for (const base of bases) {
    if (!base?.id) continue;
    const full = await client.graphql({
      query: getExpense,
      variables: { id: base.id },
    }) as { data?: APITypes.GetExpenseQuery };
    const e = full.data?.getExpense;
    if (!e) continue;

    let changed = false;
    const input: APITypes.UpdateExpenseInput = { id: e.id! };

    if (e.paidBy === fromUsername) {
      input.paidBy = toUsername;
      changed = true;
    }

    if (Array.isArray(e.sharedWith)) {
      const newShared = e.sharedWith.map(sw =>
        sw?.payeeName === fromUsername ? { ...sw, payeeName: toUsername } : sw
      );
      if (JSON.stringify(newShared) !== JSON.stringify(e.sharedWith)) {
        input.sharedWith = newShared as any; // SharedWithInput[]
        changed = true;
      }
    }

    if (changed) {
      await client.graphql({ query: updateExpense, variables: { input } });
    }
  }
}
