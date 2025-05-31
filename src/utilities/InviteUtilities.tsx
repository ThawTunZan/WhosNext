// src/services/InviteUtilities.ts
import { db } from "../../firebase"
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore"
import { addMemberToTrip } from "./TripUtilities"

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
  user: { id: string; name: string }
): Promise<string> {
  const invite = await getInvite(inviteId)
  // 1) add this user to the trip
  await addMemberToTrip(
    invite.tripId,
    user.id,
    {
      name: user.name,
      budget: 0,
      addMemberType: "invite link"
    }
  )
  // 2) mark accepted on the invite (optional)
  await updateDoc(doc(db, "invites", inviteId), {
    [`acceptedBy.${user.id}`]: Timestamp.now(),
  })
  return invite.tripId
}
