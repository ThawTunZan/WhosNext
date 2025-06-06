// MemberProfilesContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase"
const Users = collection(db, "users");

const ProfilesContext = createContext<Record<string, string>>({});

export function MemberProfilesProvider({
	memberUids,
	children,
}: {
	memberUids: string[];
	children: React.ReactNode;
}) {
	const [profiles, setProfiles] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!memberUids.length) {
			setProfiles({});
			return;
		}

		// Create a query for just the member UIDs we need
		const q = query(Users, where('__name__', 'in', memberUids));

		const unsub = onSnapshot(q, (snapshot) => {
			const map: Record<string, string> = {};
			snapshot.docs.forEach((doc) => {
				const data = doc.data();
				map[doc.id] = typeof data.name === "string"? data.name
						: typeof data.username === "string"? data.username
							: doc.id;
			});

			// Add any missing memberUids with their ID as fallback
			memberUids.forEach(uid => {
				if (!map[uid]) {
					map[uid] = uid;
				}
			});

			setProfiles(map);
		});

		return () => unsub();
	}, [memberUids]);

	return (
		<ProfilesContext.Provider value={profiles}>
			{children}
		</ProfilesContext.Provider>
	);
}

export function useMemberProfiles() {
	return useContext(ProfilesContext);
}
