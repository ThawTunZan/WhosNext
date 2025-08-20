// src/screens/TripDetails/components/ReceiptSection.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  Image,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Button,
  Text,
} from "react-native-paper";
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/src/styles/section_comp_styles';
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Timestamp, getDoc, doc } from "firebase/firestore";
import { BaseSection } from '@/src/components/Common/BaseSection';
import { CommonModal } from '@/src/components/Common/CommonModal';
import { CommonCard } from '@/src/components/Common/CommonCard';
import { useUserTripsContext } from '@/src/context/UserTripsContext';
import {
  getLocalReceipts,
  saveLocalReceipt,
  deleteLocalReceipt,
  getCloudReceipts,
  saveCloudReceipt,
  deleteCloudReceipt,
  isCloudTrip,
  Receipt as ReceiptType,
} from '@/src/components/Trip/Receipt/utilities/ReceiptUtilities';
import { MaterialIcons } from '@expo/vector-icons';

// Types
import { PremiumStatus } from '@/src/types/DataTypes';

type Props = { tripId: string }

export default function ReceiptSection({ tripId }: Props) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { isLoaded, isSignedIn, user } = useUser();
  const { trips, expensesByTripId } = useUserTripsContext();
  const expenses = expensesByTripId[tripId]
  // Derive tripInfo from context
  const tripInfo = useMemo(() => {
    return trips.find((t: any) => t.tripId === tripId) || null;
  }, [trips, tripId]);

  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<string>("");
  const [upsellVisible, setUpsellVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  const currentUsername = user.username;

  // Fetch receipts (local or cloud)
  useEffect(() => {
    if (!tripInfo) return;
    async function fetchReceipts() {
      setLoading(true);
      try {
        if (tripInfo.isTripPremium) {
          setReceipts(await getCloudReceipts(tripId));
        } else {
          setReceipts(await getLocalReceipts(tripId, currentUsername));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, [tripId, tripInfo, currentUsername]);

  // Filter out expenses that already have a receipt
  const availableExpenses = useMemo(() => {
    return (expenses || []).filter(
    (e) => !receipts.some((r) => r.expenseId === e.expenseId)
    );
  }, [expenses, receipts]);

  // Effect to keep selectedExpense in sync with availableExpenses
  useEffect(() => {
    if (
      selectedExpense !== "" &&
      !availableExpenses.some((e) => e.expenseId === selectedExpense)
    ) {
      setSelectedExpense("");
    }
  }, [availableExpenses, selectedExpense]);

  // Image pickers
  const pickFromLibrary = async () => {
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!canceled) setPickedImageUri(assets[0].uri);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }
    const { assets, canceled } = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!canceled) setPickedImageUri(assets[0].uri);
  };

  // Save new receipt
  const saveReceipt = async (mode: 'local' | 'cloud') => {
    if (!pickedImageUri) {
      Alert.alert("Missing data", "Please pick an image.");
      return;
    }
    if (!tripInfo) return;
    setLoading(true);
    try {
      let url = pickedImageUri;
      let path = '';
      let expenseName = '';
      let paidById = currentUsername;
      let expenseId = selectedExpense || undefined;
      let createdAt = Timestamp.now();
      let createdByName = currentUsername;
      if (expenseId) {
        const expense = expenses.find((e) => e.expenseId === expenseId);
        expenseName = expense?.activityName ?? '';
        paidById = expense?.paidById ?? currentUsername;
      }
      if (mode === 'cloud') {
        // Cloud upload (only for premium/trial)
        const resp = await fetch(pickedImageUri);
        const blob = await resp.blob();
        const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
        const storage = getStorage();
        const fileRef = ref(storage, `receipts/${tripId}/${Date.now()}_${Math.random()}.jpg`);
        await uploadBytes(fileRef, blob);
        url = await getDownloadURL(fileRef);
        path = fileRef.fullPath;
        await saveCloudReceipt(tripId, {
          url,
          path,
          expenseId,
          expenseName,
          createdAt,
          createdByName,
          paidById,
        });
        setReceipts(await getCloudReceipts(tripId));
      } else {
        // Local upload (always allowed)
        path = pickedImageUri;
        const localReceipt = {
          id: `${Date.now()}_${Math.random()}`,
          url,
          path,
          expenseId,
          expenseName,
          createdAt,
          createdByName,
          paidById,
        };
        await saveLocalReceipt(tripId, currentUsername, localReceipt);
        setReceipts(await getLocalReceipts(tripId, currentUsername));
      }
      setModalVisible(false);
      setPickedImageUri(null);
      setSelectedExpense(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Upload failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (receipt: ReceiptType) => {
    setLoading(true);
    try {
      if (!tripInfo) return;
      if (tripInfo.isTripPremium) {
        await deleteCloudReceipt(receipt.id, receipt.path);
        setReceipts(await getCloudReceipts(tripId));
      } else {
        await deleteLocalReceipt(tripId, currentUsername, receipt.id);
        setReceipts(await getLocalReceipts(tripId, currentUsername));
      }
    } finally {
      setLoading(false);
    }
  };

  // Upsell modal content
  const renderUpsellModal = () => (
    <CommonModal
      visible={upsellVisible}
      onDismiss={() => setUpsellVisible(false)}
      title="Upgrade to Premium"
      onSubmit={() => setUpsellVisible(false)}
      submitLabel="OK"
      loading={false}
      submitDisabled={false}
    >
      <Text style={{ textAlign: 'center', marginVertical: 16 }}>
        Upgrade to Premium to share receipts with your trip members and store them securely in the cloud!
      </Text>
    </CommonModal>
  );

  // Render receipts list
  const renderReceiptsList = () => {
    if (receipts.length === 0) {
      return (
        <Text style={[sectionStyles.errorText, { color: theme.colors.subtext, textAlign: 'center', padding: 20 }]}>No receipts uploaded yet</Text>
      );
    }
    return receipts.map((receipt) => {
      const isCloud = !!receipt.id && !!receipt.path && receipt.path.startsWith('receipts/');
      return (
      <CommonCard
        key={receipt.id}
          title={receipt.expenseName || "Receipt"}
          subtitle={`By: ${receipt.createdByName || "Unknown"}  |  ${receipt.createdAt ? new Date(receipt.createdAt.seconds * 1000).toLocaleDateString() : ''}`}
        leftIcon="receipt"
        actions={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: isCloud ? theme.colors.primary : theme.colors.outline,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginRight: 8,
              }}>
                <Text style={{ color: isCloud ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: 'bold' }}>{isCloud ? 'Cloud' : 'Local'}</Text>
              </View>
          <Button
            onPress={() => handleDelete(receipt)}
            mode="outlined"
            loading={loading}
            icon="delete"
          >
            Delete
          </Button>
            </View>
        }
      >
        <Image
          source={{ uri: receipt.url }}
          style={{ width: '100%', height: 200, marginVertical: 8 }}
          resizeMode="contain"
        />
      </CommonCard>
      );
    });
  };

  // Modal content for uploading
  const renderModalContent = () => (
    <View>
      {!pickedImageUri ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <TouchableOpacity onPress={pickFromLibrary} style={{ flex: 1, marginHorizontal: 8, padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 6, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text }}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromCamera} style={{ flex: 1, marginHorizontal: 8, padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 6, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text }}>Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={{ uri: pickedImageUri }}
            style={{ width: '100%', height: 200, marginBottom: 8 }}
            resizeMode="contain"
          />
            <TouchableOpacity onPress={() => setPickedImageUri(null)} style={{ padding: 10, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 6, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: theme.colors.text }}>Remove</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Text style={[{ color: theme.colors.text, marginBottom: 8 }]}>Link to Expense (Optional)</Text>
            <View style={{ marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setDropdownOpen((open) => !open)}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  borderRadius: 6,
                  backgroundColor: theme.colors.background,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  width: '100%',
                }}
              >
                <Text style={{ color: theme.colors.text }}>
                  {selectedExpense
                    ? availableExpenses.find(e => e.expenseId === selectedExpense)?.activityName || 'Unknown'
                    : 'Select an expense'}
                </Text>
              </TouchableOpacity>
              {dropdownOpen && (
                <View style={{
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  borderRadius: 6,
                  zIndex: 100,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedExpense('');
                      setDropdownOpen(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      backgroundColor: selectedExpense === '' ? theme.colors.primary : theme.colors.background,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.outline,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                    }}
                  >
                    <Text style={{ color: selectedExpense === '' ? '#fff' : theme.colors.text, fontWeight: selectedExpense === '' ? 'bold' : 'normal' }}>
                      No expense (unlinked)
                    </Text>
                  </TouchableOpacity>
                  {availableExpenses.map((expense, idx) => (
                    <TouchableOpacity
                      key={expense.expenseId}
                      onPress={() => {
                        setSelectedExpense(expense.expenseId);
                        setDropdownOpen(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        backgroundColor: selectedExpense === expense.expenseId ? theme.colors.primary : theme.colors.background,
                        borderBottomWidth: idx === availableExpenses.length - 1 ? 0 : 1,
                        borderBottomColor: theme.colors.outline,
                      }}
                    >
                      <Text style={{ color: selectedExpense === expense.expenseId ? '#fff' : theme.colors.text, fontWeight: selectedExpense === expense.expenseId ? 'bold' : 'normal' }}>
                        {expense.activityName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
        </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity
              onPress={async () => {
                if (!selectedExpense) {
                  Alert.alert('Please choose an existing expense');
                  return;
                }
                await saveReceipt('local');
              }}
              style={{ flex: 1, marginRight: 8, padding: 12, borderRadius: 6, backgroundColor: theme.colors.primary, alignItems: 'center' }}
              disabled={!pickedImageUri}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload Locally</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (!selectedExpense) {
                  Alert.alert('Please choose an existing expense');
                  return;
                }
                if (!tripInfo || !tripInfo.isTripPremium) {
                  setUpsellVisible(true);
                  return;
                }
                // Enforce cloud limits
                const userReceipts = receipts.filter(r => r.createdByName === currentUsername && r.path && r.id);
                if (userReceipts.length >= 5 || receipts.filter(r => r.path && r.id).length >= 20) {
                  setUpsellVisible(true);
                  return;
                }
                await saveReceipt('cloud');
              }}
              style={{ flex: 1, marginLeft: 8, padding: 12, borderRadius: 6, backgroundColor: (tripInfo && tripInfo.isTripPremium) ? theme.colors.primary : theme.colors.outline, alignItems: 'center' }}
              disabled={!pickedImageUri}
            >
              <Text style={{ color: (tripInfo && tripInfo.isTripPremium) ? '#fff' : theme.colors.text, fontWeight: 'bold' }}>Upload to Cloud</Text>
            </TouchableOpacity>
        </View>
        </>
      )}
    </View>
  );

  return (
    <BaseSection title="Receipts" icon="📸" keyboardAvoiding={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity onPress={() => setInfoVisible(true)}>
          <MaterialIcons name="info-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
        <Button
          mode="contained"
        onPress={() => {
          if (tripInfo && tripInfo.isTripPremium) {
            const userReceipts = receipts.filter(r => r.createdByName === currentUsername);
            if (userReceipts.length >= 5 || receipts.length >= 20) {
              setUpsellVisible(true);
              return;
            }
          }
          setModalVisible(true);
        }}
        style={[sectionStyles.actionButton, { marginHorizontal: 16, marginTop: 8, marginBottom: 8 }]}
          icon="plus"
        disabled={tripInfo && tripInfo.isTripPremium && (receipts.filter(r => r.createdByName === currentUsername).length >= 5 || receipts.length >= 20)}
        >
          Add Receipt
        </Button>
      <ScrollView style={{ flex: 1 }}>
        {renderReceiptsList()}
      </ScrollView>
      <CommonModal
        visible={modalVisible}
        onDismiss={() => {
          setModalVisible(false);
          setPickedImageUri(null);
          setSelectedExpense(null);
        }}
        title="Add Receipt"
        // Remove onSubmit and submitLabel to hide the default modal upload button
        loading={loading}
        submitDisabled={true}
      >
        {renderModalContent()}
      </CommonModal>
      <CommonModal
        visible={infoVisible}
        onDismiss={() => setInfoVisible(false)}
        title="Receipt Upload Limits"
        onSubmit={() => setInfoVisible(false)}
        submitLabel="OK"
        loading={false}
        submitDisabled={false}
      >
        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Premium/Trial Trips (Cloud):{"\n"}</Text>
          - Max 5 receipts per user per trip{"\n"}
          - Max 20 receipts total per trip (all users){"\n"}
          - All receipts are visible to all trip members
        </Text>
        <Text>
          <Text style={{ fontWeight: 'bold' }}>Free Trips (Local):{"\n"}</Text>
          - Unlimited receipts per user per trip{"\n"}
          - Only you can see your own receipts
        </Text>
      </CommonModal>
      {renderUpsellModal()}
    </BaseSection>
  );
}

