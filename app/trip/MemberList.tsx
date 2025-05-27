import { View, StyleSheet, Share, Platform } from "react-native";
import { Card, Button, TextInput, Text, Avatar, Surface, IconButton, useTheme, Portal, Modal, Badge, Chip, List, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Member } from '@/src/types/DataTypes';
import { useMemberProfiles } from "@/src/context/MemberProfilesContext";
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type MemberListProps = {
  members: { [id: string]: Member };
  onAddMember: (id: string, name: string, budget: number) => void;
  onRemoveMember: (name: string) => void;
  onGenerateClaimCode?: (memberId: string) => Promise<string>;
  onClaimMockUser?: (memberId: string, claimCode: string) => Promise<void>;
};

export default function MemberList({ 
  members, 
  onAddMember, 
  onRemoveMember,
  onGenerateClaimCode,
  onClaimMockUser 
}: MemberListProps) {
  const profiles = useMemberProfiles();
  const [newMember, setNewMember] = useState("");
  const [newMemberBudget, setNewMemberBudget] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMockMemberModal, setShowMockMemberModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [errors, setErrors] = useState<{ name?: string; budget?: string; claim?: string }>({});

  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const handleAdd = () => {
    const trimmedName = newMember.trim();
    const newErrors: { name?: string; budget?: string } = {};

    if (!trimmedName) {
      newErrors.name = "Name is required";
    }
    if (!newMemberBudget || newMemberBudget <= 0) {
      newErrors.budget = "Please enter a valid budget amount";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const memberId = `${trimmedName}-${Date.now()}`;
    onAddMember(memberId, trimmedName, newMemberBudget);
    setNewMember("");
    setNewMemberBudget(0);
    setErrors({});
    setShowMockMemberModal(false);
  };

  const handleClaimAttempt = async () => {
    if (!selectedMemberId || !claimCode) {
      setErrors({ ...errors, claim: "Please enter a valid claim code" });
      return;
    }

    try {
      await onClaimMockUser?.(selectedMemberId, claimCode);
      setShowClaimModal(false);
      setClaimCode("");
      setSelectedMemberId(null);
      setErrors({});
    } catch (error) {
      setErrors({ ...errors, claim: "Invalid claim code" });
    }
  };

  const handleGenerateClaimCode = async (memberId: string) => {
    if (onGenerateClaimCode) {
      try {
        const code = await onGenerateClaimCode(memberId);
        await Share.share({
          message: `Claim your profile in our trip! Use this code: ${code}`,
        });
      } catch (error) {
        console.error('Error generating claim code:', error);
      }
    }
  };

  const memberCount = Object.keys(members).length;

  const MemberCard = ({ id, member, profile }: { id: string; member: Member; profile: string }) => (
    <Surface style={styles.memberCard} elevation={1}>
      <View style={[styles.memberContent, { overflow: 'hidden' }]}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={40}
            label={profile?.substring(0, 2).toUpperCase() || "??"}
            style={[
              { backgroundColor: member.isMockUser ? 
                theme.colors.placeholder : 
                paperTheme.colors.primary 
              }
            ]}
          />
        </View>
        
        <View style={styles.memberInfo}>
          <Text variant="titleMedium" style={[styles.memberName, { color: theme.colors.text }]}>
            {profile}
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.subtext }}>
            Budget: ${member.budget.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rightContent}>
          {member.isMockUser && (
            <Chip 
              style={styles.unverifiedBadge}
              textStyle={{ fontSize: 10 }}
              compact
            >
              UNVERIFIED
            </Chip>
          )}

          <View style={styles.actionButtons}>
            {member.isMockUser && onGenerateClaimCode && (
              <IconButton
                icon="link-variant"
                size={20}
                onPress={() => {
                  setSelectedMemberId(id);
                  setShowClaimModal(true);
                }}
                mode="contained-tonal"
                containerColor={paperTheme.colors.primary}
                iconColor="white"
              />
            )}
            <IconButton
              icon="account-remove"
              size={20}
              onPress={() => onRemoveMember(id)}
              mode="contained-tonal"
              containerColor={theme.colors.error}
              iconColor="white"
            />
          </View>
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.memberListContainer}>
        <View style={{ overflow: 'hidden' }}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons 
                name="account-group" 
                size={24} 
                color={theme.colors.text} 
                style={styles.headerIcon} 
              />
              <Text variant="titleMedium" style={{ color: theme.colors.text }}>
                Trip Members
              </Text>
            </View>
            <Text variant="labelMedium" style={{ color: theme.colors.subtext }}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          <View style={styles.memberGrid}>
            {Object.entries(members).map(([id, member]) => (
              <MemberCard
                key={id}
                id={id}
                member={member}
                profile={profiles[id]}
              />
            ))}
          </View>

          <Button 
            mode="contained" 
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
            icon="account-plus"
          >
            Add Members
          </Button>
        </View>
      </Surface>

      {/* Main Add Member Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={[
            {
              backgroundColor: theme.colors.surface,
              margin: 20,
              marginTop: Platform.OS === 'ios' ? 60 : 20,
              borderRadius: 12,
              padding: 20,
            }
          ]}
        >
          <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headlineSmall" style={{ flex: 1, fontSize: 22, fontWeight: '600', color: theme.colors.text }}>
              Add Members
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowAddModal(false)}
            />
          </View>

          <List.Section style={{ marginTop: -8 }}>
            <List.Item
              title="Select from Friends"
              description="Add members from your friend list"
              left={props => <List.Icon {...props} icon="account-multiple" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setShowAddModal(false);
              }}
              style={{ paddingVertical: 12 }}
            />
            <List.Item
              title="Share Invite Link"
              description="Share a link to join this trip"
              left={props => <List.Icon {...props} icon="link" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setShowAddModal(false);
              }}
              style={{ paddingVertical: 12 }}
            />
            <List.Item
              title="Share QR Code"
              description="Share via QR code"
              left={props => <List.Icon {...props} icon="qrcode" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setShowAddModal(false);
              }}
              style={{ paddingVertical: 12 }}
            />
            <List.Item
              title="Add Mock Member"
              description="Create a temporary member"
              left={props => <List.Icon {...props} icon="account-plus" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setShowAddModal(false);
                setShowMockMemberModal(true);
              }}
              style={{ paddingVertical: 12 }}
            />
          </List.Section>
        </Modal>

        {/* Mock Member Modal */}
        <Modal
          visible={showMockMemberModal}
          onDismiss={() => {
            setShowMockMemberModal(false);
            setErrors({});
          }}
          contentContainerStyle={[
            {
              backgroundColor: theme.colors.surface,
              margin: 20,
              marginTop: Platform.OS === 'ios' ? 60 : 20,
              borderRadius: 12,
              padding: 20,
            }
          ]}
        >
          <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headlineSmall" style={{ flex: 1, fontSize: 22, fontWeight: '600', color: theme.colors.text }}>
              Add Mock Member
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => {
                setShowMockMemberModal(false);
                setErrors({});
              }}
            />
          </View>

          <TextInput
            label="Member Name"
            value={newMember}
            onChangeText={(text) => {
              setNewMember(text);
              setErrors(prev => ({ ...prev, name: undefined }));
            }}
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            mode="outlined"
            error={!!errors.name}
          />
          {errors.name && (
            <Text variant="labelSmall" style={styles.errorText}>
              {errors.name}
            </Text>
          )}

          <TextInput
            label="Budget Amount"
            value={String(newMemberBudget || '')}
            onChangeText={(text) => {
              setNewMemberBudget(Number(text) || 0);
              setErrors(prev => ({ ...prev, budget: undefined }));
            }}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            mode="outlined"
            error={!!errors.budget}
            left={<TextInput.Affix text="$" />}
          />
          {errors.budget && (
            <Text variant="labelSmall" style={styles.errorText}>
              {errors.budget}
            </Text>
          )}

          <View style={styles.modalActions}>
            <Button 
              onPress={() => {
                setShowMockMemberModal(false);
                setErrors({});
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAdd}
              style={styles.modalButton}
            >
              Add Member
            </Button>
          </View>
        </Modal>

        {/* Claim Modal */}
        <Modal
          visible={showClaimModal}
          onDismiss={() => {
            setShowClaimModal(false);
            setSelectedMemberId(null);
            setClaimCode("");
            setErrors({});
          }}
          contentContainerStyle={[
            {
              backgroundColor: theme.colors.surface,
              margin: 20,
              marginTop: Platform.OS === 'ios' ? 60 : 20,
              borderRadius: 12,
              padding: 20,
            }
          ]}
        >
          <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headlineSmall" style={{ flex: 1, fontSize: 22, fontWeight: '600', color: theme.colors.text }}>
              Claim Mock Profile
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => {
                setShowClaimModal(false);
                setSelectedMemberId(null);
                setClaimCode("");
                setErrors({});
              }}
            />
          </View>

          <TextInput
            label="Claim Code"
            value={claimCode}
            onChangeText={(text) => {
              setClaimCode(text);
              setErrors(prev => ({ ...prev, claim: undefined }));
            }}
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            mode="outlined"
            error={!!errors.claim}
          />
          {errors.claim && (
            <Text variant="labelSmall" style={styles.errorText}>
              {errors.claim}
            </Text>
          )}

          <View style={styles.modalActions}>
            <Button 
              onPress={() => {
                setShowClaimModal(false);
                setSelectedMemberId(null);
                setClaimCode("");
                setErrors({});
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleClaimAttempt}
              style={styles.modalButton}
            >
              Claim Profile
            </Button>
            <Button 
              mode="contained-tonal"
              onPress={() => selectedMemberId && handleGenerateClaimCode(selectedMemberId)}
              style={styles.modalButton}
            >
              Generate Code
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  memberListContainer: {
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  memberGrid: {
    gap: 12,
  },
  memberCard: {
    borderRadius: 12,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: '600',
  },
  addButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 12,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
  avatarContainer: {
    position: 'relative',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unverifiedBadge: {
    backgroundColor: '#FFA500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
