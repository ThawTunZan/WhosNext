import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { FirestoreExpense } from "../types/DataTypes";

const TripExpensesContext = createContext(null);

export const TripExpensesProvider = ({ tripId, children }) => {
  const [expenses, setExpenses] = useState<FirestoreExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    console.log(`[TripExpensesContext] Setting up expenses listener for tripId: ${tripId}`);
    const expensesColRef = collection(db, "trips", tripId, "expenses");
    const unsubscribe = onSnapshot(
      expensesColRef,
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            activityName: data.activityName ?? "",
            createdAt: data.createdAt ?? null,
            currency: data.currency ?? "",
            paidByAndAmounts: data.paidByAndAmounts ?? [],
            sharedWith: data.sharedWith ?? [],
          };
        }));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      console.log(`[TripExpensesContext] Cleaning up expenses listener for tripId: ${tripId}`);
      unsubscribe();
    };
  }, [tripId]);

  return (
    <TripExpensesContext.Provider value={{ expenses, loading, error }}>
      {children}
    </TripExpensesContext.Provider>
  );
};

export const useTripExpensesContext = () => {
  const ctx = useContext(TripExpensesContext);
  if (!ctx) throw new Error("useTripExpensesContext must be used within a TripExpensesProvider");
  return ctx;
};
