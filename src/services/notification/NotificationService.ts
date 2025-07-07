import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationBehavior } from 'expo-notifications';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/src/types/DataTypes';
import { STORAGE_KEYS } from '@/src/services/notification/constants';

// Configure default notification behavior
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
}

export class NotificationService {
  static async requestPermissions() {
    if (Platform.OS === 'web') {
      return true; // Web doesn't need explicit permissions
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        if (Platform.OS === 'android') {
          await this.setupAndroidChannel();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  private static async setupAndroidChannel() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('trips', {
      name: 'Trip Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });

    await Notifications.setNotificationChannelAsync('expenses', {
      name: 'Expense Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#059669',
    });

    await Notifications.setNotificationChannelAsync('social', {
      name: 'Social',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  static async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  // Specific notification senders
  static async sendTripUpdate(title: string, body: string, data?: Record<string, any>) {
    if (Platform.OS === 'web') {
      console.log('Trip Update Notification (Web):', { title, body, data });
      return;
    }
    const settings = await this.getSettings();
    // if trip updates alerts are enabled
    if (settings.tripUpdates) {
      await this.sendNotification(title, body, 'trips', data);
    }
  }

  static async sendExpenseAlert(title: string, body: string, data?: Record<string, any>) {
    if (Platform.OS === 'web') {
      console.log('Expense Alert Notification (Web):', { title, body, data });
      return;
    }
    const settings = await this.getSettings();
    // if expense alerts are enabled
    if (settings.expenseAlerts) {
      await this.sendNotification(title, body, 'expenses', data);
    } 
  }

  static async sendFriendRequest(title: string, body: string, data?: Record<string, any>) {
    if (Platform.OS === 'web') {
      console.log('Friend Request Notification (Web):', { title, body, data });
      return;
    }
    const settings = await this.getSettings();
    // if friend requests alerts are enabled
    if (settings.friendRequests) {
      await this.sendNotification(title, body, 'social', data);
    }
  }

  static async sendTripReminder(title: string, body: string, data?: Record<string, any>) {
    if (Platform.OS === 'web') {
      console.log('Trip Reminder Notification (Web):', { title, body, data });
      return;
    }
    const settings = await this.getSettings();
    // if trip reminders alerts are enabled
    if (settings.tripReminders) {
      await this.sendNotification(title, body, 'trips', data);
    }
  }

  private static async sendNotification(
    title: string, 
    body: string, 
    channel: string = 'default',
    data?: Record<string, any>
  ) {
    if (Platform.OS === 'web') {
      console.log('Notification (Web):', { title, body, channel, data });
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  }
} 

export { NotificationSettings };
