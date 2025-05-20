// src/screens/TripDetails/components/ReceiptSection.tsx
import React, { useState, useEffect } from "react"
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from "react-native"
import {
  Button,
  Card,
  Text,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import { useUser } from "@clerk/clerk-expo"
import { Redirect } from "expo-router"
import { db } from "@/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import { pickAndUploadReceipt } from "@/src/services/FirebaseStorageService"
import { deleteReceipt } from "@/src/services/receiptService"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Types
type Props = { tripId: string }
type Receipt = {
  id: string
  url: string
  path: string
  expenseId?: string
  expenseName?: string
  createdAt?: Timestamp
  createdByName?: string
  paidByName: string
}
type Expense = { id: string; activityName: string, paidByName?: string }

export default function ReceiptSection({ tripId }: Props) {

  const { isLoaded, isSignedIn, user } = useUser()
  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />
  const currentUserName =
    user.fullName ??
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()

  // State
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null)
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null)

  // Fetch receipts & expenses
  const fetchReceipts = async () => {
    const q = query(collection(db, "receipts"), where("tripId", "==", tripId))
    const snap = await getDocs(q)
    setReceipts(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Receipt))
    )
  }

  const fetchExpenses = async () => {
    const q = query(
      collection(db, "trips", tripId, "expenses")
    )
    const snap = await getDocs(q)
    setExpenses(
      snap.docs.map((d) => ({
        id: d.id,
        activityName: (d.data() as any).activityName as string,
        paidByName: (d.data() as any).paidBy as string,
      }))
    )
  }

  useEffect(() => {
    fetchReceipts()
    fetchExpenses()
  }, [])

  // Filter out expenses that already have a receipt
  const availableExpenses = expenses.filter(
    (e) => !receipts.some((r) => r.expenseId === e.id)
  )

  // Image pickers
  const pickFromLibrary = async () => {
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })
    if (!canceled) setPickedImageUri(assets[0].uri)
  }

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed.")
      return
    }
    const { assets, canceled } = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })
    if (!canceled) setPickedImageUri(assets[0].uri)
  }

  // Save new receipt
  const saveReceipt = async () => {
    if (!pickedImageUri || !selectedExpense) {
      Alert.alert("Missing data", "Please pick an image and expense.")
      return
    }
    setLoading(true)
    try {
      const expense = expenses.find((e) => e.id === selectedExpense)
      const expenseName = expense?.activityName ?? "Unknown"
      const paidByName = expense?.paidByName ?? "Unknown"
      // Fetch blob
      const resp = await fetch(pickedImageUri)
      const blob = await resp.blob()

      // Upload to Storage
      const storage = getStorage()
      const fileRef = ref(
        storage,
        `receipts/${tripId}/${Date.now()}_${Math.random()}.jpg`
      )
      await uploadBytes(fileRef, blob)
      const url = await getDownloadURL(fileRef)

      // Write Firestore doc with expenseId
      await addDoc(collection(db, "receipts"), {
        tripId,
        expenseName: expenseName,
        expenseId: selectedExpense,
        url,
        path: fileRef.fullPath,
        createdAt: Timestamp.now(),
        createdByName: currentUserName,
        paidByName: paidByName
      })

      // Refresh lists
      await fetchReceipts()
      setModalVisible(false)
      setPickedImageUri(null)
      setSelectedExpense(null)
    } catch (err) {
      console.error(err)
      Alert.alert("Upload failed", (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Delete
  const handleDelete = async (receipt: Receipt) => {
    setLoading(true)
    const ok = await deleteReceipt(receipt.path)
    if (ok) {
      await deleteDoc(doc(db, "receipts", receipt.id))
      fetchReceipts()
    }
    setLoading(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.uploadBtn}
      >
        Add Receipt
      </Button>

      {receipts.length === 0 ? (
        <Text style={styles.emptyText}>No receipts yet.</Text>
      ) : (
        receipts.map((r) => (
          
          <Card key={r.id} style={styles.card}>
            <Image
              source={{ uri: r.url }}
              style={styles.image}
              resizeMode="contain"
            />
            <Card.Content>
              <Text>Expense: {r.expenseName}</Text>
              <Text>Uploaded by {r.createdByName}</Text>
              <Text>Paid by: {r.paidByName}</Text>
              <Text>
                {r.createdAt?.toDate().toLocaleDateString()}
              </Text>
            </Card.Content>
            <Button
              onPress={() => handleDelete(r)}
              mode="outlined"
              disabled={loading}
              style={styles.deleteBtn}
            >
              Delete
            </Button>
          </Card>
        ))
      )}

      {/* Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Attach Receipt
          </Text>

          {/* Picker */}
          <TextInput
            label="Select Expense"
            value={selectedExpense ?? ""}
            mode="outlined"
            style={{ marginBottom: 12 }}
            render={(props) => (
              <Picker
                selectedValue={selectedExpense}
                onValueChange={(v) => setSelectedExpense(v)}
                style={{ width: "100%", height: 50 }}
              >
                <Picker.Item label="— Choose —" value={null} />
                {availableExpenses.map((e) => (
                  <Picker.Item
                    key={e.id}
                    label={e.activityName}
                    value={e.id}
                  />
                ))}
              </Picker>
            )}
          />

          {/* Image Preview */}
          {pickedImageUri && (
            <Image
              source={{ uri: pickedImageUri }}
              style={{ width: "100%", height: 200, marginBottom: 12 }}
            />
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Button
              icon="image"
              mode="outlined"
              onPress={pickFromLibrary}
            >
              Library
            </Button>
            <Button icon="camera" mode="outlined" onPress={pickFromCamera}>
              Camera
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={saveReceipt}
            loading={loading}
            style={{ marginTop: 16 }}
          >
            Save
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  uploadBtn: {
    marginBottom: 16,
    width: "100%",
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: "#6c757d",
  },
  card: {
    marginBottom: 12,
    width: "100%",
  },
  image: {
    width: "100%",
    height: 200,
  },
  deleteBtn: {
    alignSelf: "flex-end",
    margin: 8,
  },
  modal: {
    backgroundColor: "white",
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
})

