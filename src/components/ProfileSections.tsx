import React from 'react';
import { router } from 'expo-router';
import { SettingItem, SettingSection } from '@/src/components/SettingItem';

interface ProfileSectionItem {
  label: string;
  icon: string;
  action?: string;
  route?: string;
  danger?: boolean;
}

interface ProfileSectionData {
  title: string;
  items: ProfileSectionItem[];
}

interface ProfileSectionsProps {
  sections: ProfileSectionData[];
  onAction: (action: string) => void;
}

export const ProfileSections: React.FC<ProfileSectionsProps> = ({ sections, onAction }) => {
  const handleItemPress = (item: ProfileSectionItem) => {
    if (item.action) {
      onAction(item.action);
    } else if (item.route) {
      router.push(item.route);
    }
  };

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <SettingSection key={sectionIndex} title={section.title}>
          {section.items.map((item, itemIndex) => (
            <SettingItem
              key={itemIndex}
              title={item.label}
              icon={item.icon as any}
              onPress={() => handleItemPress(item)}
              showDivider={itemIndex < section.items.length - 1}
              rightComponent={
                <div style={{ 
                  color: item.danger ? '#EF4444' : undefined,
                  fontSize: 20
                }}>
                  ›
                </div>
              }
            />
          ))}
        </SettingSection>
      ))}
    </>
  );
};

// Predefined sections for consistency
export const DEFAULT_PROFILE_SECTIONS: ProfileSectionData[] = [
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', icon: 'pencil-outline', action: 'onEditProfile' },
      { label: 'App Settings', icon: 'settings-outline', route: '/profile_screens/settings' },
      { label: 'Payment Methods', icon: 'card-outline', route: '/profile_screens/PaymentMethodsScreen' },
      { label: 'Change Password', icon: 'key-outline', action: 'onChangePassword' },
    ],
  },
  {
    title: 'Social',
    items: [
      { label: 'Friends & Groups', icon: 'people-outline', route: '/profile_screens/FriendsScreen' },
      { label: 'Referral / Invite Code', icon: 'share-outline', route: '/profile_screens/referral' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Privacy Settings', icon: 'lock-closed-outline', route: '/profile_screens/privacy' },
      { label: 'Rate Who\'s Next', icon: 'star-outline', route: '/profile_screens/rate' },
      { label: 'Contact Us', icon: 'call-outline', route: '/profile_screens/ContactUsScreen' },
      { label: 'Logout', icon: 'log-out-outline', action: 'onLogout', danger: true },
    ],
  },
]; 