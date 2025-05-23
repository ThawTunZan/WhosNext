// src/screens/TripDetails/components/ActivityVotingSection.tsx
import React, { useState, useCallback } from 'react'
import { View, StyleSheet, FlatList, Text } from 'react-native'
import { Button, ActivityIndicator, Snackbar } from 'react-native-paper'
import ActivityCard from '../../src/components/ActivityCard'
import {
  NewProposedActivityData,
  ProposedActivity,
  ActivityVotingSectionProps,
  VoteType,
} from '../../src/types/DataTypes'
import { useProposedActivities } from '../../src/hooks/useProposedActivities'
import {
  castVote,
  addProposedActivity,
  deleteProposedActivity,
  updateProposedActivity,
} from '../../src/services/ActivityUtilities'
import ProposeActivityModal from '../../src/components/ProposeActivityModal'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'

const ActivityVotingSection = ({ tripId, members, onAddExpenseFromActivity, onDeleteActivity, }: ActivityVotingSectionProps) => {
    const { activities, isLoading, error } = useProposedActivities(tripId);
    const [snackbarVisible, setSnackbarVisible] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [proposeModalVisible, setProposeModalVisible] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ProposedActivity | null>(null)

    const { isLoaded, isSignedIn, user } = useUser()
    if (!isLoaded) return null
    if (!isSignedIn) return <Redirect href="/auth/sign-in" />

    const currentUserId = user.id
    const currentUserName =
      user.fullName ??
      user.username ??
      user.primaryEmailAddress?.emailAddress ??
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      // ------------------------------------------------------------------

    // --- Handlers ---

    const handleEditActivity = useCallback((activity: ProposedActivity) => {
      setEditingActivity(activity)
      setProposeModalVisible(true)
    }, [])

    const handleVote = useCallback(async (activityId: string, voteType: VoteType) => {
        if (!currentUserId) {
            console.error("Cannot vote: User ID not found.");
            setSnackbarMessage("Error: Could not identify user.");
            setSnackbarVisible(true);
            return;
        }
        try {
            await castVote(tripId, activityId, currentUserId, voteType);
            console.log(`Vote ${voteType} submitted for ${activityId}`);
        } catch (err) {
            console.error(`Failed to cast vote ${voteType} on ${activityId}:`, err);
            setSnackbarMessage(`Error voting: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setSnackbarVisible(true);
        }
      }, [tripId]); // Dependency: tripId

    const handleVoteUp = useCallback((id: string) => {
        console.log(`Voted UP on activity: ${id}`);
        handleVote(id, 'up')
    }, [handleVote]);

    const handleVoteDown = useCallback((id: string) => {
        console.log(`Voted DOWN on activity: ${id}`);
        handleVote(id, 'down')
    }, [handleVote]);

    const handleDeleteActivityLocal = useCallback((activityId: string) => {
        console.log(`Requesting delete for activity: ${activityId}`);
        onDeleteActivity(activityId);
     }, [onDeleteActivity]);

    const handleAddExpenseFromActivity = useCallback((activity: ProposedActivity) => {
        onAddExpenseFromActivity(activity)

    }, [onAddExpenseFromActivity]);

    const handleProposeNewActivity = () => {
        console.log("Opening propose activity modal");
        setProposeModalVisible(true)
    };
    // ---------------------------

     // --- Handler for Modal Submission ---
    const handleProposeSubmit = useCallback(async (activityData: NewProposedActivityData) => {
        console.log("Submitting proposed activity:", activityData);
        try {
          if (editingActivity) {
+           //  ––––––– update existing activity –––––––
            await updateProposedActivity(tripId, editingActivity.id, activityData)
            setSnackbarMessage(`Activity "${activityData.name}" updated!`)
          } else {
+           //  ––––––– add new activity –––––––
            await addProposedActivity(tripId, activityData)
            setSnackbarMessage(`Activity "${activityData.name}" proposed!`)
          }
          setSnackbarVisible(true)
          setEditingActivity(null)
          setProposeModalVisible(false)
        } catch (err) {
          console.error("Failed to propose activity:", err);
          setSnackbarMessage(`Error proposing: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setSnackbarVisible(true);
          throw err;
        }
    }, [tripId, editingActivity, currentUserId, currentUserName]);


  // Render function for FlatList
  const renderActivityCard = useCallback(({ item }: { item: ProposedActivity }) => (
    <ActivityCard
      activity={item}
      onVoteUp={handleVoteUp}
      onVoteDown={handleVoteDown}
      onAddExpense={handleAddExpenseFromActivity}
      onDelete={handleDeleteActivityLocal}
      onEdit={handleEditActivity}
    />
  ), [handleVoteUp, handleVoteDown, handleAddExpenseFromActivity, handleEditActivity]); // Include handlers in dependencies

  const keyExtractor = useCallback((item: ProposedActivity) => item.id, []);

   const renderListHeader = () => (
    <Text style={styles.header}>🗳️ Activity Voting</Text>
  );

   const renderListFooter = () => (
       <Button
           mode="contained"
           icon="lightbulb-on-outline"
           onPress={handleProposeNewActivity}
           style={styles.proposeButton}
        >
           Propose New Activity
       </Button>
   );

  // --- Render Logic ---
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator animating={true} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderActivityCard}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
            <View style={styles.centered}>
                <Text>No activities proposed yet.</Text>
            </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />
      <Snackbar
         visible={snackbarVisible}
         onDismiss={() => setSnackbarVisible(false)}
         duration={3000} // Show a bit longer for feedback
        >
         {snackbarMessage}
       </Snackbar>
       {/* Modals for proposing or confirming would go here, outside FlatList */}
       <ProposeActivityModal
          visible={proposeModalVisible}
          onClose={() => setProposeModalVisible(false)}
          onSubmit={handleProposeSubmit}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          initialData={
          editingActivity? {
            name: editingActivity.name,
            description: editingActivity.description,
            estCost: editingActivity.estCost,
            currency: editingActivity.currency,
          }
          : undefined
       }
        />

        <Snackbar
           visible={snackbarVisible}
           onDismiss={() => setSnackbarVisible(false)}
           duration={3000}
         >
           {snackbarMessage}
        </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    container: {
      flex: 1, // Occupy available space
    },
    listContentContainer: {
      paddingHorizontal: 15,
      paddingBottom: 20,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 15,
      marginTop: 5, // Add some top margin if needed
      marginLeft: 5,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    proposeButton: {
        marginTop: 15, // Space above button
        marginHorizontal: 20, // Add some horizontal margin
    }
});

export default ActivityVotingSection;