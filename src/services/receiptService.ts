import { getStorage, ref, deleteObject } from "firebase/storage";

// Delete file from Firebase Storage
export const deleteReceipt = async (path: string): Promise<boolean> => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.error("Firebase delete error:", err);
    return false;
  }
};
