// src/hooks/useExpenses.ts
import { useState, useEffect } from 'react';
import { subscribeToExpenses } from '@/src/services/expenseService';
import { Expense } from '@/src/types/DataTypes';

export const useExpenses = (tripId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when tripId changes
    setIsLoading(true);
    setError(null);
    setExpenses([]);

    if (!tripId) {
        setIsLoading(false);
        return; // No tripId, do nothing
    }

    const unsubscribe = subscribeToExpenses(
      tripId,
      (fetchedExpenses) => {
        setExpenses(fetchedExpenses);
        setIsLoading(false);
      },
      // (fetchError) => { // Enhanced service could pass error to callback
      //   console.error("Error in expense subscription:", fetchError);
      //   setError("Failed to load expenses.");
      //   setIsLoading(false);
      // }
    );

    // Cleanup subscription on unmount or tripId change
    return () => unsubscribe();

  }, [tripId]); // Re-run effect if tripId changes

  return { expenses, isLoading, error };
};