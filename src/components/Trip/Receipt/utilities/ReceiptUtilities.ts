import { getStorage, ref, deleteObject } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { PremiumStatus, TripsTableDDB } from '@/src/types/DataTypes';

export type Receipt = {
  id: string;
  url: string;
  path: string;
  expenseId?: string;
  expenseName?: string;
  createdAt?: Timestamp;
  createdByName?: string;
  paidById: string;
};

/**
 * Deletes a receipt image from Firebase Storage using its full path.
 * @param path The full storage path: receipts/{tripId}/{fileId}.jpg
 * @returns true if successful, false if failed
 */
export async function deleteReceipt(path: string): Promise<boolean> {
  const storage = getStorage();
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.error("Failed to delete receipt from Firebase Storage:", err);
    return false;
  }
}

// --- AsyncStorage helpers for local receipts ---
const localReceiptsKey = (tripId: string, username: string) => `receipts_${tripId}_${username}`;

export async function getLocalReceipts(tripId: string, username: string): Promise<Receipt[]> {
  try {
    const data = await AsyncStorage.getItem(localReceiptsKey(tripId, username));
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load local receipts:', err);
    return [];
  }
}

export async function saveLocalReceipt(tripId: string, username: string, receipt: Receipt): Promise<void> {
  const receipts = await getLocalReceipts(tripId, username);
  receipts.push(receipt);
  await AsyncStorage.setItem(localReceiptsKey(tripId, username), JSON.stringify(receipts));
}

export async function deleteLocalReceipt(tripId: string, username: string, receiptId: string): Promise<void> {
  const receipts = await getLocalReceipts(tripId, username);
  const filtered = receipts.filter(r => r.id !== receiptId);
  await AsyncStorage.setItem(localReceiptsKey(tripId, username), JSON.stringify(filtered));
}

// --- Firestore helpers for cloud receipts ---
export async function getCloudReceipts(tripId: string): Promise<Receipt[]> {
  const q = query(collection(db, "receipts"), where("tripId", "==", tripId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Receipt));
}

export async function saveCloudReceipt(tripId: string, receipt: Omit<Receipt, 'id'>): Promise<void> {
  await addDoc(collection(db, "receipts"), { ...receipt, tripId });
}

export async function deleteCloudReceipt(receiptId: string, path: string): Promise<void> {
  await deleteReceipt(path);
  await deleteDoc(doc(db, "receipts", receiptId));
}

// --- Trip type check ---
export function isCloudTrip(premiumStatus: string): boolean {
  return premiumStatus === PremiumStatus.PREMIUM || premiumStatus === PremiumStatus.TRIAL;
}
