// src/services/ActivityUtilities.ts
import {
    collection,
    doc,
    addDoc,
    onSnapshot,
    Timestamp,
    runTransaction,
    increment,
    deleteDoc, // Might need later if activities can be deleted
    query,
    orderBy,
    updateDoc,
    getDoc,
    // serverTimestamp // Alternative to Timestamp.now()
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
    ProposedActivity,
    NewProposedActivityData,
    VoteType
} from '../types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from './notification';

const TRIPS_COLLECTION = 'trips';
const ACTIVITIES_SUBCOLLECTION = 'proposed_activities';

/**
 * Subscribes to real-time updates for proposed activities within a trip.
 * For the DB (firebase)
 * @param tripId The ID of the trip.
 * @param callback Function to call with the updated activities array.
 * @returns Unsubscribe function.
 */
export const subscribeToProposedActivities = (
    tripId: string,
    callback: (activities: ProposedActivity[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    if (!tripId) {
        onError(new Error("No Trip ID provided for subscription."));
        return () => {}; // Return no-op unsubscribe
    }
    const activitiesColRef = collection(db, TRIPS_COLLECTION, tripId, ACTIVITIES_SUBCOLLECTION);
    // TBD: Order activities by creation time or votes
    const q = query(activitiesColRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data: ProposedActivity[] = snapshot.docs.map((doc) => {
            const raw = doc.data();

            return {
                id: doc.id,
                name: raw.name,
                description: raw.description,
                suggestedByID: raw.suggestedByID,
                estCost: raw.estCost,
                currency: raw.currency,
                createdAt: raw.createdAt, 
                votes: raw.votes || {},
                votesUp: raw.votesUp || 0,
                votesDown: raw.votesDown || 0,
            } as ProposedActivity; 
        });
        callback(data);
    }, (error) => {
        console.error("Error fetching proposed activities: ", error);
        onError(error);
        callback([]); // Clear data on error
    });

    return unsubscribe;
};

export const updateProposedActivity = async (
  tripId: string,
  activityId: string,
  updatedData: Partial<NewProposedActivityData>
): Promise<void> => {
  if (!tripId || !activityId) {
    throw new Error("Trip ID and Activity ID are required to update an activity.")
  }
  const docRef = doc(db, TRIPS_COLLECTION, tripId, ACTIVITIES_SUBCOLLECTION, activityId)
  try {
    // only overwrite the fields the user changed
    await updateDoc(docRef, {
      ...updatedData,
      // you may or may not want to bump a `lastEditedAt` timestamp here
      updatedAt: Timestamp.now(),
    })
    console.log(`Activity ${activityId} updated.`)
  } catch (err) {
    console.error(`Failed to update activity ${activityId}:`, err)
    throw err
  }
}

/**
 * Adds a new proposed activity to a trip.
 * @param tripId The ID of the trip.
 * @param activityData Data for the new activity (excluding generated fields).
 * @returns The ID of the newly created activity.
 */
export const addProposedActivity = async (
    tripId: string,
    activityData: NewProposedActivityData
): Promise<string> => {
     if (!tripId) {
        throw new Error("No Trip ID provided to add activity.");
    }
    // if the ID o the name of the person who suggested the activity is not provided
     if (!activityData.suggestedByID) {
         throw new Error("Activity proposer ID is required.");
     }

    const activitiesColRef = collection(db, TRIPS_COLLECTION, tripId, ACTIVITIES_SUBCOLLECTION);

    const docData = {
        ...activityData,
        createdAt: Timestamp.now(),
        votes: {}, // Initialize empty votes map
        votesUp: 0,
        votesDown: 0,
    };

    try {
        const docRef = await addDoc(activitiesColRef, docData);
        console.log("Proposed activity added with ID: ", docRef.id);

        // Get trip members to notify them
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();

        if (tripData && tripData.members) {
            // Get proposer's name from users collection
            const userRef = doc(db, "users", activityData.suggestedByID);
            const userSnap = await getDoc(userRef);
            const proposerName = userSnap.exists() ? userSnap.data().username : 'Someone';

            // Notify all members except the proposer
            Object.keys(tripData.members).forEach(async (memberId) => {
                if (memberId !== activityData.suggestedByID) {
                    await NotificationService.sendTripReminder(
                        "New Activity Proposed",
                        `${proposerName} proposed "${activityData.name}" - Vote now!`,
                        {
                            type: NOTIFICATION_TYPES.TRIP_REMINDER,
                            id: docRef.id,
                            tripId: tripId
                        }
                    );
                }
            });
        }

        return docRef.id;
    } catch (error) {
        console.error("Error adding proposed activity: ", error);
        throw error;
    }
};

/**
 * Records a user's vote on a proposed activity. Handles changing votes.
 * @param tripId The ID of the trip.
 * @param activityId The ID of the proposed activity.
 * @param userId The ID of the user voting.
 * @param voteType The vote being cast ('up' or 'down').
 */
export const castVote = async (
    tripId: string,
    activityId: string,
    userId: string,
    voteType: VoteType
): Promise<void> => {
    if (!tripId || !activityId || !userId) {
         throw new Error("Trip ID, Activity ID, and User ID are required to cast a vote.");
     }
    const activityDocRef = doc(db, TRIPS_COLLECTION, tripId, ACTIVITIES_SUBCOLLECTION, activityId);

    try {
        await runTransaction(db, async (transaction) => {
            const activitySnap = await transaction.get(activityDocRef);
            if (!activitySnap.exists()) {
                throw new Error(`Activity ${activityId} does not exist.`);
            }

            const data = activitySnap.data();
            const currentVotes = (data.votes || {}) as { [uid: string]: VoteType };
            const previousVote = currentVotes[userId]; // 'up', 'down', or undefined

            let votesUpIncrement = 0;
            let votesDownIncrement = 0;

            const updatedVotes = { ...currentVotes };

            if (previousVote === voteType) {
                if (voteType === 'up') {
                    votesUpIncrement -= 1;
                } else if (voteType === 'down') {
                    votesDownIncrement -= 1;
                }
                delete updatedVotes[userId];
                // Prepare update payload for unvote
                const updatePayload: { votes: any; votesUp?: any; votesDown?: any } = {
                    votes: updatedVotes,
                };
                if (votesUpIncrement !== 0) {
                    updatePayload.votesUp = increment(votesUpIncrement);
                }
                if (votesDownIncrement !== 0) {
                    updatePayload.votesDown = increment(votesDownIncrement);
                }
                transaction.update(activityDocRef, updatePayload);
                console.log(`User ${userId} unvoted ${voteType} on ${activityId}.`);
                return;
            }

            // Calculate count increments based on vote change
            if (previousVote === 'up') {
                votesUpIncrement = -1; // 
            } else if (previousVote === 'down') {
                votesDownIncrement = -1;
            }

            if (voteType === 'up') {
                votesUpIncrement = 1; // Add new upvote
                updatedVotes[userId] = 'up';
            } else if (voteType === 'down') {
                votesDownIncrement = 1; // Add new downvote
                updatedVotes[userId] = 'down';
            }
            // Potential 'unvote' logic: else { delete updatedVotes[userId]; }

            // Prepare update payload
            const updatePayload: { votes: any; votesUp?: any; votesDown?: any } = {
                votes: updatedVotes,
            };
            if (votesUpIncrement !== 0) {
                updatePayload.votesUp = increment(votesUpIncrement);
            }
            if (votesDownIncrement !== 0) {
                updatePayload.votesDown = increment(votesDownIncrement);
            }

            transaction.update(activityDocRef, updatePayload);
        });
        console.log(`Vote (${voteType}) by user ${userId} on activity ${activityId} recorded successfully.`);
    } catch (error) {
        console.error("Error casting vote: ", error);
        throw error;
    }
};

// TBC (add checks for permissions later)
export const deleteProposedActivity = async (
    tripId: string,
    activityId: string
): Promise<void> => {
     if (!tripId || !activityId) {
         throw new Error("Trip ID and Activity ID are required to delete.");
     }
    const activityDocRef = doc(db, TRIPS_COLLECTION, tripId, ACTIVITIES_SUBCOLLECTION, activityId);
     try {
        await deleteDoc(activityDocRef);
        console.log(`Proposed activity ${activityId} deleted successfully.`);
     } catch (error) {
         console.error(`Error deleting proposed activity ${activityId}: `, error);
         throw error;
     }
};