// src/hooks/useProposedActivities.ts

import { useState, useEffect } from 'react';
import { subscribeToProposedActivities } from '@/src/TripSections/Activity/utilities/ActivityUtilities';
import { ProposedActivity } from '@/src/types/DataTypes';

export const useProposedActivities = (tripId: string | null) => {
  const [activities, setActivities] = useState<ProposedActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setActivities([]);

    if (!tripId) {
        console.log("useProposedActivities: No tripId provided.");
        setIsLoading(false);
        // Optionally set an error state here if tripId is expected
        // setError(new Error("Trip ID is required to fetch activities."));
        return; // Stop if no tripId
    }

    console.log(`useProposedActivities: Subscribing for tripId: ${tripId}`);

    const unsubscribe = subscribeToProposedActivities(
      tripId,
      (fetchedActivities) => {
        console.log("useProposedActivities: Received activities", fetchedActivities.length);
        setActivities(fetchedActivities);
        setIsLoading(false);
        setError(null);
      },
      (fetchError) => {
          console.error("useProposedActivities: Subscription error:", fetchError);
        setError(fetchError);
        setIsLoading(false);
      }
    );

    return () => {
        console.log(`useProposedActivities: Unsubscribing for tripId: ${tripId}`);
        unsubscribe();
    };

  }, [tripId]);

  return { activities, isLoading, error };
};