// src/handlers/TripHandler.tsx
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import {
	addMemberToTrip,
	leaveTripIfEligible,
	removeMemberFromTrip,
	deleteTripAndRelatedData,
	updatePersonalBudget,
	claimMockUser,
} from "@/src/utilities/TripUtilities";
import {
	addExpenseAndCalculateDebts,
	editExpense,
} from "@/src/services/expenseService";
import { deleteProposedActivity } from "@/src/TripSections/Activity/utilities/ActivityUtilities";
import { type Expense, type ProposedActivity, type AddMemberType, type Currency, ErrorType } from "@/src/types/DataTypes";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import {
	checkIfPartOfExpenses,
	checkIfPartOfActivities,
	checkIfUploadedReceipts,
	checkIfPartOfDebts,
} from '@/src/services/FirebaseServices';

interface UseTripHandlersParams {
	tripId: string;
	trip: any;
	profiles: Record<string, string>;
	activityToDeleteId: string | null;
	openAddExpenseModal: (d: Partial<Expense> | null, isEditing?: boolean) => void;
	closeAddExpenseModal: () => void;
	setSnackbarMessage: (m: string) => void;
	setSnackbarVisible: (v: boolean) => void;
}

export function useTripHandlers({
	tripId,
	trip,
	profiles,
	activityToDeleteId,
	openAddExpenseModal,
	closeAddExpenseModal,
	setSnackbarMessage,
	setSnackbarVisible,
}: UseTripHandlersParams) {
	const { user } = useUser();
	const currentUserId = user.id;
	const router = useRouter();
	const [isDeletingTrip, setIsDeletingTrip] = useState(false);

	const handleAddMember = useCallback(
		async (memberId: string, name: string, budget: number, currency: Currency, addMemberType: AddMemberType) => {
			if (!tripId) return;
			try {
				await addMemberToTrip(
					tripId,
					memberId,
					{
						name,
						budget,
						addMemberType,
						currency,
					}
				);
				setSnackbarMessage(`${name} ${addMemberType === "mock" ? 'added as a mock member!' : 'added to the trip!'}`);
				setSnackbarVisible(true);
			} catch (err: any) {
				console.error(err);
				setSnackbarMessage(`Error adding member: ${err.message}`);
				setSnackbarVisible(true);
			}
		},
		[tripId]
	);

	const handleClaimMockUser = useCallback(
		async (mockUserId: string, claimCode: string) => {
			if (!tripId || !currentUserId) return;
			try {
				await claimMockUser(tripId, mockUserId, claimCode, currentUserId);
				// call a function that update firebase database expenses and activity and settle debt
				await updateFirebaseAfterClaiming(mockUserId, currentUserId, tripId);
				setSnackbarMessage("Successfully claimed mock profile!");
				setSnackbarVisible(true);
			} catch (err: any) {
				console.error(err);
				setSnackbarMessage(`Error claiming profile: ${err.message}`);
				setSnackbarVisible(true);
				throw err;
			}
		},
		[tripId, currentUserId]
	);

	async function canBeRemoved(memberId: string) {
		if (
			await checkIfPartOfExpenses(memberId, tripId) ||
			await checkIfPartOfActivities(memberId, tripId) ||
			await checkIfUploadedReceipts(memberId, tripId) ||
			await checkIfPartOfDebts(memberId, tripId)
		) {
			return false;
		}
		return true;
	}

	const handleRemoveMember = useCallback(
		async (memberIdToRemove: string) => {
			if (!tripId || !trip?.members?.[memberIdToRemove]) {
				setSnackbarMessage("Cannot remove member: Data missing.");
				setSnackbarVisible(true);
				return;
			}
			const name = profiles[memberIdToRemove] || "This member";
			console.log("PROFILES OBJECT:", profiles);
			console.log("PROFILE KEYS:", Object.keys(profiles));
			console.log("memberIdToRemove:", memberIdToRemove);
			console.log("profiles[memberIdToRemove]:", profiles[memberIdToRemove]);
			if (await canBeRemoved(memberIdToRemove)) {
				Alert.alert(
					"Remove Member",
					`Are you sure you want to remove ${name}?`,
					[
						{ text: "Cancel", style: "cancel" },
						{
							text: "Remove",
							style: "destructive",
							onPress: async () => {
								try {
									await removeMemberFromTrip(
										tripId,
										memberIdToRemove,
										trip.members[memberIdToRemove]
									);
									setSnackbarMessage(`${name} removed.`);
									setSnackbarVisible(true);
								} catch (err: any) {
									console.error(err);
									setSnackbarMessage(`Error removing member: ${err.message}`);
									setSnackbarVisible(true);
								}
							},
						},
					]
				);
			} else {
				console.log("PROFILES OBJECT:", profiles);
				console.log("PROFILE KEYS:", Object.keys(profiles));
				console.log("memberIdToRemove:", memberIdToRemove);
				console.log("profiles[memberIdToRemove]:", profiles[memberIdToRemove]);
				Alert.alert(
					"Cannot Remove Member",
					`${name} cannot be removed because they are still part of an expense, activity, receipt, or debt.`
				);
			}
		},
		[tripId, trip, profiles]
	);

	const handleAddOrUpdateExpenseSubmit = useCallback(
		async (expenseData: Expense, editingExpenseId: string | null) => {
			if (!tripId) throw new Error("Trip ID is missing");
			const members = trip.members;
			if (!members) throw new Error("Trip members not available");

			try {
				if (editingExpenseId) {
					await editExpense(
						tripId,
						editingExpenseId,
						expenseData,
						members,
						profiles
					);
					setSnackbarMessage("Expense updated successfully!");
				} else {
					await addExpenseAndCalculateDebts(tripId, expenseData, members, profiles);
					setSnackbarMessage("Expense added successfully!");
					if (activityToDeleteId) {
						await deleteProposedActivity(tripId, activityToDeleteId);
					}
				}
				setSnackbarVisible(true);
				closeAddExpenseModal();
			} catch (err: any) {
				if (err.message === ErrorType.MAX_EXPENSES_FREE_USER) {
					setSnackbarMessage("Max expenses per day per trip reached. Please upgrade to premium to add more expenses or wait for the next day.");
					setSnackbarVisible(true);
				} else if (err.message === ErrorType.MAX_EXPENSES_PREMIUM_USER) {
					setSnackbarMessage("Upgrade one of your users to premium to add more expenses or wait for the next day.");
					setSnackbarVisible(true);
				} else {
					console.error(err);
					setSnackbarMessage(`Error saving expense: ${err.message}`);
					setSnackbarVisible(true);
					throw err;
				}
			}
		},
		[tripId, trip, activityToDeleteId, closeAddExpenseModal]
	);

	const handleEditExpense = useCallback(
		(expenseToEdit: Expense) => openAddExpenseModal(expenseToEdit, true),
		[openAddExpenseModal]
	);

	const handleDeleteActivity = useCallback(
		async (activityId: string) => {
			if (!tripId) return;
			try {
				await deleteProposedActivity(tripId, activityId);
				setSnackbarMessage("Activity deleted.");
				setSnackbarVisible(true);
			} catch (err: any) {
				console.error(err);
				setSnackbarMessage(`Error deleting activity: ${err.message}`);
				setSnackbarVisible(true);
			}
		},
		[tripId]
	);
	// TODO: Update activities count and expenses count
	const handleAddExpenseFromActivity = useCallback(
		(activity: ProposedActivity) =>
			openAddExpenseModal(
				{
				  activityName: activity.name,
				  paidByAndAmounts: [
					{
					  memberId: currentUserId,
					  amount: activity.estCost ? String(activity.estCost) : "0",
					}
				  ],
				  createdAt: activity.createdAt,
				},
				false
			  ),
		[openAddExpenseModal, currentUserId]
	);

	const handleLeaveTrip = useCallback(async () => {
		if (!tripId) return;
		try {
			await leaveTripIfEligible(
				tripId,
				currentUserId,
				trip.members[currentUserId]
			);
			setSnackbarMessage("You left the trip.");
			setSnackbarVisible(true);
			setTimeout(() => router.replace("/"), 1000);
		} catch (err: any) {
			console.error(err);
			setSnackbarMessage(`Failed to leave trip: ${err.message}`);
			setSnackbarVisible(true);
		}
	}, [tripId, currentUserId, trip, router]);

	return {
		handleAddMember,
		handleRemoveMember,
		handleAddOrUpdateExpenseSubmit,
		handleEditExpense,
		handleDeleteActivity,
		handleAddExpenseFromActivity,
		handleLeaveTrip,
		handleDeleteTrip: () => {
			setIsDeletingTrip(true);
			deleteTripAndRelatedData(tripId)
				.then(() => {
					setSnackbarMessage("Trip deleted.");
					setSnackbarVisible(true);
					router.push("/");
				})
				.catch((e) => {
					console.error(e);
					setSnackbarMessage("Failed to delete trip.");
					setSnackbarVisible(true);
				})
				.finally(() => setIsDeletingTrip(false));
		},
		handleClaimMockUser,
		isDeletingTrip,
	};
}

/*
 * Function is called when new user join in and claims a mock member
 * To update in the backend the expenses, activities and other stuff the mockmember participated in 
 */
async function updateFirebaseAfterClaiming(mockUserId: string, currentUserId: string, tripId: string) {
	const db = getFirestore();

	// 1. Update Expenses
	const expensesRef = collection(db, "trips", tripId, "expenses");
	const expensesSnap = await getDocs(expensesRef);
	for (const expenseDoc of expensesSnap.docs) {
		const expense = expenseDoc.data();
		let updated = false;

		// Update paidByAndAmounts
		if (expense.paidByAndAmounts) {
			expense.paidByAndAmounts = expense.paidByAndAmounts.map(pba =>
				pba.memberId === mockUserId ? { ...pba, memberId: currentUserId } : pba
			);
			updated = true;
		}

		// Update sharedWith
		if (expense.sharedWith) {
			expense.sharedWith = expense.sharedWith.map(sw =>
				sw.payeeID === mockUserId ? { ...sw, payeeID: currentUserId } : sw
			);
			updated = true;
		}

		if (updated) {
			await updateDoc(expenseDoc.ref, {
				paidByAndAmounts: expense.paidByAndAmounts,
				sharedWith: expense.sharedWith,
			});
		}
	}

	// 2. Update Proposed Activities
	const activitiesRef = collection(db, "trips", tripId, "proposed_activities");
	const activitiesSnap = await getDocs(activitiesRef);
	for (const activityDoc of activitiesSnap.docs) {
		const activity = activityDoc.data();
		let updated = false;

		if (activity.suggestedByID === mockUserId) {
			activity.suggestedByID = currentUserId;
			updated = true;
		}

		// If there are other fields referencing the mock user, update them here

		if (updated) {
			await updateDoc(activityDoc.ref, activity);
		}
	}

	// 3. Update Debts
	const tripRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripRef);
    const tripData = tripSnap.data();
	if (tripData) {
		console.log("TRIP DATA EXIST!!")
		let updated = false;
		const newDebts = {};

		for (const [currency, currencyDebts] of Object.entries(tripData.debts)) {
			const newCurrencyDebts = {};
			for (const [key, value] of Object.entries(currencyDebts)) {
				let newKey = key;
				if (key.includes(mockUserId)) {
					console.log("FOUND DEBT WITH MOCKUSERID")
					newKey = key.replace(mockUserId, currentUserId);
					console.log("NEW KEY IS "+newKey)
					updated = true;
				}		
				newCurrencyDebts[newKey] = value;		//remains old value if mockUserId is not found
			}
			newDebts[currency] = newCurrencyDebts;
		}

		if (updated) {
			await updateDoc(tripRef, {
				debts: newDebts,
			});
		}
	}

	// 4. Remove the mock user document from the users collection
	const mockUserDocRef = doc(db, "users", mockUserId);
	await deleteDoc(mockUserDocRef);
}

