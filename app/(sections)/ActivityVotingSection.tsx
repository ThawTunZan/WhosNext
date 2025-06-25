// src/screens/TripDetails/components/ActivityVotingSection.tsx
import React, { useState, useCallback } from 'react'
import { View } from 'react-native'
import { Button, Snackbar } from 'react-native-paper'
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/app/styles/section_comp_styles';

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
import ProposeActivityModal from '@/src/TripSections/Activity/components/ProposeActivityModal'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { SearchBar } from '@/app/trip/components/SearchBar'
import { useMemberProfiles } from '@/src/context/MemberProfilesContext'
import ActivityList from '@/app/trip/components/ItemList/ActivityList'
import { BaseSection } from '@/app/common_components/BaseSection'
import { CommonModal } from '@/app/common_components/CommonModal'

const ActivityVotingSection = ({ tripId, members, onAddExpenseFromActivity, onDeleteActivity, }: ActivityVotingSectionProps) => {
    const { isDarkMode } = useCustomTheme();
    const theme = isDarkMode ? darkTheme : lightTheme;

    const { activities, isLoading, error } = useProposedActivities(tripId);
    const [snackbarVisible, setSnackbarVisible] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [proposeModalVisible, setProposeModalVisible] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ProposedActivity | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const profiles = useMemberProfiles();
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const onRefresh = useCallback(async () => {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
      setSnackbarMessage('Activities up to date.');
      setSnackbarVisible(true);
    }, [tripId]);

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

    const renderHeader = () => (
      <SearchBar
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        placeholder="Search activities..."
      />
    );

    return (
      <BaseSection
        title="Activity Voting"
        icon="🗳️"
        loading={isLoading}
        error={error?.toString() || null}
      >
        {renderHeader()}

        <ActivityList
          activities={activities}
          searchQuery={searchQuery}
          profiles={profiles}
          onVoteUp={handleVoteUp}
          onVoteDown={handleVoteDown}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onAddExpense={handleAddExpenseFromActivity}
          onDelete={handleDeleteActivityLocal}
          onEdit={handleEditActivity}
          styles={sectionStyles}
        />

        <Button
          mode="contained"
          icon="lightbulb-on-outline"
          onPress={handleProposeNewActivity}
          style={sectionStyles.actionButton}
        >
          Propose New Activity
        </Button>

        <CommonModal
          visible={proposeModalVisible}
          onDismiss={() => {
            setProposeModalVisible(false)
            setEditingActivity(null)
          }}
          title={editingActivity ? "Edit Activity" : "Propose New Activity"}
        >
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
        </CommonModal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </BaseSection>
    );
};

export default ActivityVotingSection;