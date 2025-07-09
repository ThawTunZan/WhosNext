import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/firebase";
import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";

const UserTripsContext = createContext(null);

export const UserTripsProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        setLoading(false);
        setUserData(null);
        setTrips([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch user data
        const userDocRef = doc(db, "users", user.username || user.id);
        const userDocSnap = await getDoc(userDocRef);
        const userDocData = userDocSnap.exists() ? userDocSnap.data() : null;
        setUserData(userDocData);

        // Fetch only trips in user's trips array
        const tripIds = userDocData?.trips || [];
        let tripsList = [];
        if (tripIds.length > 0) {
          // Firestore 'in' query supports up to 10 IDs per query
          const batchSize = 10;
          for (let i = 0; i < tripIds.length; i += batchSize) {
            const batchIds = tripIds.slice(i, i + batchSize);
            const q = query(collection(db, "trips"), where("__name__", "in", batchIds));
            const batchSnap = await getDocs(q);
            batchSnap.forEach(docSnap => {
              tripsList.push({ id: docSnap.id, ...docSnap.data() });
            });
          }
        }
        setTrips(tripsList);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoaded, isSignedIn, user]);

  return (
    <UserTripsContext.Provider value={{ user: userData, trips, loading, error }}>
      {children}
    </UserTripsContext.Provider>
  );
};

export const useUserTripsContext = () => {
  const ctx = useContext(UserTripsContext);
  if (!ctx) throw new Error("useUserTripsContext must be used within a UserTripsProvider");
  return ctx;
}; 