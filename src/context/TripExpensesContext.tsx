import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const TripExpensesContext = createContext(null);

export const TripExpensesProvider = ({ tripId, children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    const expensesColRef = collection(db, "trips", tripId, "expenses");
    const unsubscribe = onSnapshot(
      expensesColRef,
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
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
