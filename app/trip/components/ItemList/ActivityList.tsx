import React, { memo } from 'react';
import { ProposedActivity } from '@/src/types/DataTypes';
import ActivityCard from '@/src/TripSections/Activity/components/ActivityCard';
import GenericList from '@/app/trip/components/ItemList/GenericList';
import { format, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

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

function getDateString(date: string | Timestamp | Date | undefined): string {
  if (!date) return 'Unknown Date';
  let jsDate: Date;
  if (typeof date === 'string') {
    jsDate = parse(date, 'M/d/yyyy', new Date());
    if (isNaN(jsDate.getTime())) {
      jsDate = new Date(date);
    }
  } else if (date instanceof Timestamp) {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else if (date && typeof (date as any).toDate === 'function') {
    jsDate = (date as any).toDate();
  } else {
    return 'Unknown Date';
  }
  if (isNaN(jsDate.getTime())) return 'Unknown Date';
  return format(jsDate, 'MMM d, yyyy');
}

function groupActivitiesByDate(activities: ProposedActivity[]) {
  const groups: { [date: string]: ProposedActivity[] } = {};
  activities.forEach(activity => {
    const dateStr = getDateString(activity.createdAt);
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(activity);
  });
  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groups).sort((a, b) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    return bDate.getTime() - aDate.getTime();
  });
  return sortedDates.map(date => ({ title: date, data: groups[date] }));
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

  const sections = groupActivitiesByDate(activities || []);

  return (
    <GenericList
      sections={sections}
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