/*
import React from "react";
import { Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { uploadReceipt } from "@/src/services/receiptService";
import { Alert } from "react-native";

type Props = {
  tripId: string;
  expenseId: string; // or prompt user later
};

export default function UploadReceiptButton({ tripId, expenseId }: Props) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        const downloadURL = await uploadReceipt(result.assets[0].uri, tripId, expenseId);
        Alert.alert("Success", "Receipt uploaded.");
        // Optionally: store downloadURL in Firestore or state
      } catch (err) {
        Alert.alert("Upload failed", "Something went wrong.");
      }
    }
  };

  return (
    <Button mode="contained" onPress={pickImage}>
      Upload Receipt
    </Button>
  );
}
*/