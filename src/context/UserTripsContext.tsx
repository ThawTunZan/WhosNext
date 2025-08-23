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
	MemberDDB,
	ExpenseDDB,
	TripsTableDDB,
	UserDDB,
	PremiumStatus,
} from "@/src/types/DataTypes";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

// ---------- Shapes kept in context ----------
type MembersByTrip = Record<string, Record<string, MemberDDB>>;
type ExpensesByTrip = Record<string, ExpenseDDB[]>;
type FriendsMap = Record<string, FriendData>;

export type FriendData = {
	id: string;
	fullName: string;
	username: string;
	email: string;
	avatarUrl: string;
}

type UserTripsCtx = {
	user: UserDDB | null;
	trips: TripsTableDDB[];
	tripMembersMap: MembersByTrip;
	expensesByTripId: ExpensesByTrip;
	friendsIds: string[];
	friendsMap: FriendsMap;
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
	friendsIds: [],
	friendsMap: {},
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
	const [friendsIds, setFriendsIds] = useState<string[]>([]);
	const [friendsMap, setFriendsMap] = useState<FriendsMap>({});
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<any>(null);
	
	const fetchTrips = useCallback(() => {
		if (!user?.id) return;
		
		setLoading(true);
		setError(null);
		
		// keep track of unsubscribe callbacks for cleanup
		const unsubscribers: (() => void)[] = [];
		
		try {
			const userRef = doc(db, "users", user.id);
			const unsubUser = onSnapshot(
				userRef,
				(userSnap) => {
					if (!userSnap.exists()) {
						setError("User document not found");
						setTrips([]);
						setTripMembersMap({});
						setFriendsIds([]);
						setFriendsMap({});
						setLoading(false);
						return;
					}
					
					const userDocData = userSnap.data() as UserDDB;
					const tripIds = userDocData.trips || [];
					const currFriends = userDocData.friends || [];
					
					// update userData state
					setUserData((prev) => ({
						id: user.id,
						username:
						user.username ||
						user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
						"user",
						email: user.primaryEmailAddress?.emailAddress || "",
						fullName:
						`${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
						avatarUrl: user.imageUrl || "",
						premiumStatus: prev?.premiumStatus ?? PremiumStatus.FREE,
						friends: currFriends,
						incomingFriendRequests: prev?.incomingFriendRequests ?? [],
						outgoingFriendRequests: prev?.outgoingFriendRequests ?? [],
						trips: tripIds,
						createdAt: prev?.createdAt ?? new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}));
					
					// update friends list
					setFriendsIds(currFriends);
					
					// set up subscriptions for friends' user docs
					currFriends.forEach((fid: string) => {
						const fRef = doc(db, "users", fid);
						const unsubFriend = onSnapshot(fRef, (fSnap) => {
							if (fSnap.exists()) {
								const fData = fSnap.data() as FriendData;
								setFriendsMap(prev => ({
									...prev,
									[fid]: {
										id: fid,
										fullName: fData.fullName ?? "",
										username: fData.username ?? "",
										email: fData.email ?? "",
										avatarUrl: fData.avatarUrl ?? "",
									},
								}));
							}
						});
						unsubscribers.push(unsubFriend);
					});
					
					// reset before refetch trips
					const newTrips: TripsTableDDB[] = [];
					const newMembersByTrip: MembersByTrip = {};
					
					// set up snapshots for each trip
					tripIds.forEach((tripId) => {
						const tripRef = doc(db, "trips", tripId);
						const unsubTrip = onSnapshot(tripRef, (tripSnap) => {
							if (!tripSnap.exists()) return;
							
							const tripData = { tripId, ...tripSnap.data() } as TripsTableDDB;
							
							// merge trips (replace or add)
							setTrips((prev) => {
								const filtered = prev.filter((t) => t.tripId !== tripId);
								return [...filtered, tripData];
							});
						});
						
						unsubscribers.push(unsubTrip);
						
						// members snapshot
						const membersDoc = doc(db, "members", tripId);
						const unsubMembers = onSnapshot(membersDoc, (docSnap) => {
							if (docSnap.exists()) {
								const data = docSnap.data();
								const membersMap = data.members || {};
								setTripMembersMap((prev) => ({
									...prev,
									[tripId]: membersMap,
								}));
							}
						});
						unsubscribers.push(unsubMembers);
						
						// expenses snapshot
						const expensesDoc = doc(db, "expenses", tripId);
						const unsubExpenses = onSnapshot(expensesDoc, (docSnap) => {
							if (docSnap.exists()) {
								const data = docSnap.data();
								const expensesArr = Object.values(
									data.expenses || {}
								) as ExpenseDDB[];
								
								setExpensesByTripId((prev) => ({
									...prev,
									[tripId]: expensesArr,
								}));
							} else {
								setExpensesByTripId((prev) => ({
									...prev,
									[tripId]: [],
								}));
							}
						});
						
						unsubscribers.push(unsubExpenses);
					});
					
					setLoading(false);
				},
				(err) => {
					console.error("[UserTripsContext] Error fetching trips:", err);
					setError(err);
					setLoading(false);
				}
			);
			
			unsubscribers.push(unsubUser);
		} catch (err) {
			console.error("[UserTripsContext] Unexpected error:", err);
			setError(err);
			setLoading(false);
		}
		
		// cleanup function
		return () => {
			unsubscribers.forEach((unsub) => unsub());
		};
	}, [
		user?.id,
		user?.username,
		user?.primaryEmailAddress?.emailAddress,
		user?.firstName,
		user?.lastName,
		user?.imageUrl,
	]);
	
	useEffect(() => {
		if (!isLoaded || !isSignedIn || !user) {
			setTrips([]);
			setTripMembersMap({});
			setExpensesByTripId({});
			setFriendsIds([]);
			setFriendsMap({});
			setUserData(null);
			setLoading(false);
			return;
		}
		
		const cleanup = fetchTrips();
		return () => {
			if (cleanup) cleanup();
		};
	}, [isLoaded, isSignedIn, user?.id, fetchTrips]);
	
	const value: UserTripsCtx = useMemo(
		() => ({
			user: userData,
			trips: trips ?? [],
			tripMembersMap: tripMembersMap ?? {},
			expensesByTripId: expensesByTripId ?? {},
			friendsIds: friendsIds ?? [],
			friendsMap: friendsMap ?? {},
			loading,
			error,
			fetchTrips,
		}),
		[
			userData,
			trips,
			tripMembersMap,
			expensesByTripId,
			friendsIds,
			friendsMap,
			loading,
			error,
			fetchTrips,
		]
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
		friendsIds: ctx.friendsIds ?? [],
		friendsMap: ctx.friendsMap ?? {},
	};
};
