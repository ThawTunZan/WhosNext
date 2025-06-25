import React, { memo } from 'react';
import { ProposedActivity } from '@/src/types/DataTypes';
import ActivityCard from '@/src/TripSections/Activity/components/ActivityCard';
import GenericList from '@/app/trip/components/ItemList/GenericList';

interface ActivityListProps {
  activities: ProposedActivity[];
  searchQuery: string;
  profiles: Record<string, string>;
  onVoteUp: (id: string) => void;
  onVoteDown: (id: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
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
  isRefreshing,
  onRefresh,
  onAddExpense,
  onDelete,
  onEdit,
  styles,
}: ActivityListProps) => {
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

  const searchFields = (activity: ProposedActivity) => [
    activity.name,
    activity.description || '',
    profiles[activity.suggestedByID]?.toString() || ''
  ];

  return (
    <GenericList
      data={activities}
      searchQuery={searchQuery}
      profiles={profiles}
      renderItem={renderActivityItem}
      searchFields={searchFields}
      emptyMessage={{
        withSearch: 'No matching activities found.',
        withoutSearch: 'No activities proposed yet.'
      }}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      styles={styles}
    />
  );
});

export default ActivityList; 