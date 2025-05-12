import React, { useState, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet, Alert } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { pickAndUploadReceipt } from "@/src/services/cloudinaryService";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { deleteReceipt } from "@/src/services/receiptService";


type Props = {
  tripId: string;
};

type Receipt = {
  id: string;
  url: string;
  public_id: string;
};

const ReceiptSection: React.FC<Props> = ({ tripId }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReceipts = async () => {
    const q = query(collection(db, "receipts"), where("tripId", "==", tripId));
    const snapshot = await getDocs(q);
    const list: Receipt[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      url: doc.data().url,
      public_id: doc.data().public_id,
    }));
    setReceipts(list);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleUpload = async () => {
    setLoading(true);
    const result = await pickAndUploadReceipt();
    if (result && result.url && result.public_id) {
      try {
        const newDoc = await addDoc(collection(db, "receipts"), {
          tripId,
          url: result.url,
          public_id: result.public_id,
          createdAt: new Date(),
        });
        setReceipts((prev) => [
          { id: newDoc.id, url: result.url, public_id: result.public_id },
          ...prev,
        ]);
        Alert.alert("Success", "Receipt uploaded.");
      } catch (err) {
        console.error("Firestore save error:", err);
        Alert.alert("Upload failed", "Could not save to Firestore.");
      }
    } else {
      Alert.alert("Upload failed", "No image was uploaded.");
    }
    setLoading(false);
  };

  const handleDelete = async (receipt: Receipt) => {
    setLoading(true);
    const confirmed = await deleteReceipt(receipt.public_id);
    if (confirmed) {
      await deleteDoc(doc(db, "receipts", receipt.id));
      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
      Alert.alert("Deleted", "Receipt and image removed.");
    } else {
      Alert.alert("Error", "Failed to delete from Cloudinary.");
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        mode="contained"
        onPress={handleUpload}
        loading={loading}
        style={styles.uploadBtn}
      >
        Upload Receipt
      </Button>

      {receipts.length === 0 ? (
        <Text style={styles.emptyText}>No receipts uploaded yet.</Text>
      ) : (
        receipts.map((receipt) => (
          <Card key={receipt.id} style={styles.card}>
            <Image
              source={{ uri: receipt.url }}
              style={styles.image}
              resizeMode="contain"
            />
            <Button
              onPress={() => handleDelete(receipt)}
              mode="outlined"
              style={styles.deleteBtn}
            >
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
