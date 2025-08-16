import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { generateClient } from 'aws-amplify/api';
import { listTrips, listMembers, getTrip } from '@/src/graphql/queries';
import { syncUserProfileToDynamoDB } from '@/src/services/syncUserProfile';

const UserTripsContext = createContext(null);

const cleanGraphQLData = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanGraphQLData);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip GraphQL and AWS metadata fields
      if (key === '__typename' || 
          key === 'nextToken' || 
          key === '_version' || 
          key === '_deleted' ||
          key === '_lastChangedAt') {
        continue;
      }
      cleaned[key] = cleanGraphQLData(value);
    }
    return cleaned;
  }

  return obj;
};


export const UserTripsProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripMembersMap, setTripMembersMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const client = useMemo(() => generateClient(), []);

  const fetchTrips = useCallback(async () => {
    if (!user?.username) return;
    
    setLoading(true);
    setError(null);

    try {
      const membersResponse = await client.graphql({
        query: listMembers,
        variables: {
          filter: {
            username: { eq: user.username }
          }
        }
      });

      const userMemberships = cleanGraphQLData(membersResponse.data.listMembers.items);
      const tripIds = userMemberships.map(member => member.tripId);

      if (tripIds.length === 0) {
        setTrips([]);
        setUserData({
          username: user.username,
          trips: [],
          friends: [],
          incomingFriendRequests: [],
          outgoingFriendRequests: [],
          premiumStatus: 'free'
        });
        setLoading(false);
        return;
      }

      const tripPromises = tripIds.map(tripId =>
        client.graphql({
          query: getTrip,
          variables: { id: tripId }
        })
      );

      const tripResponses = await Promise.all(tripPromises);
      const allTrips = tripResponses
      .map(res => cleanGraphQLData(res.data.getTrip))
      .filter(Boolean);

      const membersByTripId: Record<string, any[]> = {};
      for (const tripId of tripIds) {
        const membersResp = await client.graphql({
          query: listMembers,
          variables: { filter: { tripId: { eq: tripId } } }
        });
        membersByTripId[tripId] = cleanGraphQLData(membersResp.data.listMembers.items) || [];
      }

      setTripMembersMap(membersByTripId);
      setTrips(allTrips);
      setUserData({
        username: user.username,
        trips: allTrips.map(trip => trip.id),
        friends: [],
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
        premiumStatus: 'free'
      });
    } catch (err) {
      console.error('[UserTripsContext] Error fetching trips:', err);
      setError(err);
      setUserData({
        username: user.username,
        trips: [],
        friends: [],
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
        premiumStatus: 'free'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    console.log('[UserTripsContext] useEffect triggered. Setting up AWS GraphQL queries.');
    
    setLoading(true);
    setError(null);
    setUserData(null);
    setTrips([]);

    if (!isLoaded || !isSignedIn || !user) {
      setLoading(false);
      return;
    }

    // Sync user to DynamoDB
    try {
      const userFromClerk = {
        id: user.username,
        username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        primaryEmailAddress: user.primaryEmailAddress?.emailAddress || '',
        profileImageUrl: user.imageUrl || '',
        friends: [], // TODO: update this later with real data
        incomingFriendRequests: [],
        outgoingFriendRequests: [],
        trips: [],
        premiumStatus: userData?.premiumStatus || 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    
      syncUserProfileToDynamoDB(userFromClerk).catch(console.error);
    } catch (err) {
      console.error("Error syncing user profile to DB:", err);
    }
    

    fetchTrips();
    return () => {
      console.log('[UserTripsContext] useEffect cleanup. Cleaning up AWS client.');
    };
  }, [isLoaded, isSignedIn, user?.username]);

  return (
    <UserTripsContext.Provider value={{ user: userData, trips, loading, error,tripMembersMap, fetchTrips }}>
      {children}
    </UserTripsContext.Provider>
  );
};

export const useUserTripsContext = () => {
  const ctx = useContext(UserTripsContext);
  if (!ctx) throw new Error("useUserTripsContext must be used within a UserTripsProvider");
  return ctx;
}; 