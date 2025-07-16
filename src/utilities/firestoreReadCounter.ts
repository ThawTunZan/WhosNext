// src/utils/firestoreReadCounter.ts
let firestoreReadCount = 0;

export function incrementFirestoreRead(count: number = 1) {
  firestoreReadCount += count;
  console.log(`[FirestoreReadCounter] Reads incremented by ${count}, total: ${firestoreReadCount}`);
}

export function getFirestoreReadCount() {
  return firestoreReadCount;
}

export function resetFirestoreReadCount() {
  firestoreReadCount = 0;
}