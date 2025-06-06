import React, { memo } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { ProposedActivity } from '@/src/types/DataTypes';
import ActivityCard from '@/src/components/ActivityCard';

interface ActivityListProps {
  activities: ProposedActivity[];
  searchQuery: string;
  profiles: Record<string, string>;
  onVoteUp: (id: string) => void;
  onVoteDown: (id: string) => void;
  onAddExpense: (activity: ProposedActivity) => void;
  onDelete: (id: string) => void;
  onEdit: (activity: ProposedActivity) => void;
  styles: any;
}

const ActivityList = memo(({
  activities,
  searchQuery,
  profiles,
  onVoteUp,
  onVoteDown,
  onAddExpense,
  onDelete,
  onEdit,
  styles,
}: ActivityListProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const filteredActivities = activities.filter(activity => {
    const searchLower = searchQuery.toLowerCase();
    return (
      activity.name.toLowerCase().includes(searchLower) ||
      (activity.description?.toLowerCase() || '').includes(searchLower) ||
      profiles[activity.suggestedByID].toString().includes(searchLower)
    );
  });

  const renderActivityItem = ({ item }: { item: ProposedActivity }) => (
    <ActivityCard
      activity={item}
      onVoteUp={onVoteUp}
      onVoteDown={onVoteDown}
      onAddExpense={onAddExpense}
      onDelete={onDelete}
      onEdit={onEdit}
    />
  );

  return (
    <FlatList
      data={filteredActivities}
      renderItem={renderActivityItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.text }}>
            {searchQuery ? 'No matching activities found.' : 'No activities proposed yet.'}
          </Text>
        </View>
      }
      contentContainerStyle={styles.listContentContainer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
});

export default ActivityList; 