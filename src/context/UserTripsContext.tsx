import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { db } from "@/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { incrementFirestoreRead } from "@/src/utilities/firestoreReadCounter";

const UserTripsContext = createContext(null);

export const UserTripsProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tripsUnsubRef = useRef([]);
  const userUnsubRef = useRef(null);

  useEffect(() => {
    tripsUnsubRef.current.forEach(unsub => unsub && unsub());
    tripsUnsubRef.current = [];
    if (userUnsubRef.current) {
      userUnsubRef.current();
      userUnsubRef.current = null;
    }
    setLoading(true);
    setError(null);
    setUserData(null);
    setTrips([]);

    if (!isLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    // Listen to user doc for trips array
    const userDocRef = doc(db, "users", user.username || user.id);
    userUnsubRef.current = onSnapshot(userDocRef, async (userDocSnap) => {
      incrementFirestoreRead();
      if (!userDocSnap.exists()) {
        setUserData(null);
        setTrips([]);
        setLoading(false);
        return;
      }
      const userDocData = userDocSnap.data();
      setUserData(userDocData);
      const tripIds = userDocData?.trips || [];
      if (!tripIds.length) {
        setTrips([]);
        setLoading(false);
        return;
      }
      // Clean up previous trip listeners
      tripsUnsubRef.current.forEach(unsub => unsub && unsub());
      tripsUnsubRef.current = [];
      let allTrips = [];
      let completedBatches = 0;
      const batchSize = 10;
      setLoading(true);
      for (let i = 0; i < tripIds.length; i += batchSize) {
        const batchIds = tripIds.slice(i, i + batchSize);
        const q = query(collection(db, "trips"), where("__name__", "in", batchIds));
        const unsub = onSnapshot(q, (batchSnap) => {
          incrementFirestoreRead(batchSnap.size);
          // Remove old trips from this batch
          allTrips = allTrips.filter(trip => !batchIds.includes(trip.id));
          // Add new trips from this batch
          batchSnap.forEach(docSnap => {
            allTrips.push({ id: docSnap.id, ...docSnap.data() });
          });
          // If all batches have been processed, update state
          completedBatches++;
          if (completedBatches * batchSize >= tripIds.length) {
            setTrips([...allTrips]);
            setLoading(false);
          }
        }, (err) => {
          setError(err);
          setLoading(false);
        });
        tripsUnsubRef.current.push(unsub);
      }
    }, (err) => {
      setError(err);
      setLoading(false);
    });
    // Cleanup on unmount
    return () => {
      tripsUnsubRef.current.forEach(unsub => unsub && unsub());
      tripsUnsubRef.current = [];
      if (userUnsubRef.current) {
        userUnsubRef.current();
        userUnsubRef.current = null;
      }
    };
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