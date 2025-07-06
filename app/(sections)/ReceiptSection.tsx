// src/screens/TripDetails/components/ReceiptSection.tsx
import React, { useState, useEffect } from "react"
import {
  View,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native"
import {
  Button,
  Text,
  TextInput,
} from "react-native-paper"
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/app/styles/section_comp_styles';
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
import { deleteReceipt } from "@/src/TripSections/Receipt/utilities/ReceiptUtilities"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { BaseSection } from '@/app/common_components/BaseSection';
import { CommonModal } from '@/app/common_components/CommonModal';
import { CommonCard } from '@/app/common_components/CommonCard';

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
        // TODO
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

  const renderReceiptsList = () => {
    if (receipts.length === 0) {
      return (
        <Text style={[sectionStyles.errorText, { color: theme.colors.subtext, textAlign: 'center', padding: 20 }]}>
          No receipts uploaded yet
        </Text>
      );
    }

    return receipts.map((receipt) => (
      <CommonCard
        key={receipt.id}
        title={receipt.expenseName || "Unlinked Receipt"}
        subtitle={`Paid by: ${profiles[receipt.paidById] || "Unknown"}`}
        leftIcon="receipt"
        actions={
          <Button
            onPress={() => handleDelete(receipt)}
            mode="outlined"
            loading={loading}
            icon="delete"
          >
            Delete
          </Button>
        }
      >
        <Image
          source={{ uri: receipt.url }}
          style={{ width: '100%', height: 200, marginVertical: 8 }}
          resizeMode="contain"
        />
      </CommonCard>
    ));
  };

  const renderModalContent = () => (
    <View>
      <View style={{ marginBottom: 16 }}>
        <Text style={[{ color: theme.colors.text, marginBottom: 8 }]}>
          Link to Expense (Optional)
        </Text>
        <View style={[
          { 
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.outline,
            borderWidth: 1,
            borderRadius: 4,
            overflow: 'hidden'
          }
        ]}>
          <Picker
            selectedValue={selectedExpense}
            onValueChange={setSelectedExpense}
            style={[{ color: theme.colors.text }]}
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
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={{ uri: pickedImageUri }}
            style={{ width: '100%', height: 200, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Button
            onPress={() => setPickedImageUri(null)}
            mode="outlined"
          >
            Remove
          </Button>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <Button
            mode="outlined"
            onPress={pickFromLibrary}
            style={{ flex: 1, marginHorizontal: 8 }}
            icon="image"
          >
            Gallery
          </Button>
          <Button
            mode="outlined"
            onPress={pickFromCamera}
            style={{ flex: 1, marginHorizontal: 8 }}
            icon="camera"
          >
            Camera
          </Button>
        </View>
      )}
    </View>
  );

  return (
    <BaseSection
      title="Receipts"
      icon="📸"
      keyboardAvoiding={false}
    >
      <ScrollView style={{ flex: 1 }}>
        <Button
          mode="contained"
          onPress={() => setModalVisible(true)}
          style={sectionStyles.actionButton}
          icon="plus"
        >
          Add Receipt
        </Button>

        {renderReceiptsList()}
      </ScrollView>

      <CommonModal
        visible={modalVisible}
        onDismiss={() => {
          setModalVisible(false)
          setPickedImageUri(null)
          setSelectedExpense(null)
        }}
        title="Add Receipt"
        onSubmit={saveReceipt}
        submitLabel="Upload"
        loading={loading}
        submitDisabled={!pickedImageUri}
      >
        {renderModalContent()}
      </CommonModal>
    </BaseSection>
  );
}

