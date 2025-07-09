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
	claimMockUser,
} from "@/src/utilities/TripUtilities";
import {
	addExpenseAndCalculateDebts,
	editExpense,
} from "@/src/services/expenseService";
import { deleteProposedActivity } from "@/src/TripSections/Activity/utilities/ActivityUtilities";
import { type Expense, type ProposedActivity, type AddMemberType, ErrorType, FirestoreExpense, FirestoreTrip } from "@/src/types/DataTypes";
import { getFirestore, collection, updateDoc, doc, getDoc, deleteDoc, getDocs } from "firebase/firestore";
import { useTripExpensesContext } from "../context/TripExpensesContext";
import { useUserTripsContext } from "../context/UserTripsContext";

interface UseTripHandlersParams {
	tripId: string;
	activityToDeleteId: string | null;
	openAddExpenseModal: (d: Partial<Expense> | null, isEditing?: boolean) => void;
	closeAddExpenseModal: () => void;
	setSnackbarMessage: (m: string) => void;
	setSnackbarVisible: (v: boolean) => void;
}

export function useTripHandlers({
	tripId,
	activityToDeleteId,
	openAddExpenseModal,
	closeAddExpenseModal,
	setSnackbarMessage,
	setSnackbarVisible,
}: UseTripHandlersParams) {
	const { user } = useUser();
	const currentUserName = user.username;
	const router = useRouter();
	const [isDeletingTrip, setIsDeletingTrip] = useState(false);
	const { expenses, loading: expensesLoading } = useTripExpensesContext();
	const { trips } = useUserTripsContext();

	const trip = trips.find(t => t.id === tripId);

	const handleAddMember = useCallback(
		async (memberName: string, budget: number, currency: string, addMemberType: AddMemberType) => {
			if (!tripId) return;
			try {
				await addMemberToTrip(
					tripId,
					memberName,
					{
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
		async (mockUsername: string, claimCode: string) => {
			if (!tripId || !currentUserName) return;
			try {
				await claimMockUser(tripId, mockUsername, claimCode, currentUserName);
				// call a function that update firebase database expenses and activity and settle debt
				await updateFirebaseAfterClaiming(mockUsername, currentUserName, tripId, expenses, trip);
				setSnackbarMessage("Successfully claimed mock profile!");
				setSnackbarVisible(true);
			} catch (err: any) {
				console.error(err);
				setSnackbarMessage(`Error claiming profile: ${err.message}`);
				setSnackbarVisible(true);
				throw err;
			}
		},
		[tripId, currentUserName]
	);

	async function canBeRemoved(memberName: string) {
		
		// TODO
		const isPartOfTrip = (
			expenses.some(expense =>
				expense.paidByAndAmounts?.some(pba => pba.memberName === memberName) ||
				expense.sharedWith?.some(sw => sw.payeeName === memberName)
			) /*||
			(trip?.activities || []).some(activity => activity.suggestedByName === memberName) ||
			(trip?.receipts || []).some(receipt => receipt.uploaderName === memberName) */||
			Object.values(trip?.debts || {}).some(currencyDebts =>
				Object.keys(currencyDebts).some(pair => pair.includes(memberName))
			)
		);
		return !isPartOfTrip;
	}

	const handleRemoveMember = useCallback(
		async (memberNameToRemove: string) => {
			if (!tripId || !trip?.members?.[memberNameToRemove]) {
				setSnackbarMessage("Cannot remove member: Data missing.");
				setSnackbarVisible(true);
				return;
			}
			const name = memberNameToRemove || "This member";
			if (await canBeRemoved(memberNameToRemove)) {
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
										memberNameToRemove,
										trip.members[memberNameToRemove]
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
				Alert.alert(
					"Cannot Remove Member",
					`${name} cannot be removed because they are still part of an expense, activity, receipt, or debt.`
				);
			}
		},
		[tripId, trip]
	);

	const handleAddOrUpdateExpenseSubmit = useCallback(
		async (expenseData: Expense, editingExpenseId: string | null) => {
			if (!tripId) throw new Error("Trip ID is missing");
			const members = trip.members;
			if (!members) throw new Error("Trip members not available");

			try {
				if (editingExpenseId) {
					const expense = expenses.find(e => e.id === editingExpenseId);
					await editExpense(
						tripId,
						editingExpenseId,
						expenseData,
						members,
						expense
					);
					setSnackbarMessage("Expense updated successfully!");
				} else {
					await addExpenseAndCalculateDebts(tripId, expenseData, members,trip);
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
					  memberName: currentUserName,
					  amount: activity.estCost ? String(activity.estCost) : "0",
					}
				  ],
				  createdAt: activity.createdAt,
				},
				false
			  ),
		[openAddExpenseModal, currentUserName]
	);

	const handleLeaveTrip = useCallback(async () => {
		if (!tripId) return;
		try {
			await leaveTripIfEligible(
				tripId,
				currentUserName,
				trip.members[currentUserName]
			);
			setSnackbarMessage("You left the trip.");
			setSnackbarVisible(true);
			setTimeout(() => router.replace("/"), 1000);
		} catch (err: any) {
			console.error(err);
			setSnackbarMessage(`Failed to leave trip: ${err.message}`);
			setSnackbarVisible(true);
		}
	}, [tripId, currentUserName, trip, router]);

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
async function updateFirebaseAfterClaiming(mockUserId: string, currentUserName: string, tripId: string, expenses: FirestoreExpense[], tripData: FirestoreTrip) {
	const db = getFirestore();

	// 1. Update Expenses
	for (const expense of expenses) {
		let updated = false;
    	const newPaidBy = expense.paidByAndAmounts.map(pba =>
    	  pba.memberName === mockUserId ? { ...pba, memberName: currentUserName } : pba
    	);
    	const newSharedWith = expense.sharedWith.map(sw =>
    	  sw.payeeName === mockUserId ? { ...sw, payeeName: currentUserName } : sw
    	);
    	if (
    	  JSON.stringify(newPaidBy) !== JSON.stringify(expense.paidByAndAmounts) ||
    	  JSON.stringify(newSharedWith) !== JSON.stringify(expense.sharedWith)
    	) {
    	  updated = true;
    	}
		//TODO maybe try updating all at once?
    	if (updated) {
    	  await updateDoc(doc(db, "trips", tripId, "expenses", expense.id), {
    	    paidByAndAmounts: newPaidBy,
    	    sharedWith: newSharedWith,
    	  });
    	}
	}

	// 2. Update Proposed Activities
	const activitiesRef = collection(db, "trips", tripId, "proposed_activities");
	const activitiesSnap = await getDocs(activitiesRef);
	for (const activityDoc of activitiesSnap.docs) {
		const activity = activityDoc.data();
		let updated = false;

		if (activity.suggestedByName === mockUserId) {
			activity.suggestedByName = currentUserName;
			updated = true;
		}

		// If there are other fields referencing the mock user, update them here

		if (updated) {
			await updateDoc(activityDoc.ref, activity);
		}
	}

	// 3. Update Debts
	const tripRef = doc(db, "trips", tripId);
	if (tripData) {
		let updated = false;
		const newDebts = {};

		for (const [currency, currencyDebts] of Object.entries(tripData.debts)) {
			const newCurrencyDebts = {};
			for (const [key, value] of Object.entries(currencyDebts)) {
				let newKey = key;
				if (key.includes(mockUserId)) {
					newKey = key.replace(mockUserId, currentUserName);
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

