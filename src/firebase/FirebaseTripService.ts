// src/services/FirebaseTripService.ts
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  collectionGroup,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { TripsTableDDB, MemberDDB } from "@/src/types/DataTypes";

/** Fetch all trips where the user is a member */
export async function getUserTripsAndMembers(
  userId: string
): Promise<{
  trips: TripsTableDDB[];
  membersByTrip: Record<string, Record<string, MemberDDB>>;
}> {
  try{
    const tripsCol = collection(db, "trips");
    const q = query(collectionGroup(db, "members"), where("userId", "==", userId));
    const memberSnaps = await getDocs(q);
    
    const trips: TripsTableDDB[] = [];
    const membersByTrip: Record<string, Record<string, MemberDDB>> = {};
    
    for (const mDoc of memberSnaps.docs) {
      const tripRef = mDoc.ref.parent.parent;
      if (!tripRef) continue;
      
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) continue;
      
      const tripId = tripSnap.id;
      const tripData = { tripId, ...tripSnap.data() } as TripsTableDDB;
      
      trips.push(tripData);
      
      // get all members for this trip
      const membersCol = collection(db, "trips", tripId, "members");
      const membersSnap = await getDocs(membersCol);
      const members: Record<string, MemberDDB> = {};
      membersSnap.forEach((doc) => {
        const data = doc.data() as MemberDDB;
        members[data.userId] = { ...data, userId: data.userId };
      });
      
      membersByTrip[tripId] = members;
    }
    return { trips, membersByTrip };
  } catch(error) {
    console.error('[FirebaseTripService] Error fetching user trips:', error);
    throw error;
  }
}

export async function updateTripMetaData(
  tripId: string,
  updates: Record<string, any>
): Promise<void> {
  if (!tripId) throw new Error("Trip ID is required.");

  try {
    const tripRef = doc(db, "trips", tripId);
    await updateDoc(tripRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Firestore] updateTripMetaData error:", error);
    throw error;
  }
}
