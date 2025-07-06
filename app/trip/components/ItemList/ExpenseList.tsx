import React, { memo } from 'react';
import { Expense } from '@/src/types/DataTypes';
import ExpenseCard from '@/app/trip/components/ExpenseCard';
import GenericList from '@/app/trip/components/ItemList/GenericList';
import { format, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ExpenseListProps {
  expenses: Expense[];
  searchQuery: string;
  profiles: Record<string, string>;
  expandedId: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleExpand: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  styles: any;
}

// TODO Change if introducing custom date
// Helper to format date for grouping
function getDateString(date: Timestamp | Date | string | undefined): string {
  if (!date) {
    return "Unknown Date";
  }

  let jsDate: Date;
  if (typeof date === "string") {
    // Try parsing as D/M/YYYY
    jsDate = parse(date, 'd/M/yyyy', new Date());
    if (isNaN(jsDate.getTime())) {
      // Try parsing as D/MM/YYYY
      jsDate = parse(date, 'dd/MM/yyyy', new Date());
    }
    if (isNaN(jsDate.getTime())) {
      // Try ISO or fallback
      jsDate = new Date(date);
    }
  } else if (date instanceof Date) {
    jsDate = date;
  } else if (date instanceof Timestamp) {
    jsDate = date.toDate();
  } else if (date && typeof (date as any).toDate === "function") {
    jsDate = (date as any).toDate();
  } else {
    return "Unknown Date";
  }
  if (isNaN(jsDate.getTime())) {
    return "Unknown Date";
  }
  return format(jsDate, "MMM d, yyyy");
}

function groupExpensesByDate(expenses: Expense[]) {
  const groups: { [date: string]: Expense[] } = {};
  expenses.forEach(expense => {
    const dateStr = getDateString(expense.createdAt);
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(expense);
  });
  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groups).sort((a, b) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    return bDate.getTime() - aDate.getTime();
  });
  return sortedDates.map(date => ({ title: date, data: groups[date] }));
}

const ExpenseList = memo(({
  expenses,
  searchQuery,
  profiles,
  expandedId,
  isRefreshing,
  onRefresh,
  onToggleExpand,
  onDeleteExpense,
  onEditExpense,
  styles,
}: ExpenseListProps) => {
  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <ExpenseCard
      expense={item}
      isExpanded={item.id === expandedId}
      onToggleExpand={onToggleExpand}
      onDelete={onDeleteExpense}
      onEdit={onEditExpense}
    />
  );

  const searchFields = (expense: Expense) => [
    expense.activityName,
    profiles[expense.paidByAndAmounts[0]?.memberId] || ''
  ];

  const sections = groupExpensesByDate(expenses);

  return (
    <GenericList
      sections={sections}
      searchQuery={searchQuery}
      profiles={profiles}
      renderItem={renderExpenseItem}
      searchFields={searchFields}
      emptyMessage={{
        withSearch: 'No matching expenses found.',
        withoutSearch: 'No expenses added yet.'
      }}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      styles={styles}
      expandedId={expandedId}
    />
  );
});

export default ExpenseList; 