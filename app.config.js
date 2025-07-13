import 'dotenv/config';

export default {
  expo: {
    name: "whosnext",
    slug: "whosnext",
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
  },
  plugins: [
    "expo-router",
    "expo-barcode-scanner"
  ],
  userInterfaceStyle: "automatic",
  scheme: "whosnext", 
};
