import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Surface,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { SettingItem, SettingSection } from '@/src/components/SettingItem';
import { ScreenHeader } from '@/src/components/ScreenHeader';

interface PrivacyOption {
  id: string;
  title: string;
  subtitle: string;
  value: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export default function PrivacySettingsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [privacySettings, setPrivacySettings] = useState<PrivacyOption[]>([
    {
      id: 'profileVisibility',
      title: 'Public Profile',
      subtitle: 'Allow others to find and view your profile',
      value: true,
      icon: 'person-outline',
    },
    {
      id: 'showOnlineStatus',
      title: 'Show Online Status',
      subtitle: 'Let friends see when you\'re active',
      value: false,
      icon: 'radio-outline',
    },
    {
      id: 'allowFriendRequests',
      title: 'Allow Friend Requests',
      subtitle: 'Receive friend requests from other users',
      value: true,
      icon: 'people-outline',
    },
    {
      id: 'showTripHistory',
      title: 'Show Trip History',
      subtitle: 'Display your past trips on your profile',
      value: true,
      icon: 'map-outline',
    },
    {
      id: 'shareLocation',
      title: 'Share Location',
      subtitle: 'Share your location during active trips',
      value: false,
      icon: 'location-outline',
    },
    {
      id: 'dataAnalytics',
      title: 'Usage Analytics',
      subtitle: 'Help improve the app by sharing usage data',
      value: true,
      icon: 'analytics-outline',
    },
    {
      id: 'personalizedAds',
      title: 'Personalized Ads',
      subtitle: 'Show ads based on your interests and activity',
      value: false,
      icon: 'megaphone-outline',
    },
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
      value: true,
      icon: 'notifications-outline',
    },
  ]);

  const toggleSetting = (id: string) => {
    setPrivacySettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, value: !setting.value } : setting
      )
    );
  };

  const renderSection = (title: string, items: PrivacyOption[]) => (
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

  const profileSettings = privacySettings.slice(0, 4);
  const dataSettings = privacySettings.slice(4, 7);
  const notificationSettings = privacySettings.slice(7);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Privacy Settings"
        subtitle="Control who can see your information and how your data is used"
      />

      <View style={styles.content}>
        {renderSection('Profile & Visibility', profileSettings)}
        {renderSection('Data & Analytics', dataSettings)}
        {renderSection('Notifications', notificationSettings)}

        <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              About Privacy
            </Text>
          </View>
          <Text style={[styles.infoText, { color: theme.colors.subtext }]}>
            We're committed to protecting your privacy. These settings help you control how your 
            information is shared and used. You can change these settings at any time.
          </Text>
          <Text style={[styles.infoLink, { color: theme.colors.primary }]}>
            Learn more about our privacy policy
          </Text>
        </Surface>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
}); 