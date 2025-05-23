import { getStorage, ref, deleteObject } from "firebase/storage";

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
