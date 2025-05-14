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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Progress from 'react-native-progress';
import { Button, ProgressBar, Card, Snackbar } from "react-native-paper"; // Removed Avatar if not used

// --- Import Hooks and Utilities ---
import { useTripData } from "@/src/hooks/useTripData";
import { addMemberToTrip, leaveTripIfEligible, removeMemberFromTrip } from "@/src/services/TripUtilities";
import {deleteTripAndRelatedData} from '@/src/services/TripUtilities'

// --- Import Components ---
import ExpensesSection from './components/ExpenseSection';
import MemberList from "./components/MemberList";
import SettleUpSection from "./components/Settleup";
import TripHeader from "./components/TripHeader";
import ActivityVotingSection from "./components/ActivityVotingSection";
import AddExpenseModal from "@/src/components/AddExpenseModal";
// --- Import Types ---
import { Member, MembersMap, NewExpenseData, ProposedActivity, Expense, TripData } from "@/src/types/DataTypes";

// --- Import Service Functions ---
import {
    addExpenseAndCalculateDebts,
    updateExpenseAndRecalculateDebts,
} from "@/src/services/expenseService";
import { deleteProposedActivity } from "@/src/services/ActivityUtilities";
import { calculateNextPayer } from "@/src/services/expenseService";
import ReceiptSection from "./components/ReceiptSection";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";


// (RouteParams interface can be removed if useLocalSearchParams is typed or if id is always string)

export default function TripDetailPage() {

    const { id: currUserId } = useCurrentUser();
    const { id: routeIdParam } = useLocalSearchParams<{ id?: string | string[] }>();
    const tripId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;

    // --- Use Custom Hook for Data Fetching ---
    const { trip, expenses, loading, error: dataError } = useTripData(tripId);
    // -----------------------------------------

    const [selectedTab, setSelectedTab] = useState<'overview' | 'expenses' | 'settle' | 'activities' | 'add' | 'receipts'>('overview');
    const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
    const [initialExpenseData, setInitialExpenseData] = useState<Partial<NewExpenseData> | null>(null);
    const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [isDeletingTrip, setIsDeletingTrip] = useState(false);
    const [hasLeftTrip, setHasLeftTrip] = useState(false);


    const router = useRouter();

    const nextPayer = useMemo(() => {
        return calculateNextPayer(trip?.members || null);
    }, [trip?.members]);

    // --- Modal Control Callbacks ---
    const openAddExpenseModal = useCallback((initialData: Partial<NewExpenseData> | null = null, isEditing: boolean = false) => {
        console.log("Opening add/edit expense modal. Editing:", isEditing, "Initial data:", initialData);
        setInitialExpenseData(initialData);
        setEditingExpenseId(isEditing && initialData && 'id' in initialData && typeof initialData.id === 'string' ? initialData.id : null); // Set editingExpenseId if editing
        setAddExpenseModalVisible(true);
    }, []);

    const closeAddExpenseModal = useCallback(() => {
        setAddExpenseModalVisible(false);
        setInitialExpenseData(null);
        setActivityToDeleteId(null);
        setEditingExpenseId(null);
    }, []);
    // -----------------------------

    // --- Member Management Callbacks ---
    const handleAddMember = useCallback(async (memberId: string, name: string, budget: number) => {
        if (!tripId) return;
        try {
            await addMemberToTrip(tripId, memberId, name, budget);
            setSnackbarMessage(`${name} added to the trip!`);
            setSnackbarVisible(true);
        } catch (err) {
            console.error("Failed to add member:", err);
            setSnackbarMessage(`Error adding member: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setSnackbarVisible(true);
        }
    }, [tripId]);

    const handleRemoveMember = useCallback(async (memberIdToRemove: string) => {
        if (!tripId || !trip?.members || !trip.members[memberIdToRemove]) {
            setSnackbarMessage("Cannot remove member: Data missing.");
            setSnackbarVisible(true);
            return;
        }
        const memberData = trip.members[memberIdToRemove];
        Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${memberData.name}? This action might affect existing debts and expenses and cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove", style: "destructive",
                    onPress: async () => {
                        try {
                            await removeMemberFromTrip(tripId, memberIdToRemove, memberData);
                            setSnackbarMessage(`${memberData.name} removed.`);
                            setSnackbarVisible(true);
                        } catch (err) {
                            console.error("Failed to remove member:", err);
                            setSnackbarMessage(`Error removing member: ${err instanceof Error ? err.message : 'Unknown error'}`);
                            setSnackbarVisible(true);
                        }
                    }
                }
            ]
        );
    }, [tripId, trip?.members]);
    // -------------------------------

    // --- Expense Modal Submit (Add/Edit) & Activity Deletion Handlers ---
    const handleAddOrUpdateExpenseSubmit = useCallback(async (
        expenseData: Expense,
        currentEditingExpenseId: string | null
    ) => {
        const localActivityToDeleteId = activityToDeleteId;
        const currentMembers = trip?.members;

        if (!tripId || !currentMembers) {
            const errorMsg = !tripId ? "Trip ID is missing." : "Trip members data is not available.";
            setSnackbarMessage(`Error: ${errorMsg}`);
            setSnackbarVisible(true);
            throw new Error(errorMsg);
        }

        try {
            if (currentEditingExpenseId) {
                await updateExpenseAndRecalculateDebts(tripId, currentEditingExpenseId, expenseData, currentMembers);
                setSnackbarMessage('Expense updated successfully!');
            } else {
                await addExpenseAndCalculateDebts(tripId, expenseData, currentMembers);
                setSnackbarMessage('Expense added successfully!');
                if (localActivityToDeleteId) {
                    await deleteProposedActivity(tripId, localActivityToDeleteId);
                    console.log(`Deleted proposed activity ${localActivityToDeleteId}`);
                }
            }
            setSnackbarVisible(true);
            closeAddExpenseModal();
        } catch (err) {
            console.error("Failed to save expense:", err);
            setSnackbarMessage(`Error saving expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setSnackbarVisible(true);
            throw err;
        }
    }, [tripId, trip?.members, activityToDeleteId, closeAddExpenseModal]);

    const handleEditExpense = useCallback((expenseToEdit: Expense) => {
        if (!expenseToEdit) return;
        console.log(`Initiating edit for expense: ${expenseToEdit.id}`, expenseToEdit);
        const initialData: Partial<NewExpenseData> & { id?: string } = { // Add id for editing context
            id: expenseToEdit.id,
            activityName: expenseToEdit.activityName,
            paidBy: expenseToEdit.paidBy,
            paidAmt: expenseToEdit.paidAmt,
            sharedWith: expenseToEdit.sharedWith,
        };
        openAddExpenseModal(initialData, true); // Pass true for isEditing
    }, [openAddExpenseModal]);

    const handleDeleteActivityParent = useCallback(async (activityId: string) => {
        if (!tripId) return;
        try {
            await deleteProposedActivity(tripId, activityId);
            setSnackbarMessage("Activity proposal deleted.");
            setSnackbarVisible(true);
        } catch (err) {
            console.error(`Failed to delete activity ${activityId}:`, err);
            setSnackbarMessage(`Error deleting activity: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setSnackbarVisible(true);
        }
    }, [tripId]);

    const handleAddExpenseFromActivity = useCallback((activity: ProposedActivity) => {
        if (!activity) return;
        setEditingExpenseId(null); // Ensure not in edit mode
        const initialData: Partial<NewExpenseData> = {
            activityName: activity.name,
            paidAmt: activity.estCost ?? 0,
        };
        setActivityToDeleteId(activity.id);
        openAddExpenseModal(initialData, false); // Pass false for isEditing
    }, [openAddExpenseModal]);
    // -----------------------------------------------------------------

    const handleLeaveTrip = useCallback(async () => {
        try {
          if (!trip || !tripId || !trip.members[currUserId]) return;
        
          await leaveTripIfEligible(tripId, currUserId, trip.members[currUserId]);
        
          setSnackbarMessage("You left the trip.");
          setHasLeftTrip(true);
          setSnackbarVisible(true);
          setTimeout(() => {
            router.replace("/");
          }, 1000);
        } catch (err: any) {
          setSnackbarMessage(err.message || "Failed to leave trip.");
          setSnackbarVisible(true);
        }
    }, [trip, tripId]);


    if (loading) {
        return <View style={styles.centeredContainer}><Text>Loading trip...</Text></View>;
    }
    if (dataError) {
        return <View style={styles.centeredContainer}><Text>Error loading trip: {dataError.message}</Text></View>;
    }
    if (!trip || hasLeftTrip) {
      return <View style={styles.centeredContainer}>
        <Text>{hasLeftTrip ? "You have left this trip." : "Trip not found."}</Text>
      </View>;
    }


    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.outerContainer}>
            <TripHeader destination={trip.destination} />
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                    <Button style={[styles.tabButton, selectedTab === 'overview' && styles.tabButtonSelected]} onPress={() => setSelectedTab('overview')}>Overview</Button>
                    <Button style={[styles.tabButton, selectedTab === 'expenses' && styles.tabButtonSelected]} onPress={() => setSelectedTab('expenses')}>Expenses</Button>
                    <Button style={[styles.tabButton, selectedTab === 'settle' && styles.tabButtonSelected]} onPress={() => setSelectedTab('settle')}>Settle Up</Button>
                    <Button style={[styles.tabButton, selectedTab === 'activities' && styles.tabButtonSelected]} onPress={() => setSelectedTab('activities')}>Activities</Button>
                    <Button style={[styles.tabButton, selectedTab === 'add' && styles.tabButtonSelected]} onPress={() => setSelectedTab('add')}>+</Button>
                    <Button style={[styles.tabButton, selectedTab === 'receipts' && styles.tabButtonSelected]} onPress={() => setSelectedTab('receipts')}>Receipts</Button>
                </ScrollView>
            </View>

            <View style={styles.contentArea}>
                {selectedTab === 'overview' && (
                    <ScrollView contentContainerStyle={styles.overviewScrollContainer}>
                        <MemberList
                            members={trip.members || {}}
                            onAddMember={handleAddMember}
                            onRemoveMember={handleRemoveMember}
                        />
                        <Card style={styles.card}>
                           <Card.Title title="📊 Budget Summary" />
                           <Card.Content>
                             {Object.entries(trip.members || {}).map(([memberId, memberData]) => {
                                const m = memberData as Member;
                                const progressValue = (m.budget > 0) ? ((m.amtLeft) / m.budget) : 0;
                                return (
                                  <View key={memberId} style={styles.memberBar}>
                                    <Text style={styles.memberName}>{m.name}</Text>
                                    <ProgressBar progress={Math.max(0, Math.min(1, progressValue))} color={progressValue > 1 ? 'red' : undefined} style={styles.progressBar} />
                                  </View>
                                );
                             })}
                             <Text style={styles.budgetText}>Total Budget: ${(trip.totalBudget ?? 0).toFixed(2)}</Text>
                             <Text style={styles.budgetText}>Total Left: ${(trip.totalAmtLeft ?? 0).toFixed(2)}</Text>
                           </Card.Content>
                         </Card>
                        {trip.members?.[currUserId] && (<Card style={styles.card}>
                            <Card.Title title="🎯 Personal Budget" />
                            <Card.Content>
                                <Text>${trip.members[currUserId].amtLeft}</Text>
                            </Card.Content>
                        </Card>)}
                        {nextPayer?.id && (
                            <Card style={styles.card}>
                                <Card.Title title="➡️ Who's Paying Next?" />
                                 <Card.Content>
                                     <View style={styles.nextPayerContent}>
                                         <Text style={styles.nextPayerName}>{nextPayer.name}</Text>
                                     </View>
                                 </Card.Content>
                            </Card>
                        )}
                        <View style={{ height: 30 }} />
                        {trip.userId === currUserId && ( <Button
                          mode="contained"
                          onPress={async () => {
                            setIsDeletingTrip(true);
                            try {
                              await deleteTripAndRelatedData(tripId!);
                              setSnackbarMessage("Trip deleted.");
                              setSnackbarVisible(true);
                              setTimeout(() => {
                                router.replace("/");
                              }, 1000);
                            } catch (err) {
                              console.error("Error deleting trip:", err);
                              setSnackbarMessage("Failed to delete trip.");
                              setSnackbarVisible(true);
                            } finally {
                              setIsDeletingTrip(false);
                            }
                          }}
                          loading={isDeletingTrip}
                          disabled={isDeletingTrip}
                          style={{ marginTop: 20, backgroundColor: "#dc3545" }}
                        >
                          Delete Trip
                        </Button>)}
                        <Button
                          mode="outlined"
                          onPress={handleLeaveTrip}
                          style={{ marginTop: 10 }}
                        >
                          Leave Trip
                        </Button>

                    </ScrollView>
                    
                )}

                {selectedTab === 'expenses' && tripId && (
                    <ExpensesSection
                        tripId={tripId}
                        members={trip.members || {}}
                        onAddExpensePress={() => {
                            setEditingExpenseId(null);
                            openAddExpenseModal(null, false); // Ensure not editing, pass null initialData
                        }}
                        onEditExpense={handleEditExpense}
                        nextPayerName={nextPayer?.name}
                    />
                )}
                {selectedTab === 'settle' && trip.debts && trip.members && (
                    <SettleUpSection debts={trip.debts as Record<string,number>} members={trip.members} />
                )}
                {selectedTab === 'activities' && tripId && (
                    <ActivityVotingSection
                        tripId={tripId}
                        members={trip.members || {}}
                        onAddExpenseFromActivity={handleAddExpenseFromActivity}
                        onDeleteActivity={handleDeleteActivityParent}
                    />
                )}
                {selectedTab === 'add' && (<View style={styles.placeholder}><Text>Placeholder for '+' Tab Content</Text></View>)}
                {selectedTab === 'receipts' && (<ReceiptSection tripId={tripId}/>)}
            </View>

            {typeof tripId == 'string' && trip?.members && ( // Render modal only if members data is available
                 <AddExpenseModal
                    visible={addExpenseModalVisible}
                    onClose={closeAddExpenseModal}
                    onSubmit={handleAddOrUpdateExpenseSubmit}
                    members={trip.members}
                    tripId={tripId}
                    initialData={initialExpenseData}
                    editingExpenseId={editingExpenseId} // Pass this state to modal
                    suggestedPayerName={nextPayer?.name}
                 />
             )}
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </KeyboardAvoidingView>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#f8f9fa' }, // Light background
    tabContainer: {
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabScroll: {
        flexGrow: 0,
        marginBottom: 8, // Reduced margin
    },
    tabButton: {
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ced4da', // Softer border
        borderRadius: 20, // More rounded
        paddingHorizontal: 14, // Adjust padding
        paddingVertical: 6,    // Add vertical padding
    },
    tabButtonSelected: {
        backgroundColor: '#e9ecef', // Softer selected background
        borderColor: '#adb5bd',
    },
    contentArea: {
        flex: 1,
        // Padding handled by individual scroll/list containers
    },
    overviewScrollContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20, // Space at the bottom
    },
    card: {
        marginVertical: 8, // Reduced vertical margin
        borderRadius: 12,  // More rounded cards
        elevation: 2,
        backgroundColor: '#fff', // Ensure cards are white
    },
    memberBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingRight: 120
    },
    memberName: {
        marginRight: 12,
        minWidth: 70, // Slightly less minWidth
        fontSize: 14,
    },
    progressBar: {
        flex: 1,
        height: 12, // Slightly thicker
        borderRadius: 6,
    },
    budgetText: {
        marginTop: 10,
        fontSize: 15,
        color: '#343a40', // Darker text
    },
    nextPayerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    nextPayerName: {
        fontSize: 17, // Slightly smaller
        fontWeight: '500',
        color: '#28a745', // Green for next payer
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
});