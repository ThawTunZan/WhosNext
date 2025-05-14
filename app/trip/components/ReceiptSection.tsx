import React, { useState, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet, Alert } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { pickAndUploadReceipt } from "@/src/services/FirebaseStorageService";
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { deleteReceipt } from "@/src/services/receiptService";
import * as ImagePicker from "expo-image-picker";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import uuid from "react-native-uuid";
import storage from "@react-native-firebase/storage";

type Props = {
  tripId: string;
};

type Receipt = {
  id: string;
  url: string;
  path: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  createdBy?: string;
  createdByName?: string;
};

const ReceiptSection: React.FC<Props> = ({ tripId }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const { id: currUserId, name: currUsername } = useCurrentUser();

  const fetchReceipts = async () => {
    const snapshot = await firestore()
      .collection("receipts")
      .where("tripId", "==", tripId)
      .get();

    const list: Receipt[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Receipt[];

    setReceipts(list);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleUpload = async () => {
    setLoading(true);
    const result = await pickAndUploadReceipt(tripId);
    if (result?.url && result?.path) {
      const newDoc = await firestore().collection("receipts").add({
        tripId,
        url: result.url,
        path: result.path,
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: currUserId,
        createdByName: currUsername,
      });
      setReceipts((prev) => [
        {
          id: newDoc.id,
          url: result.url,
          path: result.path,
          createdBy: currUserId,
          createdByName: currUsername,
        },
        ...prev,
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (receipt: Receipt) => {
    setLoading(true);
    const confirmed = await deleteReceipt(receipt.path);
    if (confirmed) {
      await firestore().collection("receipts").doc(receipt.id).delete();
      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
      Alert.alert("Deleted", "Receipt and image removed.");
    }
    setLoading(false);
  };

  const handleCameraUpload = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const fileId = `${uuid.v4()}.jpg`;
      const path = `receipts/${tripId}/${fileId}`;
      const reference = storage().ref(path);

      try {
        await reference.put(blob);
        const url = await reference.getDownloadURL();

        const newDoc = await firestore().collection("receipts").add({
          tripId,
          url,
          path,
          createdAt: firestore.FieldValue.serverTimestamp(),
          createdBy: currUserId,
          createdByName: currUsername,
        });

        setReceipts((prev) => [
          {
            id: newDoc.id,
            url,
            path,
            createdBy: currUserId,
            createdByName: currUsername,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Camera upload error:", err);
      }
    }

    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" onPress={handleUpload} loading={loading} style={styles.uploadBtn}>
        Upload Receipt
      </Button>
      <Button
        mode="outlined"
        onPress={handleCameraUpload}
        loading={loading}
        style={[styles.uploadBtn, { marginBottom: 12 }]}
      >
        Take Photo
      </Button>

      {receipts.length === 0 ? (
        <Text style={styles.emptyText}>No receipts uploaded yet.</Text>
      ) : (
        receipts.map((receipt) => (
          <Card key={receipt.id} style={styles.card}>
            <Image source={{ uri: receipt.url }} style={styles.image} resizeMode="contain" />
            <Card.Content>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Uploaded by {receipt.createdByName || "Unknown"} on{" "}
                {receipt.createdAt?.toDate().toLocaleString() || "Unknown time"}
              </Text>
            </Card.Content>
            <Button onPress={() => handleDelete(receipt)} mode="outlined" style={styles.deleteBtn}>
              Delete
            </Button>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  deleteBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadBtn: {
    marginBottom: 16,
    alignSelf: "stretch",
  },
  card: {
    width: "100%",
    marginBottom: 12,
    padding: 10,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: "#6c757d",
  },
});

export default ReceiptSection;
