import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  Switch,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { SettingItem, SettingSection } from '@/src/components/SettingItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationService, NotificationSettings } from '@/src/services/notification/NotificationService';
import ProfileHeader from './ProfileHeader';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/src/types/DataTypes';

interface NotificationOption {
  id: string;
  title: string;
  subtitle: string;
  value: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export default function NotificationSettingsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [notificationPermissions, setNotificationPermissions] = useState<boolean>(false);

  const [notificationOption, setNotificationOption] = useState<NotificationOption[]>([
    {
      id: 'emailNotifications',
      title: 'Email Notifications',
      subtitle: 'Receive updates and notifications via email',
      value: true,
      icon: 'mail-outline',
    },
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      subtitle: 'Receive notifications on your device',
      value: notificationPermissions,
      icon: 'notifications-outline',
    },
    {
      id: 'tripUpdates',
      title: 'Trip Updates',
      subtitle: 'Get notified about changes to your trips',
      value: notificationPermissions,
      icon: 'notifications-outline',
    },
    {
      id: 'expenseAlerts',
      title: 'Expense Alerts',
      subtitle: 'Receive alerts about new expenses and payments',
      value: notificationPermissions,
      icon: 'notifications-outline',
    },
    {
      id: 'friendRequests',
      title: 'Friend Requests',
      subtitle: 'Get notified about new friend requests',
      value: notificationPermissions,
      icon: 'notifications-outline',
    },
    {
      id: 'tripReminders',
      title: 'Trip Reminders',
      subtitle: 'Receive reminders about upcoming trips',
      value: notificationPermissions,
      icon: 'notifications-outline',
    },

  ]);

  const generalNotificationSettings = notificationOption.slice(0,2);
  const tripNotificationSettings = notificationOption.slice(2,6)


  useEffect(() => {
    loadNotificationSettings();
    checkNotificationPermissions();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await NotificationService.getSettings();
      setNotificationOption(prev =>
        prev.map(option =>
          settings.hasOwnProperty(option.id)
            ? { ...option, value: settings[option.id as keyof typeof settings] }
            : option
        )
      );
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    const hasPermission = await NotificationService.requestPermissions();
    setNotificationPermissions(hasPermission);
    if (!hasPermission) {
      Alert.alert(
        'Notifications Disabled',
        'To receive important updates, please enable notifications in your device settings.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {/* TODO: Open device settings */} }
        ]
      );
    }
  };

  // for the push notification toogle
  const handleNotificationPermissionToggle = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      if (notificationPermissions) {
        // If notifications are currently enabled, show alert about disabling
        Alert.alert(
          'Disable Notifications',
          'To disable notifications, please go to your device settings and turn off notifications for this app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openAppSettings }
          ]
        );
      } else {
        // Request permission
        const hasPermission = await NotificationService.requestPermissions();
        if (hasPermission) {
          setNotificationPermissions(true);
          setNotificationOption(prev =>
            prev.map(setting =>
              setting.id === 'pushNotifications' 
                ? { ...setting, value: true }
                : setting
            )
          );
          Alert.alert(
            'Notifications Enabled',
            'You will now receive push notifications from the app.'
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications in your device settings to receive important updates.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openAppSettings }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error handling notification toggle:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      // On Android, we can't directly open app-specific settings
      Alert.alert(
        'Settings',
        'Please go to Settings > Apps > Who\'s Next > Notifications to manage notification permissions.'
      );
    }
  };

  const toggleSetting = async (id: string) => {
    if (id === 'pushNotifications') {
      handleNotificationPermissionToggle();
      return;
    }
    // Find the current value
    const current = notificationOption.find(opt => opt.id === id);
    if (!current) return;

    // Update backend/service
    try {
      await NotificationService.updateSettings({ [id]: !current.value });
      setNotificationOption(prev =>
        prev.map(setting =>
          setting.id === id ? { ...setting, value: !setting.value } : setting
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const renderGeneralNotiSection = (title: string, items: NotificationOption[]) => (
    <SettingSection title={title}>
      {items.map((item, index) => (
        <SettingItem
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          icon={item.icon}
          value={item.value}
          onToggle={() => toggleSetting(item.id)}
          showDivider={index < items.length - 1}
        />
      ))}
    </SettingSection>
  );

  return (
    <>
      <StatusBar style={isDarkMode ? "dark" : "light"} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}> 
          <ProfileHeader title="Notification Settings" subtitle='Control what notification you will receive from this app'/>
        </View>
        <ScrollView 
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          <View style={styles.content}>
            {renderGeneralNotiSection('General Notifications', generalNotificationSettings)}
          </View>
          <View style={styles.content}>
            {renderGeneralNotiSection('Trip Notifications', tripNotificationSettings)}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1000,
    backgroundColor: '#f5f5f5',
  },
  subtitle: {
    color: '#BDBDBD'
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsList: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  darkSection: {
    backgroundColor: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#999',
  },
}); 