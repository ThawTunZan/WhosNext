import firestore from '@react-native-firebase/firestore';
import {
  ProposedActivity,
  NewProposedActivityData,
  MembersMap,
  VoteType,
} from '../types/DataTypes';

const TRIPS_COLLECTION = 'trips';
const ACTIVITIES_SUBCOLLECTION = 'proposed_activities';

export const subscribeToProposedActivities = (
  tripId: string,
  callback: (activities: ProposedActivity[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!tripId) {
    onError(new Error("No Trip ID provided for subscription."));
    return () => {};
  }

  const ref = firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(ACTIVITIES_SUBCOLLECTION)
    .orderBy("createdAt", "desc");

  return ref.onSnapshot(snapshot => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProposedActivity[];
    callback(activities);
  }, error => {
    console.error("Error fetching activities:", error);
    onError(error);
    callback([]);
  });
};

export const addProposedActivity = async (
  tripId: string,
  activityData: NewProposedActivityData
): Promise<string> => {
  const ref = firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(ACTIVITIES_SUBCOLLECTION);

  const docRef = await ref.add({
    ...activityData,
    createdAt: firestore.FieldValue.serverTimestamp(),
    votes: {},
    votesUp: 0,
    votesDown: 0,
  });

  return docRef.id;
};

export const castVote = async (
  tripId: string,
  activityId: string,
  userId: string,
  voteType: VoteType
) => {
  const activityRef = firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(ACTIVITIES_SUBCOLLECTION)
    .doc(activityId);

  await firestore().runTransaction(async tx => {
    const snap = await tx.get(activityRef);
    if (!snap.exists) throw new Error("Activity not found");

    const data = snap.data();
    const currentVotes = data?.votes || {};
    const prevVote = currentVotes[userId];

    let upChange = 0, downChange = 0;
    const updatedVotes = { ...currentVotes };

    if (prevVote === voteType) {
      if (voteType === 'up') upChange -= 1;
      else downChange -= 1;
      delete updatedVotes[userId];
    } else {
      if (prevVote === 'up') upChange -= 1;
      else if (prevVote === 'down') downChange -= 1;

      if (voteType === 'up') upChange += 1;
      else downChange += 1;

      updatedVotes[userId] = voteType;
    }

    const updatePayload: any = { votes: updatedVotes };
    if (upChange !== 0) updatePayload.votesUp = firestore.FieldValue.increment(upChange);
    if (downChange !== 0) updatePayload.votesDown = firestore.FieldValue.increment(downChange);

    tx.update(activityRef, updatePayload);
  });
};

export const deleteProposedActivity = async (
  tripId: string,
  activityId: string
) => {
  const activityRef = firestore()
    .collection(TRIPS_COLLECTION)
    .doc(tripId)
    .collection(ACTIVITIES_SUBCOLLECTION)
    .doc(activityId);
  await activityRef.delete();
};
