// src/services/DynamoDBService.ts
// Centralized AWS SDK v3 access for your single-table DynamoDB design (no Amplify).

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  UserDDB,
  PremiumStatus,
  MemberDDB,
  ExpenseDDB,
  TripsTableDDB,
} from "@/src/types/DataTypes";

// ---------------- Config ----------------
const REGION =
  process.env.EXPO_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1";

const USERS_TABLE = process.env.EXPO_PUBLIC_USERS_TABLE || process.env.USERS_TABLE || "UsersTable";
const TRIPS_TABLE = process.env.EXPO_PUBLIC_TRIPS_TABLE || process.env.TRIPS_TABLE || "TripsTable";
const MEMBERS_TABLE = process.env.EXPO_PUBLIC_MEMBERS_TABLE || process.env.MEMBERS_TABLE || "MembersTable";
const EXPENSES_TABLE = process.env.EXPO_PUBLIC_EXPENSES_TABLE || process.env.EXPENSES_TABLE || "ExpensesTable";
const ACTIVITIES_TABLE = process.env.EXPO_PUBLIC_ACTIVITIES_TABLE || process.env.ACTIVITIES_TABLE || "ActivitiesTable";

const TRIPS_PK = 'PK';
const TRIPS_SK = 'SK';

// GSIs (make sure they match the definitions you created in the console)
const GSI1 = process.env.EXPO_PUBLIC_DDB_GSI1 || "GSI1"; // USER#{userId} -> TRIP#...#JOINED#ts (on Member items)
//const GSI2 = process.env.EXPO_PUBLIC_DDB_GSI2 || "GSI2"; // MEMBER#{memberId} -> TRIP#{tripId}#{ISO}#{expenseId} (on Share items)
//const GSI_TRIP_USER_EXP =
  //process.env.EXPO_PUBLIC_DDB_GSI3 || "GSI_TripUserExpenses"; // (optional) TRIP#<tripId>#USER#<userId> (on Expense items)

// ---------------- Client ----------------
const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_KEY!,
    },
  })
);

// ---------------- Helpers ----------------
function encodeToken(key: any | undefined): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key)).toString("base64");
}
function decodeToken(token?: string): any | undefined {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

// ============================================================================
// Users  (PK=USER#<userId>, SK=PROFILE)
// Optional Email→User GSI: EMAIL=EMAIL#<lowercased>, USERKEY=USER#<userId>
// ============================================================================

function mapUserItemToModel(item: any): UserDDB {
  return {
    id: item.userId,
    username: item.username,
    email: item.email ?? "",
    fullName: item.fullName ?? "",
    avatarUrl: item.avatarUrl,
    premiumStatus: (item.premiumStatus as PremiumStatus) ?? PremiumStatus.FREE,
    friends: item.friends ?? [],
    incomingFriendRequests: item.incomingFriendRequests ?? [],
    outgoingFriendRequests: item.outgoingFriendRequests ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
    trips: item.trips ?? [],
  };
}

function buildUserItem(input: {
  userId: string; // required
  username?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  premiumStatus?: PremiumStatus;
  friends?: string[];
  incomingFriendRequests?: string[];
  outgoingFriendRequests?: string[];
  trips?: string[];
  createdAt?: string;
  updatedAt?: string;
}) {
  const now = new Date().toISOString();
  const emailLower = input.email?.toLowerCase().trim();

  const item: any = {
    PK: `USER#${input.userId}`,
    SK: "PROFILE",
    type: "User",
    userId: input.userId,
    username: input.username ?? input.userId,
    email: emailLower ?? undefined,
    fullName: input.fullName ?? undefined,
    avatarUrl: input.avatarUrl ?? undefined,
    premiumStatus: input.premiumStatus ?? "free",
    friends: input.friends ?? [],
    incomingFriendRequests: input.incomingFriendRequests ?? [],
    outgoingFriendRequests: input.outgoingFriendRequests ?? [],
    trips: input.trips ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };

  // If you created an Email→User GSI, set these (sparse) attributes:
  if (emailLower) {
    item.EMAIL = `EMAIL#${emailLower}`; // GSI PK
    item.USERKEY = `USER#${input.userId}`; // GSI SK
  }

  return item;
}

/** Get full user profile by userId; null if not found */
export async function getUserById(userId: string): Promise<UserDDB | null> {
  const out = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      ConsistentRead: true,
    })
  );
  return out.Item ? mapUserItemToModel(out.Item) : null;
}

/** Fast existence check by userId */
export async function userExists(userId: string): Promise<boolean> {
  const out = await ddb.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      ConsistentRead: true,
    })
  );
  return !!out.Item;
}

/** Create a user if missing (atomic). Returns {created,user}. */
export async function createUserIfNotExists(input: {
  userId: string;
  username?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  premiumStatus?: PremiumStatus;
  friends?: string[];
  incomingFriendRequests?: string[];
  outgoingFriendRequests?: string[];
  trips?: string[];
}): Promise<{ created: boolean; user: UserDDB }> {
  const item = buildUserItem(input);

  try {
    await ddb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );
    return { created: true, user: mapUserItemToModel(item) };
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      const existing = await getUserById(input.userId);
      if (existing) return { created: false, user: existing };
    }
    throw err;
  }
}

// TODO
/** Update selected user fields by userId; returns the updated UserDDB */
export async function updateUserProfile(
  userId: string,
  patch: Partial<
    Pick<
      UserDDB,
      | "email"
      | "fullName"
      | "avatarUrl"
      | "premiumStatus"
      | "friends"
      | "incomingFriendRequests"
      | "outgoingFriendRequests"
    >
  >
): Promise<UserDDB> {
  const now = new Date().toISOString();

  const names: Record<string, string> = { "#updatedAt": "updatedAt" };
  const values: Record<string, any> = { ":now": now };
  const sets: string[] = ["#updatedAt = :now"];

  const addIf = (key: keyof typeof patch, attrName = key as string) => {
    const v = patch[key];
    if (v !== undefined) {
      const n = `#${attrName}`;
      const p = `:${attrName}`;
      names[n] = attrName;
      values[p] = v;
      sets.push(`${n} = ${p}`);
    }
  };

  addIf("email");
  addIf("fullName");
  addIf("avatarUrl");
  addIf("premiumStatus");
  addIf("friends");
  addIf("incomingFriendRequests");
  addIf("outgoingFriendRequests");

  const out = await ddb.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
      ReturnValues: "ALL_NEW",
    })
  );

  const it = out.Attributes!;
  return {
    id: it.userId,
    username: it.username,
    email: it.email ?? "",
    fullName: it.fullName ?? "",
    avatarUrl: it.avatarUrl,
    premiumStatus: (it.premiumStatus as PremiumStatus) ?? PremiumStatus.FREE,
    friends: it.friends ?? [],
    incomingFriendRequests: it.incomingFriendRequests ?? [],
    outgoingFriendRequests: it.outgoingFriendRequests ?? [],
    createdAt: it.createdAt,
    updatedAt: it.updatedAt,
    trips: it.trips ?? [],
  };
}

// Update a trip member's budget, amtLeft, currency, etc.
export async function ddbUpdateMember(
  tripId: string,
  userId: string,
  updates: Partial<MemberDDB>
): Promise<MemberDDB> {
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value], i) => {
    const attrName = `#attr${i}`;
    const attrValue = `:val${i}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  const result = await ddb.send(new UpdateCommand({
    TableName: MEMBERS_TABLE,
    Key: {
      PK: `TRIP#${tripId}`,
      SK: `MEMBER#${userId}`,
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  }));

  return result.Attributes as MemberDDB;
}

export async function getUserMemberships(
  userId: string,
  opts?: { limit?: number; nextToken?: string }
) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: MEMBERS_TABLE,
      IndexName: GSI1,
      KeyConditionExpression: "GSI1PK = :u AND begins_with(GSI1SK, :trip)",
      ExpressionAttributeValues: {
        ":u": `USER#${userId}`,
        ":trip": "TRIP#",
      },
      Limit: opts?.limit ?? 50,
      ExclusiveStartKey: decodeToken(opts?.nextToken),
    })
  );
  return {
    items: out.Items ?? [],
    nextToken: encodeToken(out.LastEvaluatedKey),
  };
}

export async function getTripById(
  tripId: string
): Promise<TripsTableDDB | null> {
  const out = await ddb.send(
    new GetCommand({
      TableName: TRIPS_TABLE,
      Key: { PK: `TRIP#${tripId}`, SK: "META" },
      ConsistentRead: true,
    })
  );
  const it = out.Item;
  if (!it) return null;

  const trip: TripsTableDDB = {
    tripId: it.id ?? tripId,
    destinationName: it.destination ?? "Trip",
    currency: it.currency ?? "USD",
    createdBy: it.createdBy,
    debts: it.debts ?? [],
    members: it.members ?? [],
    isTripPremium: !!it.isTripPremium,
    totalAmtLeft: it.totalAmtLeft ?? 0,
    totalBudget: it.totalBudget ?? 0,
    createdAt: it.createdAt,
    updatedAt: it.updatedAt ?? it.createdAt,
    startDate: it.startDate,
    endDate: it.endDate,
  };
  return trip;
}

export async function getMembersByTrip(
  tripId: string,
  opts?: { limit?: number; nextToken?: string }
): Promise<{ items: MemberDDB[]; nextToken?: string }> {
  const out = await ddb.send(
    new QueryCommand({
      TableName: MEMBERS_TABLE,
      KeyConditionExpression: "PK = :p AND begins_with(SK, :m)",
      ExpressionAttributeValues: { ":p": `TRIP#${tripId}`, ":m": "MEMBER#" },
      Limit: opts?.limit ?? 200,
      ExclusiveStartKey: decodeToken(opts?.nextToken),
    })
  );

  const items: MemberDDB[] = (out.Items ?? []).map((m: any) => ({
    userId: m.userId ?? m.id, // whichever you stored
    username: m.username,
    tripId,
    amtLeft: m.amtLeft ?? 0,
    budget: m.budget ?? 0,
    owesTotalMap: m.owesTotalMap ?? {},
    addMemberType: m.addMemberType,
    receiptsCount: m.receiptsCount ?? 0,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt ?? m.createdAt,
    currency: m.currency ?? "USD",
  }));

  return { items, nextToken: encodeToken(out.LastEvaluatedKey) };
}

export async function getExpensesByTrip(
  tripId: string,
  opts?: {
    limit?: number;
    nextToken?: string;
    sinceISO?: string; // if SK=EXPENSE#<ISO>#<id>
    scanNewToOld?: boolean; // default newest first
  }
): Promise<{ items: ExpenseDDB[]; nextToken?: string }> {
  const newestFirst = opts?.scanNewToOld !== false; // default true

  let q: any;
  if (opts?.sinceISO) {
    q = {
      KeyConditionExpression: "PK = :p AND SK BETWEEN :s AND :e",
      ExpressionAttributeValues: {
        ":p": `TRIP#${tripId}`,
        ":s": `EXPENSE#${opts.sinceISO}`,
        ":e": "EXPENSE#\uFFFF",
      },
    };
  } else {
    q = {
      KeyConditionExpression: "PK = :p AND begins_with(SK, :exp)",
      ExpressionAttributeValues: { ":p": `TRIP#${tripId}`, ":exp": "EXPENSE#" },
    };
  }

  const out = await ddb.send(
    new QueryCommand({
      TableName: EXPENSES_TABLE,
      ...q,
      Limit: opts?.limit ?? 50,
      ScanIndexForward: !newestFirst, // false => descending (newest-first)
      ExclusiveStartKey: decodeToken(opts?.nextToken),
    })
  );

  const items: ExpenseDDB[] = (out.Items ?? []).map((e: any) => ({
    expenseId: e.expenseId,
    tripId,
    activityName: e.activityName,
    amount: Number(e.amount ?? 0),
    currency: e.currency ?? "USD",
    paidBy: e.paidBy ?? "",
    sharedWith: e.sharedWith ?? [],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt ?? e.createdAt,
  }));

  return { items, nextToken: encodeToken(out.LastEvaluatedKey) };
}

export async function updateExpense(tripId: string, expenseId: string, updates: Record<string, any>) {
  try {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value], i) => {
    const attrName = `#attr${i}`;
    const attrValue = `:val${i}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });
  
  
  const command = new UpdateCommand({
    TableName: EXPENSES_TABLE,
    Key: {
      PK: `TRIP#${tripId}`,
      SK: `EXPENSE#${expenseId}`,
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  });
  
  
    const result = await ddb.send(command);
    return result.Attributes;
  } catch (error) {
  console.error("[DDB] updateExpense error:", error);
  throw error;
  }
}

export async function updateActivity(tripId: string, activityId: string, updates: Record<string, any>) {
  try {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value], i) => {
      const attrName = `#attr${i}`;
      const attrValue = `:val${i}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });


    const command = new UpdateCommand({
      TableName: ACTIVITIES_TABLE,
      Key: {
        PK: `TRIP#${tripId}`,
        SK: `ACTIVITY#${activityId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });


    const result = await ddb.send(command);
    return result.Attributes;
  } catch (error) {
    console.error("[DDB] updateActivity error:", error);
    throw error;
  }
}

// -----------------------------
// Add Expense to a Trip
// -----------------------------
export async function addExpenseToTrip(tripId: string, expenseId: string, data: Record<string, any>) {
  try {
    const item = {
      PK: `TRIP#${tripId}`,
      SK: `EXPENSE#${expenseId}`,
      tripId,
      expenseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };

    await ddb.send(new PutCommand({
      TableName: process.env.EXPO_PUBLIC_EXPENSES_TABLE!,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)", // avoid overwrites
    }));

    return item;
  } catch (error) {
    console.error("[DDB] addExpenseToTrip error:", error);
    throw error;
  }
}

// -----------------------------
// Add Activity to a Trip
// -----------------------------
export async function addActivityToTrip(tripId: string, activityId: string, data: Record<string, any>) {
  try {
    const item = {
      PK: `TRIP#${tripId}`,
      SK: `ACTIVITY#${activityId}`,
      tripId,
      activityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };

    await ddb.send(new PutCommand({
      TableName: process.env.EXPO_PUBLIC_ACTIVITIES_TABLE!,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    }));

    return item;
  } catch (error) {
    console.error("[DDB] addActivityToTrip error:", error);
    throw error;
  }
}


export type DynamoPagination = { nextToken?: string };
