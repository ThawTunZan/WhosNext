// src/types/expenses.ts

import { FieldValue, Timestamp } from "firebase/firestore";

export type Friend = {
  username: string,
  timestamp: any,
}

// One row inside the "sharedWith" list attribute
export type SharedWithDDB = {
  payeeName: string;
  amount: number;
  currency: string;
};

// Expense item as it lives in DynamoDB/AppSync
export type ExpenseDDB = {
  expenseId: string;               
  tripId: string;         
  activityName: string;     
  amount: number;           
  currency: string;        
  paidBy: string;            
  sharedWith?: SharedWithDDB[];
  createdAt: string;         
  updatedAt: string;         
};


export type MemberDDB = {
  userId: string;
  username: string;
  tripId: string;
  amtLeft: number;
  budget: number;
  owesTotalMap: Record<string, number>;
  addMemberType?: string;
  receiptsCount?: number;
  createdAt: string;
  updatedAt: string;
  currency: string;
};

// ------------------- Trips -------------------

export type TripsTableDDB = {
  tripId: string;
  destinationName: string;
  currency: string;
  createdBy: string;
  debts: string[];
  isTripPremium: boolean;
  totalAmtLeft: number;
  totalBudget: number;
  createdAt: string; // ISO string from AWSDateTime
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  members: string[];
};

// ------------------- Debts -------------------

export type DebtDDB = {
  id: string;
  tripId: string;
  currency: string;
  debtor: string;   // username/id
  creditor: string; // username/id
  amount: number;
  createdAt: string;
  updatedAt: string;
};

// ------------------- Users -------------------

export enum PremiumStatus {
  PREMIUM = 'premium',
  FREE = 'free',
  TRIAL = 'trial'
}

export type UserDDB = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  premiumStatus: PremiumStatus;
  friends?: string[]; // userId
  incomingFriendRequests?: string[]; // IDs of FriendRequest
  outgoingFriendRequests?: string[]; // IDs of FriendRequest
  createdAt: string;
  updatedAt: string;
  trips: string[];
};

export type FirestoreExpense = {
  id: string;
  activityName: string;
  createdAt: any; // Timestamp or string
  currency: string;
  paidByAndAmounts: {
    amount: string;
    memberName: string;
  }[];
  sharedWith: {
    amount: number;
    currency: string;
    payeeName: string;
  }[];
};
// -----------------------------------------------------------------------

export enum ErrorType {
  MAX_EXPENSES_FREE_USER = 'maxExpensesFreeUser',
  MAX_EXPENSES_PREMIUM_USER = 'maxExpensesPremiumUser',
  MAX_ACTIVITIES_FREE_USER = 'maxActivitiesFreeUser',
  MAX_ACTIVITIES_PREMIUM_USER = 'maxActivitiesPremiumUser',
  MAX_NUM_OF_RECEIPTS_FREE_USER = 'maxNumOfReceiptsFreeUser',
  MAX_NUM_OF_RECEIPTS_PREMIUM_USER = 'maxNumOfReceiptsPremiumUser',
  MAX_MB_OF_RECEIPT_STORAGE_FREE_USER = 'maxMBOfReceiptStorageFreeUser',
  MAX_MB_OF_RECEIPT_STORAGE_PREMIUM_USER = 'maxMBOfReceiptStoragePremiumUser',
}

interface IUserLimits {
  premiumStatus: PremiumStatus;
  maxTrips: number;
  maxMembers: number;
  maxExpensesPerDayPerTrip: number;
  maxActivities: number;
  maxVotes: number;
  haveCloudStorage: boolean;
  maxNumOfReceiptsPerTrip: number;
  maxMBOfReceiptStoragePerTrip: number;
}

export const FREE_USER_LIMITS: IUserLimits = {
  premiumStatus: PremiumStatus.FREE,
  maxTrips: 5,
  maxMembers: 8,
  maxExpensesPerDayPerTrip: 10,
  maxActivities: 10,
  maxVotes: 10,
  haveCloudStorage: false,
  maxNumOfReceiptsPerTrip: 20,
  maxMBOfReceiptStoragePerTrip: 300,
};

export const PREMIUM_USER_LIMITS: IUserLimits = {
  premiumStatus: PremiumStatus.PREMIUM,
  maxTrips: 20,
  maxMembers: 20,
  maxExpensesPerDayPerTrip: 30,
  maxActivities: 30 ,
  maxVotes: 30,
  haveCloudStorage: true,
  maxNumOfReceiptsPerTrip: 20,
  maxMBOfReceiptStoragePerTrip: 300,
};


export enum AddMemberType {
  MOCK = 'mock',
  INVITE_LINK = 'invite_link',
  QR_CODE = 'qr_code',
  FRIENDS = 'friends',
}

export type OwesTotalMap = Record<string, number>;
export type Expenses = {[id:string]: {expense: Expense}}
  
  // Type for how an expense is shared among payees
export type SharedWith = {
  payeeName: string;
  amount: number;
  currency: string
};
  
  // Type for a single expense item
export type Expense = {
  id: string; // Firestore document ID
  activityName: string;
  paidBy: string;
  amount: number;
  sharedWith: SharedWith[];
  createdAt: any; // Firestore Timestamp type for consistency
  currency: string;
};

// Props for the main ExpensesSection component
export type ExpensesSectionProps = {
  tripId: string;
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
  tripId: string;
  initialData?: Partial<Expense>;
  editingExpenseId?: string;
  suggestedPayerName?: string;
}

// Props for the ActivityVotingSection component
export type ActivityVotingSectionProps = {
  tripId: string; // Might be needed later for backend calls
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
  suggestedByName: string | null;
  estCost?: number | null;
  currency: string;
  createdAt: Timestamp;  // Firestore Timestamp
  votes: {
      [username: string]: VoteType; // Map of UserID -> 'up' or 'down'
  };
  votesUp: number;
  votesDown: number;
};

// Type for data needed to CREATE a new proposed activity
// Excludes fields generated automatically (id, createdAt, votes, votesUp, votesDown)
export type NewProposedActivityData = Omit<ProposedActivity,
    'id' | 'votes' | 'votesUp' | 'votesDown'
>;

export type ProposeActivityModalProps = {
  visible: boolean;
  onClose: () => void;
  // onSubmit should handle the async call and return Promise<void>
  // so the modal knows when the submission attempt is complete.
  onSubmit: (data: NewProposedActivityData) => Promise<void>;
  // Pass current user's ID and Name to assign as proposer
  currentUserName: string | null;
  initialData?: Partial<NewProposedActivityData>
};

export type Debt = {
  fromUserName: string;
  toUserName: string;
  amount: number;
  currency: string;
}

export type Payment = {
  id?: string;
  tripId: string;
  fromUserName: string;
  toUserName: string;
  amount: number;
  currency: string;
  method: 'cash' | 'transfer' | 'other';
  paymentDate: Date | Timestamp;
  note?: string;
  createdTime: Timestamp | FieldValue;
  createdDate: Timestamp | FieldValue;
};

export interface TripData {
  destination: string;
  members?: Record<string, MemberDDB>; // Use detailed Member
  totalBudget?: number;
  totalAmtLeft?: number;
  debts?: Debt[];
  createdBy: string;
  currency: string;
  premiumStatus: PremiumStatus;
  startDate: Timestamp
  endDate: Timestamp
}

//------------------- Notifications -------------------
export interface NotificationSettings {
  emailNotification: boolean,
  pushNotifications: boolean,
  tripUpdates: boolean;
  expenseAlerts: boolean;
  friendRequests: boolean;
  tripReminders: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotification: true,
  pushNotifications: true,
  tripUpdates: true,
  expenseAlerts: true,
  friendRequests: true,
  tripReminders: true,
};

export type NotificationChannel = 'default' | 'trips' | 'expenses' | 'social';

export interface NotificationData {
  type: string;
  id?: string;
  route?: string;
  [key: string]: any;
} 

// Receipt upload limits
export const MAX_CLOUD_RECEIPTS_PER_USER = 5; // Max cloud receipts per user per trip
export const MAX_CLOUD_RECEIPTS_PER_TRIP = 20; // Max cloud receipts per trip (all users combined)
export const MAX_LOCAL_RECEIPTS_PER_USER = Number.POSITIVE_INFINITY; // Unlimited local receipts 

/**
 * Supported currencies for all trip and expense operations.
 *
 * Supported: USD (US Dollar), EUR (Euro), SGD (Singapore Dollar), MYR (Malaysian Ringgit)
 */
export const SUPPORTED_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'SGD', // Singapore Dollar
  'MYR', // Malaysian Ringgit (Ringgit)
] as const;
// All other currency lists in the app should import SUPPORTED_CURRENCIES from this file. 

