// src/services/receiptService.ts (Native Firebase version)
import storage from '@react-native-firebase/storage';

/**
 * Deletes a receipt image from Firebase Storage using its full path.
 * @param path The full storage path: receipts/{tripId}/{fileId}.jpg
 * @returns true if successful, false if failed
 */
export async function deleteReceipt(path: string): Promise<boolean> {
  const storageRef = storage().ref(path);

  try {
    await storageRef.delete();
    return true;
  } catch (err) {
    console.error("Failed to delete receipt from Firebase Storage:", err);
    return false;
  }
}
