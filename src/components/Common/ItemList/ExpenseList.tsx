import React, { memo } from 'react';
import { ExpenseDDB } from '@/src/types/DataTypes';
import ExpenseCard from '@/src/components/Trip/Expenses/components/ExpenseCard';
import GenericList from '@/src/components/Common/ItemList/GenericList';
import { groupByDate } from '@/src/components/Common/DateButton';

interface ExpenseListProps {
  expenses: ExpenseDDB[];
  searchQuery: string;
  expandedId: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleExpand: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: ExpenseDDB) => void;
  styles: any;
}

const ExpenseList = memo(({
  expenses,
  searchQuery,
  expandedId,
  isRefreshing,
  onRefresh,
  onToggleExpand,
  onDeleteExpense,
  onEditExpense,
  styles,
}: ExpenseListProps) => {
  const renderExpenseItem = ({ item }: { item: ExpenseDDB }) => (
    <ExpenseCard
      expense={item}
      isExpanded={item.expenseId === expandedId}
      onToggleExpand={onToggleExpand}
      onDelete={onDeleteExpense}
      onEdit={onEditExpense}
    />
  );

  const searchFields = (expense: ExpenseDDB) => [
    expense.activityName,
    expense.paidBy || ''
  ];

  const sections = groupByDate(expenses);

  return (
    <GenericList
      sections={sections}
      searchQuery={searchQuery}
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