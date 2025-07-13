import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Payment } from "../types/DataTypes";

const TripPaymentsContext = createContext(null);

export const TripPaymentsProvider = ({ tripId, children }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    console.log(`[TripPaymentsContext] Setting up payments listener for tripId: ${tripId}`);
    const paymentsColRef = collection(db, "trips", tripId, "payments");
    const unsubscribe = onSnapshot(
      paymentsColRef,
      (snapshot) => {
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      console.log(`[TripPaymentsContext] Cleaning up payments listener for tripId: ${tripId}`);
      unsubscribe();
    };
  }, [tripId]);

  return (
    <TripPaymentsContext.Provider value={{ payments, loading, error }}>
      {children}
    </TripPaymentsContext.Provider>
  );
};

export const useTripPaymentsContext = () => {
  const ctx = useContext(TripPaymentsContext);
  if (!ctx) throw new Error("useTripPaymentsContext must be used within a TripPaymentsProvider");
  return ctx;
}; 