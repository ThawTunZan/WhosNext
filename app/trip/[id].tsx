// app/trip/[id].tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  ProgressBar,
  Card,
  Snackbar,
  Portal,
  Dialog,
  TextInput,
  IconButton,
} from "react-native-paper";

import { useTripData } from "@/src/hooks/useTripData";
import {
  updatePersonalBudget,
} from "@/src/services/TripUtilities";

import ExpensesSection from "../(sections)/ExpenseSection";
import MemberList from "@/app/trip/MemberList";
import SettleUpSection from "@/app/(sections)/Settleup";
import TripHeader from "../../src/components/TripHeader";
import ActivityVotingSection from "../(sections)/ActivityVotingSection";
import AddExpenseModal from "@/src/components/AddExpenseModal";
import ReceiptSection from "../(sections)/ReceiptSection";
import InviteSection from "../(sections)/InviteSection";

import {
  calculateNextPayer,
} from "@/src/services/expenseService";

import { useUser } from "@clerk/clerk-expo";
import { MemberProfilesProvider, useMemberProfiles } from "@/src/context/MemberProfilesContext";

import type { Member, ProposedActivity, Expense } from "@/src/types/DataTypes";
import { useTripHandlers } from "@/src/utilities/TripHandlers";


export default function TripDetailPage() {
  // ─── 1) ALL HOOKS FIRST ───────────────────────────────────
  const { id: routeIdParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;

  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = user.id;
  const router = useRouter();

  const { trip, loading, error: dataError } = useTripData(tripId);

  const memberUids = useMemo(
    () => (trip?.members ? Object.keys(trip.members) : []),
    [trip?.members]
  );

  const profiles = useMemberProfiles();

  const nextPayer = useMemo(
    () => calculateNextPayer(trip?.members || null, profiles),
    [trip?.members]
  );

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "expenses" | "settle" | "activities" | "add" | "receipts" | "invite"
  >("overview");
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [initialExpenseData, setInitialExpenseData] = useState<Partial<Expense> | null>(null);
  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [hasLeftTrip, setHasLeftTrip] = useState(false);

  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState<string>("");

    const openAddExpenseModal = useCallback(
    (initialData: Partial<Expense> | null = null, isEditing = false) => {
      setInitialExpenseData(initialData);
      setEditingExpenseId(
        isEditing && initialData && typeof initialData.id === "string"
          ? initialData.id
          : null
      );
      setAddExpenseModalVisible(true);
    },
    []
  );

  const closeAddExpenseModal = useCallback(() => {
    setAddExpenseModalVisible(false);
    setInitialExpenseData(null);
    setActivityToDeleteId(null);
    setEditingExpenseId(null);
  }, []);

  
    const {
      handleAddMember,
      handleRemoveMember,
      handleAddOrUpdateExpenseSubmit,
      handleEditExpense,
      handleDeleteActivity,
      handleAddExpenseFromActivity,
      handleLeaveTrip,
      handleDeleteTrip,
      isDeletingTrip,
    } = useTripHandlers({
      tripId: tripId!,
      trip: trip!,
      profiles,
      activityToDeleteId,
      openAddExpenseModal,
      closeAddExpenseModal,
      setSnackbarMessage,
      setSnackbarVisible,
    });

  // All useCallback handlers here:
  const openBudgetDialog = useCallback(() => {
    const currentBudget = trip?.members[currentUserId]?.budget ?? 0;
    setNewBudgetInput(currentBudget.toString());
    setBudgetDialogVisible(true);
  }, [trip, currentUserId]);

  const submitBudgetChange = useCallback(async () => {
    const parsed = parseFloat(newBudgetInput);
    if (isNaN(parsed) || parsed < 0) {
      setSnackbarMessage("Please enter a valid number.");
      setSnackbarVisible(true);
      return;
    }
    try {
      await updatePersonalBudget(tripId!, currentUserId, parsed);
      setSnackbarMessage("Personal budget updated!");
      setSnackbarVisible(true);
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.message || "Failed to update budget.");
      setSnackbarVisible(true);
    } finally {
      setBudgetDialogVisible(false);
    }
  }, [newBudgetInput, tripId, currentUserId]);

  // ─── 2) EARLY RETURNS ────────────────────────────────────
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Loading trip…</Text>
      </View>
    );
  }
  if (dataError) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Error loading trip: {dataError.message}</Text>
      </View>
    );
  }
  if (!trip || hasLeftTrip) {
    return (
      <View style={styles.centeredContainer}>
        <Text>{hasLeftTrip ? "You have left this trip." : "Trip not found."}</Text>
      </View>
    );
  }

  // ─── 4) Final render ───────────────────────────────────────
  return (
    <MemberProfilesProvider memberUids={memberUids}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.outerContainer}
      >
        <TripHeader destination={trip.destination} />

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {["overview", "expenses", "settle", "activities", "add", "receipts", "invite"].map((tab) => (
              <Button
                key={tab}
                style={[styles.tabButton, selectedTab === tab && styles.tabButtonSelected]}
                onPress={() => setSelectedTab(tab as any)}
              >
                {tab === "add" ? "+" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          {selectedTab === "overview" && (
            <ScrollView contentContainerStyle={styles.overviewScrollContainer}>
              <MemberList members={trip.members} onAddMember={handleAddMember} onRemoveMember={handleRemoveMember} />

              {/* Budget Summary */}
              <Card style={styles.card}>
                <Card.Title title="📊 Budget Summary" />
                <Card.Content>
                  {Object.entries(trip.members).map(([uid, m]) => {
                    const progress = m.budget > 0 ? m.amtLeft / m.budget : 0;
                    return (
                      <View key={uid} style={styles.memberBar}>
                        <Text style={styles.memberName}>{profiles[uid]}</Text>
                        <ProgressBar progress={Math.min(1, Math.max(0, progress))} style={styles.progressBar} />
                      </View>
                    );
                  })}
                  <Text style={styles.budgetText}>Total Budget: ${trip.totalBudget.toFixed(2)}</Text>
                  <Text style={styles.budgetText}>Total Left: ${trip.totalAmtLeft.toFixed(2)}</Text>
                </Card.Content>
              </Card>

              {/* Personal Budget */}
              {trip.members[currentUserId] && (
                <Card style={styles.card}>
                  <Card.Title
                    title="🎯 Personal Budget"
                    right={() => <IconButton icon="pencil" onPress={openBudgetDialog} />}
                  />
                  <Card.Content>
                    <Text style={styles.budgetText}>Amount left: ${trip.members[currentUserId].amtLeft}</Text>
                    <Text style={styles.budgetText}>Total Budget: ${trip.members[currentUserId].budget}</Text>
                  </Card.Content>
                </Card>
              )}

              <Portal>
                <Dialog visible={budgetDialogVisible} onDismiss={() => setBudgetDialogVisible(false)}>
                  <Dialog.Title>Edit Your Budget</Dialog.Title>
                  <Dialog.Content>
                    <TextInput
                      label="New Budget"
                      value={newBudgetInput}
                      onChangeText={setNewBudgetInput}
                      keyboardType="numeric"
                    />
                  </Dialog.Content>
                  <Dialog.Actions>
                    <Button onPress={() => setBudgetDialogVisible(false)}>Cancel</Button>
                    <Button onPress={submitBudgetChange}>Save</Button>
                  </Dialog.Actions>
                </Dialog>
              </Portal>

              {/* Next Payer */}
              {nextPayer && (
                <Card style={styles.card}>
                  <Card.Title title="➡️ Who's Paying Next?" />
                  <Card.Content>
                    <Text style={styles.nextPayerName}>{profiles[nextPayer]}</Text>
                  </Card.Content>
                </Card>
              )}

              {/* Delete / Leave */}
              {trip.userId === currentUserId && (
                  <Button
                    mode="contained"
                    onPress={handleDeleteTrip}
                    loading={isDeletingTrip}
                    style={{ backgroundColor: "#dc3545", marginVertical: 8 }}
                  >
                    Delete Trip
                  </Button>
                )}
                <Button mode="outlined" onPress={handleLeaveTrip}>
                  Leave Trip
                </Button>
            </ScrollView>
          )}

          {selectedTab === "expenses" && (
            <ExpensesSection
              tripId={tripId!}
              members={trip.members}
              onAddExpensePress={() => openAddExpenseModal(null, false)}
              onEditExpense={handleEditExpense}
              nextPayerId={nextPayer}
            />
          )}

          {selectedTab === "settle" && <SettleUpSection debts={trip.debts} members={trip.members} />}

          {selectedTab === "activities" && (
            <ActivityVotingSection
              tripId={tripId!}
              members={trip.members}
              onAddExpenseFromActivity={handleAddExpenseFromActivity}
              onDeleteActivity={handleDeleteActivity}
            />
          )}

          {selectedTab === "add" && (
            <View style={styles.placeholder}>
              <Text>Placeholder for "+" Tab</Text>
            </View>
          )}

          {selectedTab === "receipts" && <ReceiptSection tripId={tripId!} />}

          {selectedTab === "invite" && <InviteSection tripId={tripId!} />}
        </View>

        {/* Add / Edit Expense Modal */}
        <AddExpenseModal
          visible={addExpenseModalVisible}
          onClose={closeAddExpenseModal}
          onSubmit={handleAddOrUpdateExpenseSubmit}
          members={trip.members}
          tripId={tripId!}
          initialData={initialExpenseData}
          editingExpenseId={editingExpenseId}
          suggestedPayerId={nextPayer}
        />

        {/* Snackbar */}
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </MemberProfilesProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#f8f9fa" },
  tabContainer: {
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tabScroll: { flexGrow: 0, marginBottom: 8 },
  tabButton: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabButtonSelected: {
    backgroundColor: "#e9ecef",
    borderColor: "#adb5bd",
  },
  contentArea: { flex: 1 },
  overviewScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#fff",
  },
  memberBar: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  memberName: { marginRight: 12, minWidth: 70, fontSize: 14 },
  progressBar: { flex: 1, height: 12, borderRadius: 6 },
  budgetText: { marginTop: 10, fontSize: 15, color: "#343a40" },
  nextPayerName: { fontSize: 17, fontWeight: "500", color: "#28a745", paddingVertical: 8 },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  centeredContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
