import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface CommonCardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onPress?: () => void;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  expanded?: boolean;
  onExpandPress?: () => void;
  style?: object;
}

export const CommonCard = ({
  title,
  subtitle,
  children,
  actions,
  onPress,
  leftIcon,
  rightIcon,
  onRightIconPress,
  expanded,
  onExpandPress,
  style,
}: CommonCardProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const renderRight = () => {
    if (onExpandPress) {
      return (props: any) => (
        <IconButton
          {...props}
          icon={expanded ? 'chevron-up' : 'chevron-down'}
          onPress={onExpandPress}
        />
      );
    }
    if (rightIcon && onRightIconPress) {
      return (props: any) => (
        <IconButton
          {...props}
          icon={rightIcon}
          onPress={onRightIconPress}
        />
      );
    }
    return undefined;
  };

  const renderLeft = () => {
    if (leftIcon) {
      return (props: any) => (
        <IconButton {...props} icon={leftIcon} />
      );
    }
    return undefined;
  };

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        style
      ]}
      onPress={onPress}
    >
      <Card.Title
        title={title}
        titleStyle={{ color: theme.colors.text }}
        subtitle={subtitle}
        subtitleStyle={{ color: theme.colors.subtext }}
        left={renderLeft()}
        right={renderRight()}
      />
      {children && (
        <Card.Content>
          {children}
        </Card.Content>
      )}
      {actions && (
        <Card.Actions>
          {actions}
        </Card.Actions>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    borderRadius: 8,
  },
}); 