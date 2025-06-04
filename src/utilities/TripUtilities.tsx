// src/utils/tripUtils.ts
import {
	collection, getDocs, doc, updateDoc, increment, deleteField, deleteDoc, query, where, runTransaction,
	Timestamp,
	setDoc,
	getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Currency, Member, AddMemberType } from '../types/DataTypes';
import { NotificationService, NOTIFICATION_TYPES } from '../services/notification';
import { convertCurrency } from '../services/CurrencyService';

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
	userId: string,
	newBudget: number
): Promise<void> {
	if (!tripId || !userId) {
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
		const userData = members[userId]
		if (!userData) {
			throw new Error("User not a member of this trip.")
		}

		const oldBudget = userData.budget as number
		const oldAmtLeft = userData.amtLeft as number
		const spent = oldBudget - oldAmtLeft
		const diff = oldBudget - newBudget

		const updatedAmtLeft = newBudget - spent

		const updatedMember = {
			...userData,
			budget: newBudget,
			amtLeft: updatedAmtLeft,
		}

		tx.update(tripRef, {
			[`members.${userId}`]: updatedMember,
			totalBudget: increment(-diff),
			totalAmtLeft: increment(-diff)
		})
	})
}

/**
 * Adds a member to a trip or ensures they exist in the trip.
 * @param tripId The ID of the trip
 * @param memberId The ID for the member
 * @param options Configuration options for adding the member
 * @param options.name The name of the member (optional for existing members)
 * @param options.budget The budget for the member (defaults to 0)
 * @param options.isMockUser Whether this is a mock user (defaults to false)
 * @param options.skipIfExists Whether to skip adding if member exists (defaults to false)
 * @param options.sendNotifications Whether to send notifications (defaults to true)
 */
export const addMemberToTrip = async (
	tripId: string,
	memberId: string,
	options: {
		name?: string,
		budget?: number,
		addMemberType?: AddMemberType,
		currency?: Currency,
		skipIfExists?: boolean,
		sendNotifications?: boolean,
		isPremiumUser?: boolean
	} = {}
): Promise<void> => {
	if (!tripId || !memberId) {
		throw new Error("Trip ID and Member ID are required.");
	}

	const {
		name,
		budget,
		addMemberType = AddMemberType.MOCK,
		currency = "USD",
		skipIfExists = false,
		sendNotifications = false,
		isPremiumUser = false
	} = options;

	const tripRef = doc(db, "trips", tripId);
	const tripSnap = await getDoc(tripRef);

	if (!tripSnap.exists()) {
		throw new Error("Trip does not exist");
	}

	const tripData = tripSnap.data();
	const members = tripData.members || {};

	// Check if member exists and handle accordingly
	if (members[memberId]) {
		if (skipIfExists) {
			return; // Exit early if member exists and we're told to skip
		}
		// Could throw error here if desired:
		// throw new Error("Member already exists in trip");
	}

	const newMemberData: Member = {
		id: memberId,
		budget: budget || 0,
		amtLeft: budget || 0,
		currency: currency,
		owesTotalArray: [],
		premiumUser: isPremiumUser,
		...(addMemberType === AddMemberType.MOCK ? { claimCode: generateRandomString(8) } : {}),
		addMemberType: addMemberType,
	};

	const newMemberDefaultCurrencyBudget = await convertCurrency(newMemberData.budget, newMemberData.currency, tripData.currency);

	try {
		// 1) Update the trip's members map and totals
		await updateDoc(tripRef, {
			[`members.${memberId}`]: newMemberData,
			totalBudget: increment(newMemberDefaultCurrencyBudget),
			totalAmtLeft: increment(newMemberDefaultCurrencyBudget),
		});
		console.log(`Member ${name || memberId} added to trip ${tripId}`);

		// 2) Update user profile if name is provided
		if (name) {
			const userRef = doc(db, "users", memberId);
			await setDoc(
				userRef,
				{ username: name.trim() },
				{ merge: true }
			);
			console.log(`User profile for ${memberId} upserted in users collection`);
		}

		// 3) Send notifications if enabled and not a mock user
		if (sendNotifications && addMemberType !== AddMemberType.MOCK && name) {
			const updatedTripSnap = await getDoc(tripRef);
			const updatedTripData = updatedTripSnap.data();
			if (updatedTripData && updatedTripData.members) {
				Object.keys(updatedTripData.members).forEach(async (existingMemberId) => {
					if (existingMemberId !== memberId) {
						await NotificationService.sendTripUpdate(
							"New Member Joined",
							`${name.trim()} has joined the trip!`,
							{
								type: NOTIFICATION_TYPES.TRIP_UPDATE,
								tripId: tripId,
								memberId: memberId
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
	mockUserId: string,
	claimCode: string,
	newUserId: string
): Promise<void> => {
	const tripRef = doc(db, "trips", tripId);

	try {
		const tripSnap = await getDoc(tripRef);
		if (!tripSnap.exists()) {
			throw new Error("Trip not found");
		}

		const tripData = tripSnap.data();
		const mockMember = tripData.members[mockUserId];

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
			[`members.${mockUserId}`]: deleteField(),
			[`members.${newUserId}`]: memberData
		});

		// Transfer the username to the new user's profile
		const mockUserRef = doc(db, "users", mockUserId);
		const mockUserSnap = await getDoc(mockUserRef);
		if (mockUserSnap.exists()) {
			const { username } = mockUserSnap.data();
			await setDoc(doc(db, "users", newUserId), { username }, { merge: true });
			await deleteDoc(mockUserRef);
		}

		console.log(`Mock user ${mockUserId} successfully claimed by ${newUserId}`);
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
	userId: string,
	member: Member,
): Promise<void> => {

	if (!tripId || !userId || !member) {
		throw new Error("Missing trip or user data.");
	}

	const myDebt = member?.owesTotalArray?.reduce((sum, debt) => sum + debt.owesTotal, 0) || 0;
	if (myDebt > 0) {
		throw new Error("You still have outstanding debts.");
	}

	const expensesSnap = await getDocs(collection(db, `trips/${tripId}/expenses`));
	const involvedInExpenses = expensesSnap.docs.some(doc => {
		const data = doc.data();
		return data.paidById === member.id || (data.sharedWith || []).includes(userId);
	});

	if (involvedInExpenses) {
		throw new Error("You are still involved in one or more expenses.");
	}

	const activitiesSnap = await getDocs(collection(db, `trips/${tripId}/proposed_activities`));
	const hasProposed = activitiesSnap.docs.some(doc => {
		const data = doc.data();
		return data.suggestedByID === userId;
	});

	if (hasProposed) {
		throw new Error("You have proposed activities. Remove them first.");
	}

	await removeMemberFromTrip(tripId, userId, member);
};

/**
 * Removes a member from a trip in Firestore.
 * WARNING: This does not currently recalculate debts or reassign expenses
 * if the removed member was involved. This would require more complex logic.
 * @param tripId
 * @param memberIdToRemove
 * @param memberToRemoveData
 */
export const removeMemberFromTrip = async (
	tripId: string,
	memberIdToRemove: string,
	memberToRemoveData: Member
): Promise<void> => {
	if (!tripId || !memberIdToRemove) {
		throw new Error("Trip ID and Member ID are required to remove a member.");
	}
	const docRef = doc(db, "trips", tripId);

	try {
		// Get member name before removing
		const userRef = doc(db, "users", memberIdToRemove);
		const userSnap = await getDoc(userRef);
		const userName = userSnap.exists() ? userSnap.data().username : 'A member';

		const tripSnap = await getDoc(docRef);
		const tripData = tripSnap.data();
		const memberConvertedAmtLeft = await convertCurrency(memberToRemoveData.amtLeft, memberToRemoveData.currency, tripData.currency);
		const memberConvertedBudget = await convertCurrency(memberToRemoveData.budget, memberToRemoveData.currency, tripData.currency);

		await updateDoc(docRef, {
			totalBudget: increment(-(memberToRemoveData.budget || 0)),
			totalAmtLeft: increment(-(memberToRemoveData.amtLeft || 0)),
			[`members.${memberIdToRemove}`]: deleteField(),
		});
		console.log(`Member ${memberIdToRemove} removed from trip ${tripId}`);

		// Get remaining members and notify them
		if (tripData && tripData.members) {
			Object.keys(tripData.members).forEach(async (memberId) => {
				await NotificationService.sendTripUpdate(
					"Member Left Trip",
					`${userName} has left the trip.`,
					{
						type: NOTIFICATION_TYPES.TRIP_UPDATE,
						tripId: tripId,
						memberId: memberIdToRemove
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