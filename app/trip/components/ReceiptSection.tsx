import React, { useState, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet, Alert } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { pickAndUploadReceipt } from "@/src/services/FirebaseStorageService";
import { db } from "@/firebase";
import {collection,addDoc,getDocs,query,where,deleteDoc,doc,Timestamp} from "firebase/firestore";
import { deleteReceipt } from "@/src/services/receiptService";
import {DUMMY_USER_ID, DUMMY_USER_NAME} from '@/src/constants/auth';

type Props = {
  tripId: string;
};

type Receipt = {
  id: string;
  url: string;
  path: string;
  createdAt?: Timestamp;
  createdBy?: string;
  createdByName?: string;
};

const ReceiptSection: React.FC<Props> = ({ tripId }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);


  const fetchReceipts = async () => {
    const q = query(collection(db, "receipts"), where("tripId", "==", tripId));
    const snapshot = await getDocs(q);
    const list: Receipt[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url,
        path: data.path,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
      };
    });
    setReceipts(list);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleUpload = async () => {
    setLoading(true);
    const result = await pickAndUploadReceipt(tripId);
    if (result && result.url && result.path) {
      const newDoc = await addDoc(collection(db, "receipts"), {
        tripId,
        url: result.url,
        path: result.path,
        createdAt: new Date(),
        createdBy: DUMMY_USER_ID,
        createdByName: DUMMY_USER_NAME
      });
      setReceipts((prev) => [
        { id: newDoc.id, url: result.url, path: result.path },
        ...prev,
      ]);
    }

    setLoading(false);
  };

  const handleDelete = async (receipt: Receipt) => {
    setLoading(true);
    const confirmed = await deleteReceipt(receipt.path);
    if (confirmed) {
      await deleteDoc(doc(db, "receipts", receipt.id));
      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
      Alert.alert("Deleted", "Receipt and image removed.");
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
            <Card.Content>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Uploaded by {receipt.createdByName || "Unknown"} on{" "}
                {receipt.createdAt?.toDate().toLocaleString() || "Unknown time"}
              </Text>
            </Card.Content>
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
