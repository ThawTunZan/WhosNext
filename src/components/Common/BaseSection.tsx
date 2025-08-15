import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { sectionStyles } from '@/src/styles/section_comp_styles';

interface BaseSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  keyboardAvoiding?: boolean;
  loading?: boolean;
  error?: string | null;
  LoadingComponent?: React.ReactNode;
  ErrorComponent?: React.ReactNode;
}

export const BaseSection = ({ 
  title, 
  icon, 
  children, 
  keyboardAvoiding = true,
  loading = false,
  error = null,
  LoadingComponent,
  ErrorComponent,
}: BaseSectionProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const renderContent = () => {
    if (loading) {
      if (LoadingComponent) {
        return LoadingComponent;
      }
      return (
        <View style={[sectionStyles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={paperTheme.colors.primary} />
          <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      if (ErrorComponent) {
        return ErrorComponent;
      }
      return (
        <View style={[sectionStyles.centered, { backgroundColor: theme.colors.background }]}>
          <Text style={[sectionStyles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={[sectionStyles.header, { color: theme.colors.text }]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
        {children}
      </>
    );
  };

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[sectionStyles.container, { backgroundColor: theme.colors.background }]}
        keyboardVerticalOffset={100}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[sectionStyles.container, { backgroundColor: theme.colors.background }]}>
      {renderContent()}
    </View>
  );
}; 