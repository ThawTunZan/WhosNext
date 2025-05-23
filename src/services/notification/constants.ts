export const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: 'notification_settings',
  NOTIFICATION_TOKEN: 'notification_token',
} as const;

export const NOTIFICATION_TYPES = {
  TRIP_UPDATE: 'TRIP_UPDATE',
  EXPENSE_ALERT: 'EXPENSE_ALERT',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  TRIP_REMINDER: 'TRIP_REMINDER',
} as const;

export const CHANNEL_CONFIG = {
  default: {
    name: 'Default',
    importance: 'MAX',
    color: '#FF231F7C',
  },
  trips: {
    name: 'Trip Updates',
    importance: 'HIGH',
    color: '#2563EB',
  },
  expenses: {
    name: 'Expense Alerts',
    importance: 'HIGH',
    color: '#059669',
  },
  social: {
    name: 'Social',
    importance: 'DEFAULT',
    color: '#7C3AED',
  },
} as const; 