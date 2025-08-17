// src/context/UserTripsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  PropsWithChildren,
} from "react";
import { useUser } from "@clerk/clerk-expo";
import { generateClient } from "aws-amplify/api";
import { listMembers, getTrip, getExpensesByTrip } from "@/src/graphql/queries";
import { syncUserProfileToDynamoDB } from "@/src/services/syncUserProfile";
import {MemberDDB, ExpenseDDB, TripsTableDDB} from "@/src/types/DataTypes"

// --- Minimal shapes (adjust to your app types if you have them) ---

type MembersByTrip = Record<string, Record<string, MemberDDB>>; // tripId -> (memberId -> Member)
type ExpensesByTrip = Record<string, ExpenseDDB[]>;

type UserTripsCtx = {
  user: any;
  trips: TripsTableDDB[];                 
  tripMembersMap: MembersByTrip;
  expensesByTripId: ExpensesByTrip;
  loading: boolean;
  error: any;
  fetchTrips: () => void;
};

const defaultUserTripsCtx: UserTripsCtx = {
  user: null,
  trips: [],
  tripMembersMap: {},
  expensesByTripId: {},
  loading: true,
  error: null,
  fetchTrips: () => {},
};

const UserTripsContext = createContext<UserTripsCtx>(defaultUserTripsCtx);

// Remove AppSync/AWS metadata from nested objects/arrays
const cleanGraphQLData = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(cleanGraphQLData);
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        key === "__typename" ||
        key === "nextToken" ||
        key === "_version" ||
        key === "_deleted" ||
        key === "_lastChangedAt"
      ) {
        continue;
      }
      cleaned[key] = cleanGraphQLData(value);
    }
    return cleaned;
  }
  return obj;
};

const normalizeExpense = (e: any): ExpenseDDB => ({
  id: e.id,
  tripId: e.tripId,
  activityName: e.activityName,
  amount: Number(e.amount ?? 0),
  currency: e.currency ?? "USD",
  paidBy: e.paidBy ?? "",
  sharedWith: Array.isArray(e.sharedWith) ? e.sharedWith : [],
  createdAt: e.createdAt ?? new Date().toISOString(),
  updatedAt: e.updatedAt ?? e.createdAt ?? new Date().toISOString(),
});

const normalizeMember = (m: any): MemberDDB => ({
  id: m.id,
  username: m.username,
  fullName: m.fullName,
  tripId: m.tripId,
  amtLeft: m.amtLeft ?? 0,
  budget: m.budget ?? 0,
  owesTotalMap: m.owesTotalMap ?? {},
  addMemberType: m.addMemberType,
  receiptsCount: m.receiptsCount ?? 0,
  createdAt: m.createdAt ?? new Date().toISOString(),
  updatedAt: m.updatedAt ?? m.createdAt ?? new Date().toISOString(),
  currency: m.currency ?? "USD",
});

export const UserTripsProvider = ({ children }: PropsWithChildren) => {
  const { isLoaded, isSignedIn, user } = useUser();

  const [userData, setUserData] = useState<any>(null);
  const [trips, setTrips] = useState<TripsTableDDB[]>([]);
  const [tripMembersMap, setTripMembersMap] = useState<MembersByTrip>({});
  const [expensesByTripId, setExpensesByTripId] = useState<ExpensesByTrip>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const client = useMemo(() => generateClient(), []);

  const fetchTrips = useCallback(async () => {
    if (!user?.username) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Which trips is this user a member of?
      const membersResponse = await client.graphql({
        query: listMembers,
        variables: { filter: { username: { eq: user.username } } },
      });

      const userMemberships =
        cleanGraphQLData(membersResponse?.data?.listMembers?.items) || [];
      const tripIds: string[] = userMemberships.map((m: any) => m.tripId);

      if (tripIds.length === 0) {
        setTrips([]);
        setTripMembersMap({});
        setExpensesByTripId({});
        setUserData({
          username: user.username,
          trips: [],
          friends: [],
          incomingFriendRequests: [],
          outgoingFriendRequests: [],
          premiumStatus: "free",
        });
        setLoading(false);
        return;
      }

      // 2) Fetch all trip docs, members, and expenses in parallel
      const [tripResponses, membersEntries, expensesEntries] = await Promise.all([
        // Trip docs
        Promise.all(
          tripIds.map((tripId) =>
            client.graphql({ query: getTrip, variables: { id: tripId } })
          )
        ),

        // Members per trip -> KEYED BY MEMBER.ID
        Promise.all(
          tripIds.map(async (tripId) => {
            const resp = await client.graphql({
              query: listMembers,
              variables: { filter: { tripId: { eq: tripId } } },
            });
            const rawItems = cleanGraphQLData(resp?.data?.listMembers?.items) || [];
            const items: MemberDDB[] = rawItems.map(normalizeMember);
            const dict = items.reduce((acc, m) => {
              if (m?.id) acc[m.id] = m;
              return acc;
            }, {} as Record<string, MemberDDB>);
            return [tripId, dict] as const;
          })
        ),


        // Expenses per trip
        Promise.all(
          tripIds.map(async (tripId) => {
            const resp = await client.graphql({
              query: getExpensesByTrip,
              variables: { tripId, limit: 1000 },
            });
            const rawItems =
              cleanGraphQLData(resp?.data?.getExpensesByTrip?.items) || [];
            const items: ExpenseDDB[] = rawItems.map(normalizeExpense);
            return [tripId, items] as const;
          })
        ),
      ]);

      const allTrips =
        tripResponses
          .map((res) => cleanGraphQLData(res?.data?.getTrip))
          .filter(Boolean) || [] as TripsTableDDB[];

      const membersByTripId = Object.fromEntries(membersEntries) as MembersByTrip;
      const expensesByTrip = Object.fromEntries(expensesEntries) as ExpensesByTrip;

      // 3) Commit state (single atomic update is smoother)
      setTripMembersMap(membersByTripId);
      setExpensesByTripId(expensesByTrip);
      setTrips(allTrips);
      setUserData({
        username: user.username,
        trips: allTrips.map((t: any) => t.id),
        friends: [],
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
        premiumStatus: "free",
      });
    } catch (err) {
      console.error("[UserTripsContext] Error fetching trips:", err);
      setError(err);
      setTrips([]);
      setTripMembersMap({});
      setExpensesByTripId({});
      setUserData({
        username: user?.username ?? "",
        trips: [],
        friends: [],
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
        premiumStatus: "free",
      });
    } finally {
      setLoading(false);
    }
  }, [client, user?.username]);

  useEffect(() => {
    console.log(
      "[UserTripsContext] useEffect triggered. Setting up AWS GraphQL queries."
    );

    setLoading(true);
    setError(null);
    setUserData(null);
    setTrips([]);

    if (!isLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    // Best-effort sync to your User table
    try {
      const userFromClerk = {
        id: user.username,
        username:
          user.username ||
          user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          "user",
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
        profileImageUrl: user.imageUrl || "",
        friends: [],
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
        trips: [],
        premiumStatus: userData?.premiumStatus || "free",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currency: userData?.currency || "USD",
      };
      syncUserProfileToDynamoDB(userFromClerk).catch(console.error);
    } catch (err) {
      console.error("Error syncing user profile to DB:", err);
    }

    fetchTrips();

    return () => {
      console.log("[UserTripsContext] useEffect cleanup. Cleaning up AWS client.");
    };
  }, [isLoaded, isSignedIn, user?.username, fetchTrips]);

  const value: UserTripsCtx = {
    user: userData,
    trips: trips ?? [],
    tripMembersMap: tripMembersMap ?? {},
    expensesByTripId: expensesByTripId ?? {},
    loading,
    error,
    fetchTrips,
  };

  return (
    <UserTripsContext.Provider value={value}>
      {children}
    </UserTripsContext.Provider>
  );
};

export const useUserTripsContext = () => {
  const ctx = useContext(UserTripsContext);
  // Normalize to safe shapes for consumers
  return {
    ...ctx,
    trips: ctx.trips ?? [],
    tripMembersMap: ctx.tripMembersMap ?? {},
    expensesByTripId: ctx.expensesByTripId ?? {},
  };
};
