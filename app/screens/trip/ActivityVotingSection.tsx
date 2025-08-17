// src/screens/TripDetails/components/ActivityVotingSection.tsx
import { useState, useCallback, useMemo } from 'react'
import { Button, Snackbar } from 'react-native-paper'
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/src/styles/section_comp_styles';
import { useDebouncedCallback } from 'use-debounce';

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
} from '@/src/components/Trip/Activity/utilities/ActivityUtilities'

import ProposeActivityModal from '@/src/components/Trip/Activity/components/ProposeActivityModal'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { SearchBar } from '@/src/components/Common/SearchBar'
import ActivityList from '@/src/components/Common/ItemList/ActivityList'
import { BaseSection } from '@/src/components/Common/BaseSection'
import { CommonModal } from '@/src/components/Common/CommonModal'
import AddExpenseModal from '@/src/components/Trip/Expenses/components/AddExpenseModal'
import { useUserTripsContext } from '@/src/context/UserTripsContext'
import { ExpenseHandler } from '@/src/utilities/ExpenseHandler'

const ActivityVotingSection = ({ tripId, onDeleteActivity, }: ActivityVotingSectionProps) => {
    const { isDarkMode } = useCustomTheme();
    const theme = isDarkMode ? darkTheme : lightTheme;

    const { activities, isLoading, error } = useProposedActivities(tripId);
    const { trips, tripMembersMap } = useUserTripsContext();

    // 3. Memoization for trip and members
    const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);
    const members = useMemo(() => tripMembersMap?.[tripId] ?? {}, [tripMembersMap, tripId]);

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [proposeModalVisible, setProposeModalVisible] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ProposedActivity | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const [activityForExpense, setActivityForExpense] = useState<ProposedActivity | null>(null);

    const { isLoaded, isSignedIn, user } = useUser();
    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

    // 2. Error boundary/fallback UI for missing trip/members
    if (!trip) {
      return (
        <BaseSection title="Activity Voting" icon="🗳️">
          <Snackbar
            visible={true}
            duration={5000}
            onDismiss={() => {}} // Add this line
          >
            Error: Trip not found.
          </Snackbar>
        </BaseSection>
      );
    }
    if (!members || Object.keys(members).length === 0) {
      return (
        <BaseSection title="Activity Voting" icon="🗳️">
          <Snackbar
            visible={true}
            duration={5000}
            onDismiss={() => {}} // Add this line
          >
            Error: No trip members found.
          </Snackbar>
        </BaseSection>
      );
    }

    const currentUserName =
      user.username ??
      user.fullName ??
      user.primaryEmailAddress?.emailAddress ??
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    const handleEditActivity = useCallback((activity: ProposedActivity) => {
      setEditingActivity(activity);
      setProposeModalVisible(true);
    }, []);

    // 4. Remove console logs in production
    const log = (...args: any[]) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(...args);
      }
    };

    const handleVote = useCallback(async (activityId: string, voteType: VoteType) => {
        if (!currentUserName) {
            setSnackbarMessage("Error: Could not identify user.");
            setSnackbarVisible(true);
            return;
        }
        try {
            await castVote(tripId, activityId, currentUserName, voteType);
            console.log(`[ActivityVotingSection] Vote ${voteType} submitted for ${activityId}`);
        } catch (err) {
            console.error(`[ActivityVotingSection] Failed to cast vote ${voteType} on ${activityId}:`, err);
            setSnackbarMessage(`Error voting: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setSnackbarVisible(true);
        }
    }, [tripId]);

    const handleVoteUp = useCallback((id: string) => {
        console.log(`[ActivityVotingSection] Voted UP on activity: ${id}`);
        handleVote(id, 'up')
    }, [handleVote]);

    const handleVoteDown = useCallback((id: string) => {
        console.log(`[ActivityVotingSection] Voted DOWN on activity: ${id}`);
        handleVote(id, 'down')
    }, [handleVote]);

    const handleDeleteActivityLocal = useCallback((activityId: string) => {
        console.log(`Requesting delete for activity: ${activityId}`);
        onDeleteActivity(activityId);
    }, [onDeleteActivity]);

    const handleAddExpenseFromActivity = useCallback(
      (activity: ProposedActivity) => {
        setActivityForExpense(activity);
        setExpenseModalVisible(true);
      },
      []
    );

    const handleProposeNewActivity = () => {
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
        console.log("[ActivityVotingSection] Submitting proposed activity:");
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
          console.error("[ActivityVotingSection] Failed to propose activity:", err);
          setSnackbarMessage(`Error proposing: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setSnackbarVisible(true);
          throw err;
        }
    }, [tripId, editingActivity]);

    const handleExpenseSubmit = useCallback(async (expenseData: any) => {
        try {
            const result = await ExpenseHandler.addExpense(tripId, expenseData);
            if (result.success) {
                console.log("[ActivityVotingSection] Expense submitted:");
                setSnackbarMessage("Expense added successfully!");
                setSnackbarVisible(true);
                setExpenseModalVisible(false);
                setActivityForExpense(null);
            } else {
                throw result.error;
            }
        } catch (err) {
            console.error("[ActivityVotingSection] Failed to add expense:", err);
            setSnackbarMessage(`Error adding expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setSnackbarVisible(true);
        }
    }, [tripId, members, trip]);

    const debouncedSetSearchQuery = useDebouncedCallback((value) => {
      setDebouncedSearchQuery(value);
    }, 300);

    const renderHeader = () => (
      <SearchBar
        searchQuery={searchQuery}
        onChangeSearch={text => {
          setSearchQuery(text);
          debouncedSetSearchQuery(text);
        }}
        placeholder="Search activities..."
      />
    );

    const handleCloseProposeModal = () => {
      setProposeModalVisible(false);
      setEditingActivity(null);
    };

    const handleCloseExpenseModal = () => {
      setExpenseModalVisible(false);
      setActivityForExpense(null);
    };

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
          searchQuery={debouncedSearchQuery}
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
          onDismiss={handleCloseProposeModal}
          title={editingActivity ? "Edit Activity" : "Propose New Activity"}
        >
          <ProposeActivityModal
            visible={proposeModalVisible}
            onClose={handleCloseProposeModal}
            onSubmit={handleProposeSubmit}
            currentUserName={currentUserName}
            initialData={editingActivity || undefined}
          />
        </CommonModal>

        <AddExpenseModal
          visible={expenseModalVisible}
          onDismiss={handleCloseExpenseModal}
          onSubmit={handleExpenseSubmit}
          tripId={tripId}
          initialData={activityForExpense ? {
            activityName: activityForExpense.name,
            paidBy: activityForExpense.suggestedByName,
            amount: activityForExpense.estCost,
            createdAt: activityForExpense.createdAt,
          } : undefined}
          onWatchAd={() => {
            // TODO: Implement ad watching functionality
            console.log('[ActivityVotingSection] Watch ad functionality not implemented yet');
          }}
        />

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