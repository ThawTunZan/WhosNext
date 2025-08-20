// src/context/UserTripsContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  PropsWithChildren,
} from "react";
import { useUser } from "@clerk/clerk-expo";

import {
  getUserMemberships,
  getTripById,
  getMembersByTrip,
  getExpensesByTrip,
} from "@/src/aws-services/DynamoDBService";

import {
  MemberDDB,
  ExpenseDDB,
  TripsTableDDB,
  UserDDB,
  PremiumStatus,
} from "@/src/types/DataTypes";

// ---------- Shapes kept in context ----------
type MembersByTrip = Record<string, Record<string, MemberDDB>>;
type ExpensesByTrip = Record<string, ExpenseDDB[]>;

type UserTripsCtx = {
  user: UserDDB | null; 
  trips: TripsTableDDB[];
  tripMembersMap: MembersByTrip;
  expensesByTripId: ExpensesByTrip;
  loading: boolean;
  error: any;
  fetchTrips: () => void;
};

// ---------- Defaults ----------
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

// ---------- Provider ----------
export const UserTripsProvider = ({ children }: PropsWithChildren) => {
  const { isLoaded, isSignedIn, user } = useUser();

  const [userData, setUserData] = useState<UserDDB | null>(null);
  const [trips, setTrips] = useState<TripsTableDDB[]>([]);
  const [tripMembersMap, setTripMembersMap] = useState<MembersByTrip>({});
  const [expensesByTripId, setExpensesByTripId] = useState<ExpensesByTrip>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const userId = user.id;

      const memberships = await getUserMemberships(userId);
      const tripIds: string[] = (memberships.items || [])
        .map((it: any) => {
          if (it.tripId) return it.tripId;
          if (typeof it.GSI1SK === "string" && it.GSI1SK.startsWith("TRIP#")) {
            const parts = it.GSI1SK.split("#");
            return parts[1];
          }
          return undefined;
        })
        .filter(Boolean);

      if (tripIds.length === 0) {
        setTrips([]);
        setTripMembersMap({});
        setExpensesByTripId({});
        setUserData({
          id: userId,
          username: user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "user",
          email: user.primaryEmailAddress?.emailAddress || "",
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          avatarUrl: user.imageUrl || "",
          premiumStatus: PremiumStatus.FREE,
          friends: [],
          incomingFriendRequests: [],
          outgoingFriendRequests: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      const [tripDocs, membersEntries, expensesEntries] = await Promise.all([
        Promise.all(tripIds.map((tripId) => getTripById(tripId))),
        Promise.all(
          tripIds.map(async (tripId) => {
            const resp = await getMembersByTrip(tripId);
            const items = resp.items || [];
            const byId = items.reduce((acc, m) => {
              acc[m.userId] = m;
              return acc;
            }, {} as Record<string, MemberDDB>);
            return [tripId, byId] as const;
          })
        ),
        Promise.all(
          tripIds.map(async (tripId) => {
            const resp = await getExpensesByTrip(tripId, {
              limit: 1000,
              scanNewToOld: true,
            });
            const items = resp.items || [];
            return [tripId, items] as const;
          })
        ),
      ]);

      const allTrips = (tripDocs.filter(Boolean) as TripsTableDDB[]);
      const membersByTripId = Object.fromEntries(membersEntries) as MembersByTrip;
      const expensesByTrip = Object.fromEntries(expensesEntries) as ExpensesByTrip;

      setTripMembersMap(membersByTripId);
      setExpensesByTripId(expensesByTrip);
      setTrips(allTrips);

      setUserData((prev) => ({
        id: userId,
        username: user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "user",
        email: user.primaryEmailAddress?.emailAddress || "",
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        avatarUrl: user.imageUrl || "",
        premiumStatus: prev?.premiumStatus ?? PremiumStatus.FREE,
        friends: prev?.friends ?? [],
        incomingFriendRequests: prev?.incomingFriendRequests ?? [],
        outgoingFriendRequests: prev?.outgoingFriendRequests ?? [],
        trips: allTrips.map((t) => t.tripId),
        createdAt: prev?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      console.error("[UserTripsContext] Error fetching trips:", err);
      setError(err);
      setTrips([]);
      setTripMembersMap({});
      setExpensesByTripId({});
      if (user?.id) {
        setUserData({
          id: user.id,
          username: user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "user",
          email: user.primaryEmailAddress?.emailAddress || "",
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          avatarUrl: user.imageUrl || "",
          premiumStatus: PremiumStatus.FREE,
          friends: [],
          incomingFriendRequests: [],
          outgoingFriendRequests: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.username, user?.primaryEmailAddress?.emailAddress, user?.firstName, user?.lastName, user?.imageUrl]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!isLoaded || !isSignedIn || !user) {
      setTrips([]);
      setTripMembersMap({});
      setExpensesByTripId({});
      setUserData(null);
      setLoading(false);
      return;
    }

    fetchTrips();
  }, [isLoaded, isSignedIn, user?.id, fetchTrips]);

  const value: UserTripsCtx = useMemo(
    () => ({
      user: userData,
      trips: trips ?? [],
      tripMembersMap: tripMembersMap ?? {},
      expensesByTripId: expensesByTripId ?? {},
      loading,
      error,
      fetchTrips,
    }),
    [userData, trips, tripMembersMap, expensesByTripId, loading, error, fetchTrips]
  );

  return (
    <UserTripsContext.Provider value={value}>
      {children}
    </UserTripsContext.Provider>
  );
};

export const useUserTripsContext = () => {
  const ctx = useContext(UserTripsContext);
  return {
    ...ctx,
    trips: ctx.trips ?? [],
    tripMembersMap: ctx.tripMembersMap ?? {},
    expensesByTripId: ctx.expensesByTripId ?? {},
  };
};
