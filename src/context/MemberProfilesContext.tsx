// MemberProfilesContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {db} from "@/firebase"
const Users = collection(db, "users");

const ProfilesContext = createContext<Record<string,string>>({});

export function MemberProfilesProvider({
  memberUids,
  children,
}: {
  memberUids: string[];
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState<Record<string,string>>({});

  useEffect(() => {
    // Listen to ALL users, or you can build a query just for memberUids
    const unsub = onSnapshot(Users, (snapshot) => {
      const map: Record<string,string> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // only keep the ones in memberUids
        if (memberUids.includes(doc.id)) {
          map[doc.id] =
            typeof data.name === "string"
              ? data.name
              : typeof data.username === "string"
              ? data.username
              : doc.id;
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
