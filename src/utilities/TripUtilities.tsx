// src/utils/tripUtils.ts
import {
	collection, getDocs, doc, updateDoc, increment, deleteField, deleteDoc, query, where, runTransaction,
	setDoc,
	getDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Currency, Member, AddMemberType, } from '@/src/types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from '@/src/services/notification';
import { convertCurrency } from '@/src/services/CurrencyService';

/**
 * Generates a random string of specified length
 * @param length Length of the string to generate
 * @returns Random string
 */
function generateRandomString(length: number): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Update a member's personal budget and adjust their amtLeft by the same delta.
 * Throws if trip or member not found.
 */
export async function updatePersonalBudget(
	tripId: string,
	username: string,
	newBudget: number,
	newCurrency: Currency
): Promise<void> {
	if (!tripId || !username) {
		throw new Error("Trip ID and User ID are required.")
	}

	const tripRef = doc(db, "trips", tripId)

	await runTransaction(db, async (tx) => {
		const snap = await tx.get(tripRef)
		if (!snap.exists()) {
			throw new Error("Trip not found.")
		}
		const data = snap.data()
		const members = data.members || {}
		const userData = members[username]
		if (!userData) {
			throw new Error("User not a member of this trip.")
		}

		const oldBudget = userData.budget as number
		const oldAmtLeft = userData.amtLeft as number
		const spent = oldBudget - oldAmtLeft

		// Convert the new budget to trip currency for totals
		const newBudgetInTripCurrency = await convertCurrency(newBudget, newCurrency, data.currency)
		const oldBudgetInTripCurrency = await convertCurrency(oldBudget, userData.currency, data.currency)
		const diff = oldBudgetInTripCurrency - newBudgetInTripCurrency

		// Calculate new amount left in the new currency
		const spentInNewCurrency = await convertCurrency(spent, userData.currency, newCurrency)
		const updatedAmtLeft = newBudget - spentInNewCurrency

		const updatedMember = {
			...userData,
			budget: newBudget,
			amtLeft: updatedAmtLeft,
			currency: newCurrency,
		}

		tx.update(tripRef, {
			[`members.${username}`]: updatedMember,
			totalBudget: increment(-diff),
			totalAmtLeft: increment(-diff)
		})
	})
}

/**
 * Adds a member to a trip or ensures they exist in the trip.
 * @param tripId The ID of the trip
 * @param memberName The ID for the member
 * @param options Configuration options for adding the member
 * @param options.name The name of the member (optional for existing members)
 * @param options.budget The budget for the member (defaults to 0)
 * @param options.isMockUser Whether this is a mock user (defaults to false)
 * @param options.skipIfExists Whether to skip adding if member exists (defaults to false)
 * @param options.sendNotifications Whether to send notifications (defaults to true)
 */
export const addMemberToTrip = async (
	tripId: string,
	memberName: string,
	options: {
		budget?: number,
		addMemberType?: AddMemberType,
		currency?: Currency,
		skipIfExists?: boolean,
		sendNotifications?: boolean,
	} = {}
): Promise<void> => {
	if (!tripId || !memberName) {
		throw new Error("Trip ID and Member ID are required.");
	}

	const {
		budget,
		addMemberType = AddMemberType.MOCK,
		currency = "USD",
		skipIfExists = false,
		sendNotifications = false,
	} = options;

	const tripRef = doc(db, "trips", tripId);
	const tripSnap = await getDoc(tripRef);

	if (!tripSnap.exists()) {
		throw new Error("Trip does not exist");
	}

	const tripData = tripSnap.data();
	const members = tripData.members || {};

	// Check if member exists and handle accordingly
	if (members[memberName]) {
		if (skipIfExists) {
			return; // Exit early if member exists and we're told to skip
		}
		// Could throw error here if desired:
		// throw new Error("Member already exists in trip");
	}

	const newMemberData: Member = {
		username: memberName,
		budget: budget || 0,
		amtLeft: budget || 0,
		currency: currency,
		owesTotalMap: {
			USD: 0,
			EUR: 0,
			GBP: 0,
			JPY: 0,
			CNY: 0,
			SGD: 0
		},
		receiptsCount: 0,
		...(addMemberType === AddMemberType.MOCK ? { claimCode: generateRandomString(8) } : {}),
		addMemberType: addMemberType,
	};

	const newMemberDefaultCurrencyBudget = await convertCurrency(newMemberData.budget, newMemberData.currency, tripData.currency);

	try {
		// 1) Update the trip's members map and totals
		await updateDoc(tripRef, {
			[`members.${memberName}`]: newMemberData,
			totalBudget: increment(newMemberDefaultCurrencyBudget),
			totalAmtLeft: increment(newMemberDefaultCurrencyBudget),
		});

		// 2) Update user profile if name is provided
		if (memberName) {
			const userRef = doc(db, "users", memberName);
			await setDoc(
				userRef,
				{ username: memberName.trim() },
				{ merge: true }
			);
		}

		// 3) Send notifications if enabled and not a mock user
		if (sendNotifications && addMemberType !== AddMemberType.MOCK && memberName) {
			const updatedTripSnap = await getDoc(tripRef);
			const updatedTripData = updatedTripSnap.data();
			if (updatedTripData && updatedTripData.members) {
				Object.keys(updatedTripData.members).forEach(async (existingmemberName) => {
					if (existingmemberName !== memberName) {
						await NotificationService.sendTripUpdate(
							"New Member Joined",
							`${memberName.trim()} has joined the trip!`,
							{
								type: NOTIFICATION_TYPES.TRIP_UPDATE,
								tripId: tripId,
								memberName: memberName
							}
						);
					}
				});
			}
		}
	} catch (error) {
		console.error("Error adding member to trip and/or users:", error);
		throw error;
	}
};

export const claimMockUser = async (
	tripId: string,
	mockUsername: string,
	claimCode: string,
	newusername: string
): Promise<void> => {
	const tripRef = doc(db, "trips", tripId);

	try {
		const tripSnap = await getDoc(tripRef);
		if (!tripSnap.exists()) {
			throw new Error("Trip not found");
		}

		const tripData = tripSnap.data();
		const mockMember = tripData.members[mockUsername];

		if (!mockMember) {
			throw new Error("Mock user not found");
		}

		if (mockMember.addMemberType !== "mock") {
			throw new Error("This member is not a mock user");
		}

		if (mockMember.claimCode !== claimCode) {
			throw new Error("Invalid claim code");
		}

		// Create new member data without mock-specific fields
		const { addMemberType, claimCode: _, ...memberData } = mockMember;

		// Update trip document to replace mock user with real user
		await updateDoc(tripRef, {
			[`members.${mockUsername}`]: deleteField(),
			[`members.${newusername}`]: {
				...memberData,
				addMemberType: AddMemberType.INVITE_LINK
			}
		});

		console.log(`Mock user ${mockUsername} successfully claimed by ${newusername}`);
	} catch (error) {
		console.error("Error claiming mock user:", error);
		throw error;
	}
};

/**
 * Checks if the member can leave the trip and removes them if allowed.
 * Blocks leaving if they have debts, expenses, or proposed activities.
 * @throws Error with reason if the user is not allowed to leave.
 */
export const leaveTripIfEligible = async (
	tripId: string,
	username: string,
	member: Member,
): Promise<void> => {
	if (!tripId || !username || !member) {
		throw new Error("Missing trip or user data.");
	}

	// Check if member has any debts in any currency
	const hasDebts = member.owesTotalMap ? 
		Object.values(member.owesTotalMap).some(amount => amount > 0) : false;
		
	if (hasDebts) {
		throw new Error("You still have outstanding debts.");
	}

	const expensesSnap = await getDocs(collection(db, `trips/${tripId}/expenses`));
	const involvedInExpenses = expensesSnap.docs.some(doc => {
		const data = doc.data();
		return data.paidById === member.username|| (data.sharedWith || []).includes(username);
	});

	if (involvedInExpenses) {
		throw new Error("You are still involved in one or more expenses.");
	}

	const activitiesSnap = await getDocs(collection(db, `trips/${tripId}/proposed_activities`));
	const hasProposed = activitiesSnap.docs.some(doc => {
		const data = doc.data();
		return data.suggestedByID === username;
	});

	if (hasProposed) {
		throw new Error("You have proposed activities. Remove them first.");
	}

	await removeMemberFromTrip(tripId, username, member);
};

/**
 * Removes a member from a trip in Firestore.
 * WARNING: This does not currently recalculate debts or reassign expenses
 * if the removed member was involved. This would require more complex logic.
 * @param tripId
 * @param memberNameToRemove
 * @param memberToRemoveData
 */
export const removeMemberFromTrip = async (
	tripId: string,
	memberNameToRemove: string,
	memberToRemoveData: Member
): Promise<void> => {
	if (!tripId || !memberNameToRemove) {
		throw new Error("Trip ID and Member ID are required to remove a member.");
	}
	const docRef = doc(db, "trips", tripId);

	try {
		// Get member name before removing
		const userRef = doc(db, "users", memberNameToRemove);
		const userSnap = await getDoc(userRef);
		const userName = userSnap.exists() ? userSnap.data().username : 'A member';

		const tripSnap = await getDoc(docRef);
		const tripData = tripSnap.data();
		// TODO: IMPLEMENT THIS
		const memberConvertedAmtLeft = await convertCurrency(memberToRemoveData.amtLeft, memberToRemoveData.currency, tripData.currency);
		const memberConvertedBudget = await convertCurrency(memberToRemoveData.budget, memberToRemoveData.currency, tripData.currency);

		await updateDoc(docRef, {
			totalBudget: increment(-(memberToRemoveData.budget || 0)),
			totalAmtLeft: increment(-(memberToRemoveData.amtLeft || 0)),
			[`members.${memberNameToRemove}`]: deleteField(),
		});
		console.log(`Member ${memberNameToRemove} removed from trip ${tripId}`);

		// Remove from users collection if mock member
		if (memberToRemoveData.addMemberType === AddMemberType.MOCK) {
			await deleteDoc(userRef);
			console.log(`Mock member ${memberNameToRemove} deleted from users collection`);
		}

		// Get remaining members and notify them
		if (tripData && tripData.members) {
			Object.keys(tripData.members).forEach(async (memberName) => {
				await NotificationService.sendTripUpdate(
					"Member Left Trip",
					`${userName} has left the trip.`,
					{
						type: NOTIFICATION_TYPES.TRIP_UPDATE,
						tripId: tripId,
						memberName: memberNameToRemove
					}
				);
			});
		}
	} catch (error) {
		console.error("Error removing member from trip:", error);
		throw error;
	}
};

export const deleteTripAndRelatedData = async (tripId: string): Promise<void> => {
	if (!tripId) throw new Error("Trip ID is required.");

	// TBD deleted related receipt pictures
	console.log("TRIP BUTTON IS PRESSED")

	// TODO
	// DELETE MOCK MEMBERS

	// 1. Delete receipts
	const receiptsQ = query(collection(db, "receipts"), where("tripId", "==", tripId));
	const receiptDocs = await getDocs(receiptsQ);
	const receiptDeletions = receiptDocs.docs.map(docSnap => deleteDoc(doc(db, "receipts", docSnap.id)));

	// 2. Delete expenses
	const expensesSnap = await getDocs(collection(db, `trips/${tripId}/expenses`));
	const expenseDeletions = expensesSnap.docs.map(docSnap =>
		deleteDoc(doc(db, `trips/${tripId}/expenses`, docSnap.id))
	);


	// 3. Delete activities (from subcollection)
	const activitiesQ = await getDocs(collection(db, `trips/${tripId}/proposed_activities`));
	const activityDeletions = activitiesQ.docs.map(docSnap =>
		deleteDoc(doc(db, `trips/${tripId}/proposed_activities`, docSnap.id))
	);


	// 4. Delete the trip document
	const tripDeletion = deleteDoc(doc(db, "trips", tripId));


	// Run all deletions in parallel
	await Promise.all([
		...receiptDeletions,
		...expenseDeletions,
		...activityDeletions,
		tripDeletion,
	]);

	console.log(`Trip ${tripId} and all related data deleted.`);
};