import React, { useState, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet, Alert } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { uploadReceipt } from "@/src/services/receiptService";
import { getStorage, listAll, ref, getDownloadURL } from "firebase/storage";

type Props = {
  tripId: string;
};

const ReceiptSection: React.FC<Props> = ({ tripId }) => {
  const [receiptURLs, setReceiptURLs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReceipts = async () => {
    try {
      const storage = getStorage();
      const folderRef = ref(storage, `receipts/${tripId}`);
      const res = await listAll(folderRef);

      const urls = await Promise.all(res.items.map(item => getDownloadURL(item)));
      setReceiptURLs(urls);
    } catch (err) {
      console.error("Failed to fetch receipts:", err);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

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
        setLoading(true);
        const imageURI = result.assets[0].uri;
        const expenseId = `manual_${Date.now()}`; // You can generate smarter keys if needed
        await uploadReceipt(imageURI, tripId, expenseId);
        await fetchReceipts(); // Refresh after upload
        Alert.alert("Success", "Receipt uploaded.");
      } catch (err) {
        console.error("Upload error:", err);
        Alert.alert("Upload failed", "An error occurred during upload.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" onPress={pickImage} loading={loading} style={styles.uploadBtn}>
        Upload New Receipt
      </Button>

      {receiptURLs.length === 0 ? (
        <Text style={styles.emptyText}>No receipts uploaded yet.</Text>
      ) : (
        receiptURLs.map((url, idx) => (
          <Card key={idx} style={styles.card}>
            <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
