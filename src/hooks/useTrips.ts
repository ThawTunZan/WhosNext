import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { TripData } from '@/src/types/DataTypes';

export function useTrips() {
  const { user } = useUser();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.username) {
      setIsTripsLoading(false);
      return;
    }

    setIsTripsLoading(true);
    setError(null);

    const q = query(
      collection(db, 'trips'),
      where(`members.${user.username}`, '!=', null)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTrips(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as TripData),
          }))
        );
        setIsTripsLoading(false);
      },
      (err) => {
        console.error('Error fetching trips:', err);
        setError(err);
        setIsTripsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.username]);

  return { trips, isTripsLoading, error };
} 