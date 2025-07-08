// src/hooks/useTripData.ts
import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';
import { TripData, Expense, Payment } from '@/src/types/DataTypes';

export const useTripData = (tripId: string | null | undefined) => {
    const [trip, setTrip] = useState<TripData | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!tripId) {
            setLoading(false);
            setTrip(null);
            setExpenses([]);
            setPayments([]);
            setError(new Error("No Trip ID provided to useTripData"));
            return;
        }

        setLoading(true);
        setError(null);
        console.log(`useTripData: Subscribing to trip ${tripId}`);

        // Subscribe to Trip Document
        const tripRef = doc(db, "trips", tripId);
        const unsubscribeTrip = onSnapshot(tripRef, (docSnap) => {
            if (docSnap.exists()) {
                setTrip(docSnap.data() as TripData); // Assert type
            } else {
                console.warn(`Trip with ID ${tripId} does not exist.`);
                setTrip(null);
                setError(new Error(`Trip with ID ${tripId} not found.`));
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching trip data:", err);
            setError(err);
            setLoading(false);
        });

        // Subscribe to Expenses Subcollection
        const expensesColRef = collection(db, "trips", tripId, "expenses");
        const unsubscribeExpenses = onSnapshot(expensesColRef, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Expense)); 
            setExpenses(expensesData);
            // Note: loading is primarily controlled by the trip data fetch
        }, (err) => {
            console.error("Error fetching expenses subcollection:", err);
            // Potentially set a specific expensesError state
        });

        // Subscribe to Payments Subcollection
        const paymentsColRef = collection(db, "trips", tripId, "payments");
        const unsubscribePayments = onSnapshot(paymentsColRef, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }) as Payment);
            setPayments(paymentsData);
        }, (err) => {
            console.error("Error fetching payments subcollection:", err);
            // Optionally set a paymentsError state
        });

        // Cleanup function
        return () => {
            console.log(`useTripData: Unsubscribing from trip ${tripId}`);
            unsubscribeTrip();
            unsubscribeExpenses();
            unsubscribePayments();
        };
    }, [tripId]);

    return { trip, expenses, payments, loading, error };
};