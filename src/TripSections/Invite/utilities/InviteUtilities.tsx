// src/services/InviteUtilities.ts
import { db } from "../../../../firebase"
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  arrayUnion, // <-- add this import
} from "firebase/firestore"
import { addMemberToTrip } from "../../../utilities/TripUtilities"
import { AddMemberType } from "@/src/types/DataTypes"

export interface Invite {
  inviteId: string
  tripId: string
  createdById: string
  createdByName: string
  createdAt: Timestamp
  acceptedBy?: Record<string, Timestamp>
}

/**
 * Generate a new invite in Firestore and return its ID.
 */
export async function createInvite(tripId: string, createdBy: { id: string; name: string }): Promise<string> {
  const ref = await addDoc(collection(db, "invites"), {
    tripId,
    createdById: createdBy.id,
    createdByName: createdBy.name,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

/**
 * Fetch the invite doc and return its data.
 */
export async function getInvite(inviteId: string): Promise<Invite> {
  const ref = doc(db, "invites", inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Invalid or expired invite link.")
  return { inviteId: snap.id, ...(snap.data() as any) }
}

/**
 * Accept an invite: add the current user to the trip's members, and mark the invite accepted.
 * Returns the tripId so the caller can navigate there.
 */
export async function acceptInvite(
  inviteId: string,
  user: { id: string; name: string },
  mockUserId?: string
): Promise<{ tripId: string; shouldShowChooseModal: boolean }> {
  const invite = await getInvite(inviteId)
  
  // If this is a mock user claim, process it directly
  if (mockUserId) {
    // Get trip reference to fetch mock user data
    const tripRef = doc(db, "trips", invite.tripId)
    const tripSnap = await getDoc(tripRef)
    const tripData = tripSnap.data()
    
    if (tripData?.members?.[mockUserId]) {
      const mockUser = tripData.members[mockUserId]
      const initialBudget = mockUser.budget || 0
      
      // Remove the mock user from the trip
      const updatedMembers = { ...tripData.members }
      delete updatedMembers[mockUserId]
      await updateDoc(tripRef, { members: updatedMembers })

      // Add the real user
      await addMemberToTrip(
        invite.tripId,
        user.id,
        {
          name: user.name,
          budget: initialBudget,
          addMemberType: AddMemberType.INVITE_LINK
        }
      )
      // Add tripId to user's trips array
      const userDocRef = doc(db, "users", user.id)
      await updateDoc(userDocRef, {
        trips: arrayUnion(invite.tripId)
      })
    }

    // Mark invite as accepted
    await updateDoc(doc(db, "invites", inviteId), {
      [`acceptedBy.${user.id}`]: Timestamp.now(),
    })

    return { tripId: invite.tripId, shouldShowChooseModal: false }
  }

  // For regular invites, we'll show the choose modal
  // Add tripId to user's trips array here as well
  const userDocRef = doc(db, "users", user.id)
  await updateDoc(userDocRef, {
    trips: arrayUnion(invite.tripId)
  })

  return { tripId: invite.tripId, shouldShowChooseModal: true }
}
