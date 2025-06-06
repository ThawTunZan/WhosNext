// src/screens/TripDetails/components/ActivityVotingSection.tsx
import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Button, Text, Snackbar, useTheme } from 'react-native-paper'
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

import {
  NewProposedActivityData,
  ProposedActivity,
  ActivityVotingSectionProps,
  VoteType,
} from '@/src/types/DataTypes'
import { useProposedActivities } from '@/src/hooks/useProposedActivities'
import {
  castVote,
  addProposedActivity,
  deleteProposedActivity,
  updateProposedActivity,
} from '@/src/services/ActivityUtilities'
import ProposeActivityModal from '@/src/components/ProposeActivityModal'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { SearchBar } from '@/app/trip/components/SearchBar'
import { useMemberProfiles } from '@/src/context/MemberProfilesContext'
import ActivityList from '@/app/trip/components/ActivityList'

const ActivityVotingSection = ({ tripId, members, onAddExpenseFromActivity, onDeleteActivity, }: ActivityVotingSectionProps) => {
    const { isDarkMode } = useCustomTheme();
    const theme = isDarkMode ? darkTheme : lightTheme;
    const paperTheme = useTheme();

    const { activities, isLoading, error } = useProposedActivities(tripId);
    const [snackbarVisible, setSnackbarVisible] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [proposeModalVisible, setProposeModalVisible] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ProposedActivity | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const profiles = useMemberProfiles();

    const { isLoaded, isSignedIn, user } = useUser()
    if (!isLoaded) return null
    if (!isSignedIn) return <Redirect href="/auth/sign-in" />

    const currentUserId = user.id
    const currentUserName =
      user.fullName ??
      user.username ??
      user.primaryEmailAddress?.emailAddress ??
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

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
    }, [tripId]);

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

    const handleProposeSubmit = useCallback(async (activityData: NewProposedActivityData) => {
        console.log("Submitting proposed activity:", activityData);
        try {
          if (editingActivity) {
            await updateProposedActivity(tripId, editingActivity.id, activityData)
            setSnackbarMessage(`Activity "${activityData.name}" updated!`)
          } else {
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

    const renderListHeader = () => (
      <>
        <Text style={[styles.header, { color: theme.colors.text }]}>
          🗳️ Activity Voting
        </Text>
        <SearchBar
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          placeholder="Search activities..."
        />
      </>
    );

    if (isLoading) {
      return (
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator animating={true} size="large" color={paperTheme.colors.primary} />
        </View>
      );
    }

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardVerticalOffset={100}
      >
        {renderListHeader()}

        <ActivityList
          activities={activities}
          searchQuery={searchQuery}
          profiles={profiles}
          onVoteUp={handleVoteUp}
          onVoteDown={handleVoteDown}
          onAddExpense={handleAddExpenseFromActivity}
          onDelete={handleDeleteActivityLocal}
          onEdit={handleEditActivity}
          styles={styles}
        />

        <Button
          mode="contained"
          icon="lightbulb-on-outline"
          onPress={handleProposeNewActivity}
          style={styles.proposeButton}
        >
          Propose New Activity
        </Button>

        <ProposeActivityModal
          visible={proposeModalVisible}
          onClose={() => {
            setProposeModalVisible(false)
            setEditingActivity(null)
          }}
          onSubmit={handleProposeSubmit}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          initialData={editingActivity || undefined}
        />

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    listContentContainer: {
      flexGrow: 1,
      paddingHorizontal: 15,
      paddingBottom: 20,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 15,
      marginTop: 5,
      marginLeft: 5,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    proposeButton: {
        margin: 16,
    }
});

export default ActivityVotingSection;