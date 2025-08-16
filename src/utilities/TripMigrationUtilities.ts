import { generateClient } from 'aws-amplify/api';
import { updateTrip } from '@/src/graphql/mutations';
import { listTrips } from '@/src/graphql/queries';

const client = generateClient();

/**
 * Migrate existing trips that don't have required fields
 * This fixes trips created before the schema was updated
 */
export async function migrateExistingTrips() {
  try {
    console.log('Starting trip migration...');
    
    // Query all trips to check which ones need migration
    const tripsResponse = await client.graphql({
      query: listTrips,
      variables: {}
    });
    
    const trips = tripsResponse.data.listTrips.items;
    console.log(`Found ${trips.length} trips to check for migration`);
    
    let migratedCount = 0;
    
    for (const trip of trips) {
      // Check if trip is missing required fields
      if (!trip.createdBy || trip.isTripPremium === null || trip.isTripPremium === undefined) {
        console.log(`Migrating trip ${trip.id}: missing createdBy=${trip.createdBy}, isTripPremium=${trip.isTripPremium}`);
        
        try {
          await updateTripWithDefaults(
            trip.id,
            trip.createdBy || 'unknown', // Default to 'unknown' if missing
            trip.isTripPremium !== null && trip.isTripPremium !== undefined ? trip.isTripPremium : false
          );
          migratedCount++;
          
          // Add a small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to migrate trip ${trip.id}:`, error);
        }
      }
    }
    
    console.log(`Trip migration completed. ${migratedCount} trips were migrated.`);
    
  } catch (error) {
    console.error('Error during trip migration:', error);
  }
}

/**
 * Update a single trip with missing required fields
 */
export async function updateTripWithDefaults(tripId: string, createdBy: string, isTripPremium: boolean = false) {
  try {
    const result = await client.graphql({
      query: updateTrip,
      variables: {
        input: {
          id: tripId,
          createdBy,
          isTripPremium
        }
      }
    });
    
    console.log('Trip updated successfully:', result.data.updateTrip);
    return result.data.updateTrip;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
}
