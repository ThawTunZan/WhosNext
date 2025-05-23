import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { TripData } from '../types/DataTypes';

export function useTrips() {
  const { user } = useUser();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'trips'),
      where(`members.${user.id}`, '!=', null)
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
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching trips:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  return { trips, loading, error };
} 