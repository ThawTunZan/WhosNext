import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserDDB } from '@/src/types/DataTypes';

/**
 * Mirrors a Clerk user into Firestore, but only creates if missing.
 * Does NOT update anything if the doc already exists.
 */
export async function upsertUserFromClerk(clerkUser: UserDDB): Promise<boolean> {
  const ref = doc(db, 'users', clerkUser.id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, clerkUser);
    console.log('[FirebaseUserService] Created user:', ref.path);
    return true;
  } else {
    console.log('[FirebaseUserService] User already exists, skipping update.');
    return false;
  }
}

