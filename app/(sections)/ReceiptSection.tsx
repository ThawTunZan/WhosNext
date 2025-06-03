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
  useTheme,
} from "react-native-paper"
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import { useUser } from "@clerk/clerk-expo"
import { Redirect } from "expo-router"
import { db } from "@/firebase"
import { useMemberProfiles } from "@/src/context/MemberProfilesContext"
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
import { deleteReceipt } from "@/src/utilities/ReceiptUtilities"
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
  createdById?: string
  paidById: string
}
type Expense = { id: string; activityName: string, paidById?: string }

export default function ReceiptSection({ tripId }: Props) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const { isLoaded, isSignedIn, user } = useUser()
  const profiles = useMemberProfiles()

  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />
  const currentUserId = user.id
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
        paidById: (d.data() as any).paidById as string,
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
      
      if (!expense?.paidById) {
        throw new Error("Could not find who paid for this expense")
      }

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
        createdById: currentUserId,
        paidById: expense.paidById
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
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { backgroundColor: theme.colors.background }
      ]}
    >
      <Text style={[styles.header, { color: theme.colors.text }]}>
        📸 Receipts
      </Text>

      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.uploadBtn}
      >
        Add Receipt
      </Button>

      {receipts.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
          No receipts uploaded yet
        </Text>
      ) : (
        receipts.map((receipt) => (
          <Card 
            key={receipt.id} 
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Title
              title={receipt.expenseName || "Unlinked Receipt"}
              titleStyle={{ color: theme.colors.text }}
              subtitle={`Paid by: ${profiles[receipt.paidById] || "Unknown"}`}
              subtitleStyle={{ color: theme.colors.subtext }}
            />
            <Card.Content>
              <Image
                source={{ uri: receipt.url }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={() => handleDelete(receipt)}
                mode="outlined"
                loading={loading}
              >
                Delete
              </Button>
            </Card.Actions>
          </Card>
        ))
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false)
            setPickedImageUri(null)
            setSelectedExpense(null)
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Add Receipt
          </Text>

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Link to Expense (Optional)
            </Text>
            <View style={[
              styles.pickerWrapper, 
              { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border 
              }
            ]}>
              <Picker
                selectedValue={selectedExpense}
                onValueChange={setSelectedExpense}
                style={[styles.picker, { color: theme.colors.text }]}
                dropdownIconColor={theme.colors.text}
              >
                <Picker.Item label="Select an expense..." value={null} />
                {availableExpenses.map((expense) => (
                  <Picker.Item
                    key={expense.id}
                    label={expense.activityName}
                    value={expense.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {pickedImageUri ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: pickedImageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <Button
                onPress={() => setPickedImageUri(null)}
                mode="outlined"
                style={styles.removeBtn}
              >
                Remove
              </Button>
            </View>
          ) : (
            <View style={styles.buttonGroup}>
              <Button
                mode="outlined"
                onPress={pickFromLibrary}
                style={styles.pickBtn}
                icon="image"
              >
                Gallery
              </Button>
              <Button
                mode="outlined"
                onPress={pickFromCamera}
                style={styles.pickBtn}
                icon="camera"
              >
                Camera
              </Button>
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              onPress={() => {
                setModalVisible(false)
                setPickedImageUri(null)
                setSelectedExpense(null)
              }}
              mode="outlined"
            >
              Cancel
            </Button>
            <Button
              onPress={saveReceipt}
              mode="contained"
              loading={loading}
              disabled={!pickedImageUri}
            >
              Upload
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  uploadBtn: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontStyle: 'italic',
  },
  card: {
    marginBottom: 16,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    marginVertical: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  removeBtn: {
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pickBtn: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

