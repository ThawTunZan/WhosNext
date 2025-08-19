// DynamoDBService.ts
// Centralized, SDK v3-based queries for your single-table design.
// No React/Amplify imports here.

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

// ---- Config ----
const REGION = process.env.EXPO_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.EXPO_PUBLIC_DDB_TABLE || process.env.DDB_TABLE || "AppTable";
const GSI1 = process.env.EXPO_PUBLIC_DDB_GSI1 || "GSI1"; // USER#{userId} -> TRIP#...#JOINED#ts
const GSI2 = process.env.EXPO_PUBLIC_DDB_GSI2 || "GSI2"; // MEMBER#{memberId} -> TRIP#...#ts#expenseId

// ---- Client ----
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// ---- Helpers for pagination tokens ----
function encodeToken(key: any | undefined): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key)).toString("base64");
}
function decodeToken(token?: string): any | undefined {
  if (!token) return undefined;
  try { return JSON.parse(Buffer.from(token, "base64").toString("utf8")); }
  catch { return undefined; }
}

// ====== Public API (used by your Context) ======

/**
 * Memberships for a user (which trips they are in)
 * Schema: membership items live at PK=TRIP#{tripId}, SK=MEMBER#{userId}
 * and are duplicated into GSI1: GSI1PK=USER#{userId}, GSI1SK=TRIP#{tripId}#JOINED#{ts}
 */
export async function getUserMemberships(userId: string, opts?: { limit?: number; nextToken?: string }) {
  const out = await ddb.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1,
    KeyConditionExpression: "GSI1PK = :u AND begins_with(GSI1SK, :trip)",
    ExpressionAttributeValues: {
      ":u": `USER#${userId}`,
      ":trip": "TRIP#"
    },
    Limit: opts?.limit ?? 50,
    ExclusiveStartKey: decodeToken(opts?.nextToken),
  }));
  return {
    items: out.Items ?? [],
    nextToken: encodeToken(out.LastEvaluatedKey),
  };
}

/**
 * Trip META document
 */
export async function getTripById(tripId: string) {
  const out = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `TRIP#${tripId}`, SK: "META" },
  }));
  return out.Item || null;
}

/**
 * Members of a trip
 */
export async function getMembersByTrip(tripId: string, opts?: { limit?: number; nextToken?: string }) {
  const out = await ddb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :p AND begins_with(SK, :m)",
    ExpressionAttributeValues: { ":p": `TRIP#${tripId}`, ":m": "MEMBER#" },
    Limit: opts?.limit ?? 200,
    ExclusiveStartKey: decodeToken(opts?.nextToken),
  }));
  return {
    items: out.Items ?? [],
    nextToken: encodeToken(out.LastEvaluatedKey),
  };
}

/**
 * Expenses of a trip (paged, newest-first optional)
 * If sinceISO is provided, we range on SK BETWEEN `EXPENSE#${sinceISO}` and 'EXPENSE#\uFFFF'
 */
export async function getExpensesByTrip(
  tripId: string,
  opts?: {
    limit?: number;
    nextToken?: string;
    sinceISO?: string;           // for realtime refetch
    scanNewToOld?: boolean;      // default: newest first (true)
  }
) {
  const since = opts?.sinceISO;
  const useBetween = !!since;

  const q = useBetween
    ? {
        KeyConditionExpression: "PK = :p AND SK BETWEEN :s AND :e",
        ExpressionAttributeValues: {
          ":p": `TRIP#${tripId}`,
          ":s": `EXPENSE#${since}`,
          ":e": "EXPENSE#\uFFFF",
        },
      }
    : {
        KeyConditionExpression: "PK = :p AND begins_with(SK, :exp)",
        ExpressionAttributeValues: {
          ":p": `TRIP#${tripId}`,
          ":exp": "EXPENSE#",
        },
      };

  const out = await ddb.send(new QueryCommand({
    TableName: TABLE_NAME,
    ...q,
    Limit: opts?.limit ?? 50,
    ScanIndexForward: opts?.scanNewToOld === false ? true : false, // default newest-first
    ExclusiveStartKey: decodeToken(opts?.nextToken),
  }));

  return {
    items: out.Items ?? [],
    nextToken: encodeToken(out.LastEvaluatedKey),
  };
}

export type DynamoPagination = { nextToken?: string };
