// Handles the UI for adding of members to the trip

import { View, StyleSheet, Share, Platform, ActivityIndicator } from "react-native";
import { Card, Button, TextInput, Text, Avatar, Surface, IconButton, useTheme, Portal, Modal, Badge, Chip, List, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { AddMemberType, Member } from '@/src/types/DataTypes';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import SelectFriendsModal from '@/app/trip/components/SelectFriendsModal';
import CurrencyModal from '@/app/trip/components/CurrencyModal';
import { createInvite } from '@/src/TripSections/Invite/utilities/InviteUtilities';
import * as Linking from 'expo-linking';
import { useUser } from '@clerk/clerk-expo';
import QRCode from 'react-native-qrcode-svg';
import { useUserTripsContext } from "@/src/context/UserTripsContext";

type MemberListProps = {
  onAddMember: (name: string, budget: number, currency: string, addMemberType: AddMemberType) => void;
  onRemoveMember: (name: string) => void;
  onGenerateClaimCode?: (memberId: string) => Promise<string>;
  onClaimMockUser?: (memberId: string, claimCode: string) => Promise<void>;
  tripId: string;
};

type membersType = {
  [username: string]: {
      addMemberType: string;
      amtLeft: number;
      budget: number;
      currency: string;
      owesTotalMap: {
          [currency: string]: number;
      };
      receiptsCount: number;
      username: string;
  };
}

export default function MemberList({ 
  onAddMember, 
  onRemoveMember,
  onClaimMockUser,
  tripId 
}: MemberListProps) {
  const [newMember, setNewMember] = useState("");
  const [newMemberBudget, setNewMemberBudget] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMockMemberModal, setShowMockMemberModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [errors, setErrors] = useState<{ name?: string; budget?: string; claim?: string }>({});
  const [addMemberType, setAddMemberType] = useState<AddMemberType>(AddMemberType.MOCK);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const { user } = useUser();
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();
  const { trips, loading: tripsLoading, error: tripsError } = useUserTripsContext();
  const trip = trips.find(t => t.id === tripId);
  //console.log("TRIP IN MEMBERLIST IS ", trip)
  const members: membersType = (trip && trip.members) ? trip.members : {};
  //console.log("MEMBERS IN MEMBERLIST ARE ",members)


  // Only render valid members
  const validMembers: [string, Member][] = Object.entries(members).filter(
    ([username, member]) => member && (member.username || username) && typeof member.budget === 'number'
  ) as [string, Member][];
  //console.log("VALID MEMBERS ARE ", validMembers)

  const getInviteUrl = useCallback((inviteId: string, mockUserId: string) => {
    // For development
    if (__DEV__) {
      return Platform.select({
        // Use Expo URL for both web and mobile in development
        web: Linking.createURL(`invite/${inviteId}?mockUserId=${mockUserId}`),
        default: Linking.createURL(`invite/${inviteId}?mockUserId=${mockUserId}`)
      });
    }
    
    // For production - replace with your actual production domain
    return Platform.select({
      web: `https://whosnext-v2.vercel.app/invite/${inviteId}?mockUserId=${mockUserId}`,
      default: Linking.createURL(`invite/${inviteId}?mockUserId=${mockUserId}`)
    });
  }, []);

  const handleShareInvite = useCallback((inviteId: string, mockUsername: string) => {
    const inviteLink = getInviteUrl(inviteId, mockUsername);
    const memberName = mockUsername || 'this mock profile';
    Share.share({
      message: `You've been invited to claim ${memberName} in our trip on Who's Next!\n\nClick here to claim the profile: ${inviteLink}`,
    });
  }, [getInviteUrl]);

  useEffect(() => {
    if (showClaimModal && user && !inviteId) {
      setInviteLoading(true);
      const userName = user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      createInvite(tripId, { id: user.id, name: userName })
        .then(id => {
          setInviteId(id);
          console.log('DEV INVITE URL:', Linking.createURL(`invite/${id}`));
        })
        .catch(err => {
          console.error('Failed to create invite:', err);
        })
        .finally(() => {
          setInviteLoading(false);
        });
    }
  }, [showClaimModal, user, tripId]);

  useEffect(() => {
    if (!showClaimModal) {
      setInviteId(null);
    }
  }, [showClaimModal]);

  const handleAdd = () => {
    const trimmedName = newMember.trim();
    const newErrors: { name?: string; budget?: string } = {};

    if (!trimmedName) {
      newErrors.name = "Name is required";
    }
    if (newMemberBudget < 0) {
      newErrors.budget = "Please enter a valid budget amount";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Use the name directly as the member key instead of generating an ID
    onAddMember(trimmedName, newMemberBudget, selectedCurrency, addMemberType);
    setNewMember("");
    setNewMemberBudget(null);
    setShowMockMemberModal(false);
  };

  const handleFriendSelect = (friendName: string, budget: number) => {
    onAddMember(friendName, budget, "USD", AddMemberType.FRIENDS);
  };

  const memberCount = Object.keys(members).length;

  const MemberCard = ({ username, member, profileName }: { username: string; member: {addMemberType: string; amtLeft: number; budget: number; currency: string; owesTotalMap: { [currency: string]: number; }; receiptsCount: number; username: string; }; profileName: string }) => (
    <Surface style={styles.memberCard} elevation={1}>
      <View style={[styles.memberContent, { overflow: 'hidden' }]}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={40}
            label={profileName ? profileName.substring(0, 2).toUpperCase() : ""}
            style={[
              { backgroundColor: member.addMemberType === AddMemberType.MOCK ? 
                theme.colors.placeholder : 
                paperTheme.colors.primary 
              }
            ]}
          />
        </View>
        
        <View style={styles.memberInfo}>
          {profileName === undefined
            ? <ActivityIndicator size="small" color={theme.colors.text} />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="titleMedium" style={[styles.memberName, { color: theme.colors.text }]}>
                  {profileName}
                </Text>
                {user && username === user.username && (
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.primary, marginLeft: 8, fontWeight: 'bold' }}
                  >
                    (You)
                  </Text>
                )}
              </View>
            )
          }
          <Text variant="labelMedium" style={{ color: theme.colors.subtext }}>
            Budget: ${member.budget.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rightContent}>
          {member.addMemberType === AddMemberType.MOCK  && (
            <Chip 
              style={styles.unverifiedBadge}
              textStyle={{ fontSize: 10 }}
              compact
            >
              UNVERIFIED
            </Chip>
          )}

          <View style={styles.actionButtons}>
            {member.addMemberType === AddMemberType.MOCK && (
              <IconButton
                icon="link-variant"
                size={20}
                onPress={() => {
                  setSelectedMemberId(username);
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
              onPress={() => onRemoveMember(username)}
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
            {validMembers.map(([username, member]) => (
              <MemberCard
                username={username}
                member={member}
                profileName={username}
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
                setAddMemberType(AddMemberType.FRIENDS);
                setShowAddModal(false);
                setShowFriendsModal(true);
              }}
              style={{ paddingVertical: 12 }}
            />
            <List.Item
              title="Share Invite Link"
              description="Share a link to join this trip"
              left={props => <List.Icon {...props} icon="link" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setAddMemberType(AddMemberType.INVITE_LINK);
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
                setAddMemberType(AddMemberType.QR_CODE);
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

          <View style={styles.rowInputContainer}>
            <TextInput
              label="Budget Amount (Optional)"
              value={newMemberBudget !== null ? String(newMemberBudget) : ''}
              onChangeText={(text) => {
                setNewMemberBudget(text ? Number(text) : null);
                setErrors(prev => ({ ...prev, budget: undefined }));
              }}
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: theme.colors.background, flex: 1 }]}
              mode="outlined"
              error={!!errors.budget}
            />
            <Button
              mode="outlined"
              onPress={() => setShowCurrencyDialog(true)}
              style={styles.currencyButton}
            >
              {selectedCurrency}
            </Button>
          </View>
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
              onPress={() => {
                setAddMemberType(AddMemberType.MOCK);
                handleAdd();
              }}
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
              Share Mock Profile Link
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

          <View style={styles.inviteLinkContainer}>
            {inviteLoading ? (
              <ActivityIndicator style={{ marginVertical: 20 }} size="large" />
            ) : inviteId && selectedMemberId ? (
              <>
                <TextInput
                  label="Mock Profile Invite Link"
                  value={getInviteUrl(inviteId, selectedMemberId)}
                  editable={false}
                  style={[styles.input, { backgroundColor: theme.colors.background }]}
                  mode="outlined"
                  right={<TextInput.Icon icon="content-copy" onPress={() => handleShareInvite(inviteId, selectedMemberId)} />}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.subtext, marginTop: 8, marginBottom: 16 }}>
                  Share this special link to let someone claim this mock profile. When they click the link, they'll be automatically connected to this profile.
                </Text>

                <View style={styles.qrContainer}>
                  <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 12, textAlign: 'center' }}>
                    Scan QR Code
                  </Text>
                  <Surface style={[styles.qrWrapper, { backgroundColor: 'white' }]}>
                    <QRCode
                      value={getInviteUrl(inviteId, selectedMemberId)}
                      size={200}
                    />
                  </Surface>
                  <Text variant="bodySmall" style={{ color: theme.colors.subtext, marginTop: 8, textAlign: 'center' }}>
                    Or scan this QR code with your phone's camera
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ color: theme.colors.error }}>Failed to generate invite link. Please try again.</Text>
            )}
          </View>

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
              Close
            </Button>
            {inviteId && selectedMemberId && (
              <Button 
                mode="contained" 
                onPress={() => handleShareInvite(inviteId, selectedMemberId)}
                style={styles.modalButton}
                icon="share"
              >
                Share Link
              </Button>
            )}
          </View>
        </Modal>

        <CurrencyModal
          visible={showCurrencyDialog}
          onDismiss={() => setShowCurrencyDialog(false)}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
        />

        <SelectFriendsModal
          visible={showFriendsModal}
          onDismiss={() => setShowFriendsModal(false)}
          onSelectFriend={handleFriendSelect}
        />
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  memberListContainer: {
    borderRadius: 8,
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
    marginBottom: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 8,
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
  rowInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currencyButton: {
    minWidth: 80,
    marginTop: 6,
  },
  inviteLinkContainer: {
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
