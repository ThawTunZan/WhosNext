import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, Button, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface CommonModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  dismissLabel?: string;
  contentStyle?: object;
}

export const CommonModal = ({
  visible,
  onDismiss,
  title,
  children,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
  submitDisabled = false,
  dismissLabel = 'Cancel',
  contentStyle,
}: CommonModalProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
          contentStyle
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        
        <View style={styles.content}>
          {children}
        </View>

        <View style={styles.actions}>
          <Button 
            onPress={onDismiss}
            textColor={theme.colors.text}
          >
            {dismissLabel}
          </Button>
          {onSubmit && (
            <Button
              mode="contained"
              onPress={onSubmit}
              loading={loading}
              disabled={submitDisabled || loading}
              style={{ marginLeft: 8 }}
            >
              {submitLabel}
            </Button>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
}); 