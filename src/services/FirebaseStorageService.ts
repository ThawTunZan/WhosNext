import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import uuid from "react-native-uuid"; // Make sure to install: npm install react-native-uuid

export async function pickAndUploadReceipt(tripId: string) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result.canceled) return null;

  const image = result.assets[0];
  const response = await fetch(image.uri);
  const blob = await response.blob();

  const storage = getStorage();
  const fileId = `${uuid.v4()}.jpg`;
  const path = `receipts/${tripId}/${fileId}`;
  const storageRef = ref(storage, path);

  try {
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return { url, path };
  } catch (err) {
    console.error("Firebase upload error:", err);
    return null;
  }
};
