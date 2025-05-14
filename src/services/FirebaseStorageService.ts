import * as ImagePicker from "expo-image-picker";
import storage from "@react-native-firebase/storage";
import uuid from "react-native-uuid";

export async function pickAndUploadReceipt(tripId: string) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result.canceled) return null;

  const image = result.assets[0];
  const fileId = `${uuid.v4()}.jpg`;
  const path = `receipts/${tripId}/${fileId}`;
  const reference = storage().ref(path);

  try {
    const response = await fetch(image.uri);
    const blob = await response.blob();

    await reference.put(blob);
    const url = await reference.getDownloadURL();

    return { url, path };
  } catch (err) {
    console.error("Native Firebase upload error:", err);
    return null;
  }
}
