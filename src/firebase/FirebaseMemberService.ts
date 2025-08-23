import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { TripsTableDDB, MemberDDB } from "@/src/types/DataTypes";

/**
 * Adds a member to Firestore under members/{tripId}.
 * 
 * Each members/{tripId} doc has:
 * {
 *   tripId: "...",
 *   members: {
 *     [userId]: { ...memberData }
 *   }
 * }
 */
export const addMemberToFirebase = async (
  tripData: TripsTableDDB,
  memberData: MemberDDB
): Promise<void> => {
  if (!tripData?.tripId) {
    throw new Error("Trip ID is required.");
  }
  if (!memberData?.userId) {
    throw new Error("Member userId is required.");
  }

  const membersDocRef = doc(db, "members", tripData.tripId);

  // Get the current document
  const snap = await getDoc(membersDocRef);

  if (snap.exists()) {
    const data = snap.data();
    const members = data.members || {};

    // Prevent duplicates
    if (members[memberData.userId]) {
      throw new Error("Member already exists in this trip.");
    }

    // Update with the new member
    await updateDoc(membersDocRef, {
      [`members.${memberData.userId}`]: memberData,
    });
  } else {
    // Create a new members document for this trip
    await setDoc(membersDocRef, {
      tripId: tripData.tripId,
      members: {
        [memberData.userId]: memberData,
      },
    });
  }
};
