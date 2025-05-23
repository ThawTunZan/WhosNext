import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Text, Switch, Surface, Divider, List, Button, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService, NotificationSettings } from '@/src/services/notification/NotificationService';
import { useTheme } from '@/src/context/ThemeContext';

const NOTIFICATION_SETTINGS = [
  { key: 'tripUpdates', label: 'Trip Updates', description: 'Get notified about changes to your trips' },
  { key: 'expenseAlerts', label: 'Expense Alerts', description: 'Receive alerts about new expenses and payments' },
  { key: 'friendRequests', label: 'Friend Requests', description: 'Get notified about new friend requests' },
  { key: 'tripReminders', label: 'Trip Reminders', description: 'Receive reminders about upcoming trips' },
];

const APPEARANCE_SETTINGS = [
  { key: 'darkMode', label: 'Dark Mode', description: 'Enable dark mode appearance' },
  { key: 'compactView', label: 'Compact View', description: 'Show more content with less spacing' },
];

const CURRENCY_OPTIONS = [
  'USD - US Dollar',
  'EUR - Euro',
  'GBP - British Pound',
  'JPY - Japanese Yen',
  'AUD - Australian Dollar',
  'CAD - Canadian Dollar',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
];

const PRIVACY_SETTINGS = [
  { key: 'shareAnalytics', label: 'Share Analytics', description: 'Help improve the app by sharing usage data' },
  { key: 'locationServices', label: 'Location Services', description: 'Enable location-based features' },
  { key: 'tripSharing', label: 'Trip Sharing', description: 'Allow others to find your public trips' },
];

const SOUND_SETTINGS = [
  { key: 'inAppSounds', label: 'In-App Sounds', description: 'Play sounds for actions and notifications' },
  { key: 'vibration', label: 'Vibration', description: 'Vibrate on actions and alerts' },
];

const DEFAULT_TRIP_SETTINGS = [
  { key: 'autoSplitBills', label: 'Auto-split Bills', description: 'Automatically split bills equally' },
  { key: 'reminderFrequency', label: 'Default Reminder Frequency', description: 'Set how often to get trip reminders' },
  { key: 'expenseCategories', label: 'Default Categories', description: 'Manage default expense categories' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, setDarkMode } = useTheme();
  const [notifications, setNotifications] = useState<NotificationSettings>({
    tripUpdates: true,
    expenseAlerts: true,
    friendRequests: true,
    tripReminders: true,
  });
  const [appearance, setAppearance] = useState({
    darkMode: isDarkMode,
    compactView: false,
  });
  const [selectedCurrency, setSelectedCurrency] = useState('USD - US Dollar');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: true,
    locationServices: true,
    tripSharing: false,
  });
  const [soundSettings, setSoundSettings] = useState({
    inAppSounds: true,
    vibration: true,
  });
  const [showBackupOptions, setShowBackupOptions] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
    checkNotificationPermissions();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await NotificationService.getSettings();
      setNotifications(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    const hasPermission = await NotificationService.requestPermissions();
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

  const toggleNotification = async (key: keyof NotificationSettings) => {
    try {
      const newSettings = await NotificationService.updateSettings({
        [key]: !notifications[key],
      });
      setNotifications(newSettings);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const toggleSetting = async (section: 'notifications' | 'appearance', key: string) => {
    if (section === 'notifications') {
      setNotifications(prev => ({
        ...prev,
        [key]: !prev[key as keyof typeof notifications],
      }));
    } else if (section === 'appearance') {
      if (key === 'darkMode') {
        const newValue = !appearance.darkMode;
        setAppearance(prev => ({
          ...prev,
          darkMode: newValue,
        }));
        setDarkMode(newValue);
      } else {
        setAppearance(prev => ({
          ...prev,
          [key]: !prev[key as keyof typeof appearance],
        }));
      }
    }
  };

  const clearAppData = async () => {
    try {
      await AsyncStorage.clear();
      // Additional cleanup if needed
    } catch (error) {
      console.error('Error clearing app data:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Notifications</Text>
        <View style={styles.settingsList}>
          {NOTIFICATION_SETTINGS.map((setting, index) => (
            <React.Fragment key={setting.key}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{setting.label}</Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.darkSubtext]}>
                    {setting.description}
                  </Text>
                </View>
                <Switch
                  value={notifications[setting.key as keyof NotificationSettings]}
                  onValueChange={() => toggleNotification(setting.key as keyof NotificationSettings)}
                />
              </View>
              {index < NOTIFICATION_SETTINGS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Appearance</Text>
        <View style={styles.settingsList}>
          {APPEARANCE_SETTINGS.map((setting, index) => (
            <React.Fragment key={setting.key}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{setting.label}</Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.darkSubtext]}>
                    {setting.description}
                  </Text>
                </View>
                <Switch
                  value={appearance[setting.key as keyof typeof appearance]}
                  onValueChange={() => toggleSetting('appearance', setting.key)}
                />
              </View>
              {index < APPEARANCE_SETTINGS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Language</Text>
        <List.Accordion
          title={LANGUAGE_OPTIONS.find(lang => lang.code === selectedLanguage)?.label || 'English'}
          expanded={showLanguagePicker}
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          style={styles.pickerStyle}
        >
          {LANGUAGE_OPTIONS.map((language) => (
            <RadioButton.Item
              key={language.code}
              label={language.label}
              value={language.code}
              status={selectedLanguage === language.code ? 'checked' : 'unchecked'}
              onPress={() => {
                setSelectedLanguage(language.code);
                setShowLanguagePicker(false);
              }}
            />
          ))}
        </List.Accordion>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Privacy</Text>
        <View style={styles.settingsList}>
          {PRIVACY_SETTINGS.map((setting, index) => (
            <React.Fragment key={setting.key}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{setting.label}</Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.darkSubtext]}>
                    {setting.description}
                  </Text>
                </View>
                <Switch
                  value={privacySettings[setting.key as keyof typeof privacySettings]}
                  onValueChange={() => {
                    setPrivacySettings(prev => ({
                      ...prev,
                      [setting.key]: !prev[setting.key as keyof typeof privacySettings],
                    }));
                  }}
                />
              </View>
              {index < PRIVACY_SETTINGS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Sound & Haptics</Text>
        <View style={styles.settingsList}>
          {SOUND_SETTINGS.map((setting, index) => (
            <React.Fragment key={setting.key}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{setting.label}</Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.darkSubtext]}>
                    {setting.description}
                  </Text>
                </View>
                <Switch
                  value={soundSettings[setting.key as keyof typeof soundSettings]}
                  onValueChange={() => {
                    setSoundSettings(prev => ({
                      ...prev,
                      [setting.key]: !prev[setting.key as keyof typeof soundSettings],
                    }));
                  }}
                />
              </View>
              {index < SOUND_SETTINGS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Default Trip Settings</Text>
        <View style={styles.settingsList}>
          {DEFAULT_TRIP_SETTINGS.map((setting, index) => (
            <List.Item
              key={setting.key}
              title={setting.label}
              description={setting.description}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement settings detail screen */}}
            />
          ))}
        </View>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Backup & Sync</Text>
        <List.Accordion
          title="Backup Options"
          expanded={showBackupOptions}
          onPress={() => setShowBackupOptions(!showBackupOptions)}
          style={styles.pickerStyle}
        >
          <List.Item
            title="Backup Now"
            left={props => <List.Icon {...props} icon="cloud-upload" />}
            onPress={() => {/* TODO: Implement backup */}}
          />
          <List.Item
            title="Restore from Backup"
            left={props => <List.Icon {...props} icon="cloud-download" />}
            onPress={() => {/* TODO: Implement restore */}}
          />
          <List.Item
            title="Auto-Backup"
            left={props => <List.Icon {...props} icon="clock-outline" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
        </List.Accordion>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Export Data</Text>
        <View style={styles.settingsList}>
          <Button 
            mode="outlined" 
            icon="file-export"
            onPress={() => {/* TODO: Implement export */}}
            style={styles.exportButton}
          >
            Export as CSV
          </Button>
          <Button 
            mode="outlined" 
            icon="file-pdf-box"
            onPress={() => {/* TODO: Implement export */}}
            style={[styles.exportButton, styles.topMargin]}
          >
            Export as PDF
          </Button>
        </View>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Currency</Text>
        <List.Accordion
          title={selectedCurrency}
          expanded={showCurrencyPicker}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          style={styles.currencyPicker}
        >
          {CURRENCY_OPTIONS.map((currency) => (
            <List.Item
              key={currency}
              title={currency}
              onPress={() => {
                setSelectedCurrency(currency);
                setShowCurrencyPicker(false);
              }}
              left={() => <List.Icon icon="currency-usd" />}
            />
          ))}
        </List.Accordion>
      </Surface>

      <Surface style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Data & Storage</Text>
        <View style={styles.settingsList}>
          <Button 
            mode="outlined" 
            onPress={clearAppData}
            style={styles.dangerButton}
            textColor="#EF4444"
          >
            Clear App Data
          </Button>
        </View>
      </Surface>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, isDarkMode && styles.darkText]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  section: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  darkSection: {
    backgroundColor: '#1F2937',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    color: '#1F2937',
  },
  darkText: {
    color: '#F9FAFB',
  },
  settingsList: {
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 4,
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  darkSubtext: {
    color: '#9CA3AF',
  },
  currencyPicker: {
    backgroundColor: 'white',
  },
  dangerButton: {
    borderColor: '#EF4444',
    marginTop: 8,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pickerStyle: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  exportButton: {
    borderColor: '#2563EB',
  },
  topMargin: {
    marginTop: 12,
  },
}); 