import Constants from 'expo-constants';

const {
  FIREBASE_PROJECT_ID
} = Constants.expoConfig?.extra ?? {};

const functionURL = `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net/deleteCloudinaryImage`;

export const deleteReceipt = async (public_id: string): Promise<boolean> => {
  try {
    const res = await fetch(functionURL, {
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
