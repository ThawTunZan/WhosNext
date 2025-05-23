export interface NotificationSettings {
  tripUpdates: boolean;
  expenseAlerts: boolean;
  friendRequests: boolean;
  tripReminders: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
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