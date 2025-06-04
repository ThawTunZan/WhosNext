// src/types/expenses.ts

import { Timestamp } from "firebase/firestore";

export type MemberInfo = { name: string }; // Basic info for components needing just name

export enum AddMemberType {
  FRIENDS = "friends",
  INVITE_LINK = "invite link",
  QR_CODE = "qr code",
  MOCK = "mock"
}

export type OwesTotalMap = Record<Currency, number>;

// Individual member data
export type Member = {
  id: string;
  budget: number;
  amtLeft: number;
  currency: Currency;
  claimCode?: string;
  premiumUser: boolean;
  addMemberType: AddMemberType;
  owesTotalMap: OwesTotalMap;
};

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'SGD'; 
  
export type Expenses = {[id:string]: {expense: Expense}}
  
  // Type for how an expense is shared among payees
export type SharedWith = {
  payeeID: string;
  amount: number;
};
  
  // Type for a single expense item
export type Expense = {
  id: string; // Firestore document ID
  activityName: string;
  paidById: string; // Name of the person who paid
  paidAmt: number;
  sharedWith: SharedWith[];
  createdAt?: string; // Firestore Timestamp type for consistency
  currency: Currency;
};

// Props for the main ExpensesSection component
export type ExpensesSectionProps = {
  tripId: string;
  members: Record<string, Member>;
  // Consider removing setIsRowSwiping if swipe logic is handled differently or locally
  // setIsRowSwiping: (v: boolean) => void;
  onAddExpensePress: () => void;
  onEditExpense: (expense: Expense) => void;
  nextPayerId: string | null
};

// Props for the ExpenseListItem component
export type ExpenseListItemProps = {
  item: Expense;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void; // Delete handler
  onEdit: (expense: Expense) => void;
};

// Props for the AddExpenseModal component
export interface AddExpenseModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (expenseData: Expense, editingExpenseId?: string) => Promise<void>;
  members: Record<string, Member>;
  tripId: string;
  initialData?: Partial<Expense>;
  editingExpenseId?: string;
  suggestedPayerId?: string;
}

// Props for the ActivityVotingSection component
export type ActivityVotingSectionProps = {
  tripId: string; // Might be needed later for backend calls
  members: Record<string, Member>; // Might be needed for displaying member names/avatars
  onAddExpenseFromActivity: (activity: ProposedActivity) => void;
  onDeleteActivity: (activityId: string) => void;
};

// Props for the ActivityCard component
export type ActivityCardProps = {
  activity: ProposedActivity;
  onVoteUp: (id: string) => void; // Placeholder functions for now
  onVoteDown: (id: string) => void;
  onAddExpense: (activity: ProposedActivity) => void; // Placeholder
  onDelete: (activityId: string) => void;
  onEdit: (activity: ProposedActivity) => void;
};

export type VoteType = 'up' | 'down';

export type ProposedActivity = {
  id: string; // Firestore document ID
  name: string;
  description?: string | null;
  suggestedByID: string | null;
  estCost?: number | null;
  currency: Currency;
  createdAt: Timestamp; // Firestore Timestamp
  votes: {
      [userId: string]: VoteType; // Map of UserID -> 'up' or 'down'
  };
  votesUp: number;
  votesDown: number;
};

// Type for data needed to CREATE a new proposed activity
// Excludes fields generated automatically (id, createdAt, votes, votesUp, votesDown)
export type NewProposedActivityData = Omit<ProposedActivity,
    'id' | 'createdAt' | 'votes' | 'votesUp' | 'votesDown'
>;

export type ProposeActivityModalProps = {
  visible: boolean;
  onClose: () => void;
  // onSubmit should handle the async call and return Promise<void>
  // so the modal knows when the submission attempt is complete.
  onSubmit: (data: NewProposedActivityData) => Promise<void>;
  // Pass current user's ID and Name to assign as proposer
  currentUserId: string | null;
  currentUserName: string | null;
  initialData?: Partial<NewProposedActivityData>
};

export interface TripData {
  destination: string;
  members?: Record<string, Member>; // Use detailed Member
  totalBudget?: number;
  totalAmtLeft?: number;
  debts?: Record<string, number>; // Keep simple debts map for now
  // expenses field seems unused in state, data comes from hook/listener
  userId: string;
  currency: Currency;
}

