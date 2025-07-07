import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Switch, Surface, Divider, List, Button, RadioButton, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { StatusBar } from 'expo-status-bar';
import ProfileHeader from './ProfileHeader';

const APPEARANCE_SETTINGS = [
  { key: 'darkMode', label: 'Dark Mode', description: 'Enable dark mode appearance' },
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
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [appearance, setAppearance] = useState({
    darkMode: isDarkMode,
    compactView: false,
  });

  const [soundSettings, setSoundSettings] = useState({
    inAppSounds: true,
    vibration: true,
  });
  const [showBackupOptions, setShowBackupOptions] = useState(false);

  const toggleSetting = async (section: 'appearance', key: string) => {
    if (section === 'appearance') {
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

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}> 
          <ProfileHeader title="App Settings" subtitle='' /> 
        </View>
        <ScrollView 
          style={[styles.container, isDarkMode && styles.darkContainer]}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
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
                  right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.text} />}
                  onPress={() => {/* TODO: Implement settings detail screen */}}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.subtext }}
                  style={{ backgroundColor: theme.colors.surface }}
                />
              ))}
            </View>
          </Surface>
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, isDarkMode && styles.darkText]}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 12,
  },
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
  },
  exportButton: {
    borderColor: '#2563EB',
  },
  topMargin: {
    marginTop: 12,
  },
}); 