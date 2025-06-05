import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, RadioButton, Surface, Avatar, useTheme, ActivityIndicator } from 'react-native-paper';
import { AddMemberType, Member } from '@/src/types/DataTypes';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useMemberProfiles } from '@/src/context/MemberProfilesContext';

type ChooseExistingOrNewProps = {
  visible: boolean;
  onDismiss: () => void;
  mockMembers: Record<string, Member>;
  onSelectMockMember: (memberId: string) => void;
  onJoinAsNew: () => void;
};

export default function ChooseExistingOrNew({
  visible,
  onDismiss,
  mockMembers,
  onSelectMockMember,
  onJoinAsNew,
}: ChooseExistingOrNewProps) {
  const [choice, setChoice] = useState<'existing' | 'new'>('new');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const handleConfirm = () => {
    if (choice === 'existing' && selectedMemberId) {
      onSelectMockMember(selectedMemberId);
    } else {
      onJoinAsNew();
    }
    onDismiss();
  };

  const profiles = useMemberProfiles();

  const mockMemberEntries = Object.entries(mockMembers).filter(([_, member]) => member.addMemberType === AddMemberType.MOCK);
  const isLoadingProfiles = mockMemberEntries.some(([id]) => !profiles[id]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={styles.modalContent}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
            Welcome to the Trip! 🎉
          </Text>
          
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.subtext }]}>
            Are you an existing member or would you like to join as new?
          </Text>

          <RadioButton.Group onValueChange={value => {
            setChoice(value as 'existing' | 'new');
            setSelectedMemberId(null);
          }} value={choice}>
            <View style={styles.optionsContainer}>
              <Surface style={[styles.optionCard, { 
                backgroundColor: choice === 'new' ? theme.colors.primaryContainer : theme.colors.background,
                borderColor: choice === 'new' ? theme.colors.primary : theme.colors.outline,
              }]}>
                <RadioButton.Item
                  label="I'm a new member"
                  value="new"
                  position="leading"
                  labelStyle={{ color: theme.colors.text }}
                />
                <Text style={[styles.optionDescription, { color: theme.colors.subtext }]}>
                  Join as a new member and start fresh
                </Text>
              </Surface>

              <Surface style={[styles.optionCard, {
                backgroundColor: choice === 'existing' ? theme.colors.primaryContainer : theme.colors.background,
                borderColor: choice === 'existing' ? theme.colors.primary : theme.colors.outline,
              }]}>
                <RadioButton.Item
                  label="I'm an existing member"
                  value="existing"
                  position="leading"
                  labelStyle={{ color: theme.colors.text }}
                />
                <Text style={[styles.optionDescription, { color: theme.colors.subtext }]}>
                  Claim your existing profile from the list below
                </Text>
              </Surface>
            </View>
          </RadioButton.Group>

          {choice === 'existing' && (
            <Surface style={[styles.membersContainerSurface, { 
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.outline,
            }]}>
              <Text variant="titleMedium" style={[styles.membersTitle, { color: theme.colors.text }]}>
                Available Members to Claim
              </Text>
              <ScrollView style={styles.membersScrollContainer}>
                {isLoadingProfiles ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={[styles.loadingText, { color: theme.colors.subtext }]}>
                      Loading members...
                    </Text>
                  </View>
                ) : mockMemberEntries.length > 0 ? (
                  mockMemberEntries.map(([id, member]) => (
                    <Surface
                      key={id}
                      style={[styles.memberCard, {
                        backgroundColor: selectedMemberId === id ? theme.colors.primaryContainer : theme.colors.surface,
                        borderColor: selectedMemberId === id ? theme.colors.primary : theme.colors.outline,
                      }]}
                      onTouchEnd={() => setSelectedMemberId(id)}
                    >
                      <View style={styles.memberContent}>
                        <Avatar.Text
                          size={40}
                          label={profiles[member.id]?.substring(0, 2).toUpperCase() || "??"}
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <View style={styles.memberInfo}>
                          <Text variant="titleMedium" style={{ color: theme.colors.text }}>
                            {profiles[member.id]}
                          </Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.subtext }}>
                            Budget: ${member.budget.toFixed(2)}
                          </Text>
                        </View>
                        <RadioButton
                          value={id}
                          status={selectedMemberId === id ? 'checked' : 'unchecked'}
                          onPress={() => setSelectedMemberId(id)}
                        />
                      </View>
                    </Surface>
                  ))
                ) : (
                  <Text style={[styles.noMembers, { color: theme.colors.subtext }]}>
                    No unclaimed members available
                  </Text>
                )}
              </ScrollView>
            </Surface>
          )}

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={choice === 'existing' && (!selectedMemberId || isLoadingProfiles)}
              style={styles.button}
            >
              Confirm
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalContent: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionDescription: {
    paddingLeft: 52,
    paddingRight: 16,
    paddingBottom: 12,
    fontSize: 12,
  },
  membersContainerSurface: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    maxHeight: 400,
  },
  membersScrollContainer: {
    flexGrow: 0,
  },
  membersTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  memberCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  memberInfo: {
    flex: 1,
  },
  noMembers: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  button: {
    minWidth: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontStyle: 'italic',
  },
});
