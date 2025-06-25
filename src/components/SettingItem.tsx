import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Switch, Divider, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  value?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  showDivider?: boolean;
  rightComponent?: React.ReactNode;
  disabled?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  icon,
  value,
  onToggle,
  onPress,
  showDivider = true,
  rightComponent,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handlePress = () => {
    if (disabled) return;
    if (onToggle) onToggle();
    if (onPress) onPress();
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.settingItem,
          disabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons
                name={icon}
                size={20}
                color={theme.colors.primary}
              />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={[
              styles.settingTitle,
              { color: theme.colors.text },
              disabled && { color: theme.colors.subtext }
            ]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.settingSubtitle, { color: theme.colors.subtext }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {rightComponent || (
          onToggle && (
            <Switch
              value={value}
              onValueChange={onToggle}
              color={theme.colors.primary}
              disabled={disabled}
            />
          )
        )}
      </TouchableOpacity>
      {showDivider && <Divider style={{ backgroundColor: theme.colors.border }} />}
    </>
  );
};

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
  style?: any;
}

export const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  children,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.section, style]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Surface style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]} elevation={1}>
        {children}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.5,
  },
}); 