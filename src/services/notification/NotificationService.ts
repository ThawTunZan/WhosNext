import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationBehavior } from 'expo-notifications';
import { NotificationSettings, DEFAULT_SETTINGS } from './types';
import { STORAGE_KEYS } from './constants';

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await this.setupAndroidChannel();
    }

    return true;
  }

  private static async setupAndroidChannel() {
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
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Specific notification senders
  static async sendTripUpdate(title: string, body: string, data?: Record<string, any>) {
    const settings = await this.getSettings();
    if (settings.tripUpdates) {
      await this.sendNotification(title, body, 'trips', data);
    }
  }

  static async sendExpenseAlert(title: string, body: string, data?: Record<string, any>) {
    const settings = await this.getSettings();
    if (settings.expenseAlerts) {
      await this.sendNotification(title, body, 'expenses', data);
    }
  }

  static async sendFriendRequest(title: string, body: string, data?: Record<string, any>) {
    const settings = await this.getSettings();
    if (settings.friendRequests) {
      await this.sendNotification(title, body, 'social', data);
    }
  }

  static async sendTripReminder(title: string, body: string, data?: Record<string, any>) {
    const settings = await this.getSettings();
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