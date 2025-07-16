// src/types/expenses.ts

import { FieldValue, Timestamp } from "firebase/firestore";

// Firestore Trip Document Type
export type FirestoreTrip = {
  activitiesCount: number;
  createdBy: string;
  currency: string;
  debts: {
    [currency: string]: {
      [pair: string]: number;
    };
  };
  destination: string;
  endDate: any; // Timestamp or string
  expensesCount: number;
  isTripPremium: boolean;
  members: {
    [username: string]: {
      addMemberType: string;
      amtLeft: number;
      budget: number;
      currency: string;
      owesTotalMap: {
        [currency: string]: number;
      };
      receiptsCount: number;
      username: string;
    };
  };
  startDate: any; // Timestamp or string
  totalAmtLeft: number;
  totalBudget: number;
  premiumStatus: string;
  dailyExpenseLimit?: { [date: string]: number };
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

export type UserFromFirebase = {
    username?: string
    fullName?: string
    primaryEmailAddress?: { emailAddress: string }
    profileImageUrl?: string
    friends?: string[]
    incomingFriendRequests?: { senderUsername: string, status: string, timestamp: string }[]
    outgoingFriendRequests?: { receiverUsername: string, status: string, timestamp: string }[]
    trips: string[],
    premiumStatus: string,
}

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


export enum PremiumStatus {
  PREMIUM = 'premium',
  FREE = 'free',
  TRIAL = 'trial'
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

export type MemberInfo = { name: string }; // Basic info for components needing just name

export enum AddMemberType {
  FRIENDS = "friends",
  INVITE_LINK = "invite link",
  QR_CODE = "qr code",
  MOCK = "mock"
}

export type OwesTotalMap = Record<string, number>;

// Individual member data
export type Member = {
  username: string;
  budget: number;
  amtLeft: number;
  currency: string;
  claimCode?: string;
  addMemberType: AddMemberType;
  owesTotalMap: OwesTotalMap;
  receiptsCount: number;
}; 
  
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
  paidByAndAmounts: {memberName: string, amount: string}[];
  sharedWith: SharedWith[];
  createdAt: Timestamp; // Firestore Timestamp type for consistency
  currency: string;
};

// Props for the main ExpensesSection component
export type ExpensesSectionProps = {
  tripId: string;
  // Consider removing setIsRowSwiping if swipe logic is handled differently or locally
  // setIsRowSwiping: (v: boolean) => void;
  onAddExpensePress: () => void;
  onEditExpense: (expense: Expense) => void;
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
  suggestedPayerName?: string;
}

// Props for the ActivityVotingSection component
export type ActivityVotingSectionProps = {
  tripId: string; // Might be needed later for backend calls
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
  members?: Record<string, Member>; // Use detailed Member
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

