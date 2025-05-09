// src/services/tripService.ts
import {
    doc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path

const TRIPS_COLLECTION = 'trips';

/**
 * Deletes only the main trip document.
 * Assumes a Cloud Function will handle deleting subcollections.
 * @param tripId The ID of the trip to delete.
 */
export const deleteTripDocument = async (tripId: string): Promise<void> => {
    if (!tripId) {
        throw new Error("Trip ID is required to delete a trip.");
    }
    console.log(`Requesting delete for main trip document: ${tripId}`);
    const tripDocRef = doc(db, TRIPS_COLLECTION, tripId);

    try {
        await deleteDoc(tripDocRef);
        console.log(`Trip document ${tripId} deleted successfully (subcollections handled by backend).`);
    } catch (error) {
        console.error(`Error deleting trip document ${tripId}: `, error);
        // Re-throw the error for the calling component
        throw error;
    }
};