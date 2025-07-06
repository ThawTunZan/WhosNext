import React, { memo } from 'react';
import { Expense } from '@/src/types/DataTypes';
import ExpenseCard from '@/app/trip/components/ExpenseCard';
import GenericList from '@/app/trip/components/ItemList/GenericList';
import { groupByDate } from '@/src/trip/components/DateButton';

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

  const sections = groupByDate(expenses);

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