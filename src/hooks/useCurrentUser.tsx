import { DUMMY_USER_ID, DUMMY_USER_NAME, DUMMY_USER_EMAIL } from '@/src/constants/auth';

export function useCurrentUser() {
      return {
    id: DUMMY_USER_ID,
    name: DUMMY_USER_NAME,
    email: DUMMY_USER_EMAIL,
    // Add `photoURL` later if needed
  };
}