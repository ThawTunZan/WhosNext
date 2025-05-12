import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Constants from 'expo-constants';

const {
  CLOUDINARY_URL,
  UPLOAD_PRESET
} = Constants.expoConfig?.extra ?? {};

// --- Upload Function ---
export const pickAndUploadReceipt = async (): Promise<{ url: string; public_id: string } | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result.canceled) return null;

  const image = result.assets[0];
  const formData = new FormData();

  const response = await fetch(image.uri);
  const blob = await response.blob();

  formData.append("file", blob, "receipt.jpg");
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "receipts/");

  try {
    const res = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      url: res.data.secure_url,
      public_id: res.data.public_id, // Required for deletion later
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

// --- Delete Function ---
export const deleteReceipt = async (public_id: string): Promise<boolean> => {
  try {
    const res = await fetch("https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/deleteCloudinaryImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id }),
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return false;
  }
};
