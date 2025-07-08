import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {Text, Button, Searchbar, Avatar, IconButton, Portal, Modal,
  TextInput, Divider, Surface, FAB, SegmentedButtons, Menu,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useUser } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import {
  getFriendsList,
  getUserById,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  blockUser,
  searchUsers,
  getUserByUsername,
  cancelFriendRequest,
} from '@/src/services/FirebaseServices';

type Friend = {
  username: string;
  name: string;
  email: string;
  timestamp: any;
};

type FirebaseUser = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  fullName?: string;
  incomingFriendRequests?: any[];
  outgoingFriendRequests?: any[];
};

export default function FriendsScreen() {

  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { isLoaded, isSignedIn, user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedRequestType, setSelectedRequestType] = useState('incoming');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFriendUsername, setSelectedFriendUsername] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: View | null }>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<Friend[]>([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState<string | null>(null);

  // Load friends and friend requests
  useEffect(() => {
    if (isSignedIn && user) {
      loadFriendsData();
    }
  }, [isSignedIn, user]);

  const loadFriendsData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      let friendsUsernames = await getFriendsList(user.username);
      if (!Array.isArray(friendsUsernames)) friendsUsernames = [];
      const friendsData: Friend[] = await Promise.all(
        friendsUsernames.map(async (friendUsername: string) => {
          const friendData = await getUserByUsername(friendUsername) as FirebaseUser;
          if (!friendData || typeof friendData !== 'object') return { username: '', name: '', email: '', timestamp: null };
          const name = ('fullName' in friendData && typeof friendData.fullName === 'string' && friendData.fullName.length > 0)
            ? friendData.fullName
            : (('username' in friendData && typeof friendData.username === 'string') ? friendData.username : 'Unknown');
          const email = ('email' in friendData && typeof friendData.email === 'string') ? friendData.email : '';
          return {
            username: friendUsername,
            name,
            email,
            timestamp: null,
          };
        })
      );
      setFriends(friendsData.filter((friend) => !!friend.username));
      
      // Load friend requests if they exist in user data
      const userDataRaw = await getUserByUsername(user.username) as FirebaseUser;
      const userData = (userDataRaw && typeof userDataRaw === 'object') ? userDataRaw : {};
      // Handle incoming requests
      const incomingRequests = Array.isArray((userData as FirebaseUser)?.incomingFriendRequests) ? (userData as FirebaseUser).incomingFriendRequests : [];
      const incomingRequestsData = await Promise.all(
        incomingRequests
          .filter((request: any) => request.status === 'pending')
          .map(async (request: any) => {
            try {
              const username = request.senderUsername || request.senderId;
              const requesterData = await getUserByUsername(username) as FirebaseUser;
              if (!requesterData || typeof requesterData !== 'object') return null;
              const name = ('fullName' in requesterData && typeof requesterData.fullName === 'string' && requesterData.fullName.length > 0)
                ? requesterData.fullName
                : (('username' in requesterData && typeof requesterData.username === 'string') ? requesterData.username : 'Unknown');
              const email = ('email' in requesterData && typeof requesterData.email === 'string') ? requesterData.email : '';
              return {
                username: request.senderUsername || request.senderId,
                name,
                email,
                timestamp: request.timestamp,
              };
            } catch (error) {
              return null;
            }
          })
      );
      setIncomingFriendRequests(incomingRequestsData.filter((request): request is Friend => !!request && 'username' in request && 'name' in request && 'email' in request));

      // Handle outgoing requests
      const outgoingRequests = Array.isArray((userData as FirebaseUser)?.outgoingFriendRequests) ? (userData as FirebaseUser).outgoingFriendRequests : [];
      const outgoingRequestsData = await Promise.all(
        outgoingRequests
          .filter((request: any) => request.status === 'pending')
          .map(async (request: any) => {
            try {
              const username = request.receiverUsername || request.receiverId;
              const recipientData = await getUserByUsername(username) as FirebaseUser;
              if (!recipientData || typeof recipientData !== 'object') return null;
              const name = ('fullName' in recipientData && typeof recipientData.fullName === 'string' && recipientData.fullName.length > 0)
                ? recipientData.fullName
                : (('username' in recipientData && typeof recipientData.username === 'string') ? recipientData.username : 'Unknown');
              const email = ('email' in recipientData && typeof recipientData.email === 'string') ? recipientData.email : '';
              return {
                username: request.receiverUsername || request.receiverId,
                name,
                email,
                timestamp: request.timestamp,
              };
            } catch (error) {
              return null;
            }
          })
      );
      setOutgoingFriendRequests(outgoingRequestsData.filter((request): request is Friend => !!request && 'username' in request && 'name' in request && 'email' in request));
      
    } catch (error) {
      console.error('Error loading friends data:', error);
      Alert.alert('Error', 'Failed to load friends data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!user || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchUsers(query, user.username);
      setSearchResults(results.map((result: FirebaseUser) => ({
        username: result.username || '',
        name: result.fullName || result.username || 'Unknown',
        email: result.email || '',
        timestamp: null, // Add this line
      })));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !newFriendUsername.trim()) return;

    try {
      setIsLoading(true);
      const targetUser = await getUserByUsername(newFriendUsername.trim()) as FirebaseUser;
      console.log('Found target user:', targetUser);
      
      if (!targetUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (targetUser.username === user.username) {
        Alert.alert('Error', 'You cannot send a friend request to yourself');
        return;
      }

      // Check if we already have an outgoing request to this user
      const userData = await getUserByUsername(user.username) as FirebaseUser;
      console.log('Current user data before sending request:', userData);
      
      const hasExistingRequest = userData?.outgoingFriendRequests?.some(
        (request: any) => request.receiverUsername === targetUser.username
      );

      if (hasExistingRequest) {
        Alert.alert('Error', 'You have already sent a friend request to this user');
        return;
      }

      await sendFriendRequest(user.username, targetUser.username);
      console.log('Friend request sent successfully');
      
      // Reload friends data to get updated requests
      await loadFriendsData();
      
      Alert.alert('Success', 'Friend request sent successfully');
      setAddModalVisible(false);
      setNewFriendUsername('');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterUsername: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await acceptFriendRequest(user.username, requesterUsername);
      await loadFriendsData(); // Reload friends data after accepting
      Alert.alert('Success', 'Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async (requesterUsername: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await declineFriendRequest(user.username, requesterUsername);
      setIncomingFriendRequests(prev => prev.filter(request => request.username !== requesterUsername));
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = useCallback(async (friendUsername: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await removeFriend(user.username, friendUsername);
      await removeFriend(friendUsername, user.username); // Remove from both users
      setFriends(prev => prev.filter(friend => friend.username !== friendUsername));
      Alert.alert('Success', 'Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    } finally {
      setIsLoading(false);
      setMenuVisible(false);
    }
  }, [user]);

  const handleBlockUser = async (friendUsername: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await blockUser(user.username, friendUsername);
      setFriends(prev => prev.filter(friend => friend.username !== friendUsername));
      Alert.alert('Success', 'User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user');
    } finally {
      setIsLoading(false);
      setMenuVisible(false);
    }
  };

  const handleOpenMenu = useCallback((friendUsername: string) => {
    const button = buttonRefs.current[friendUsername];
    if (button) {
      button.measureInWindow((x, y, width, height) => {
        setSelectedFriendUsername(friendUsername);
        setMenuPosition({ x, y });
        setMenuVisible(true);
      });
    }
  }, []);

  const setButtonRef = useCallback((username: string) => (ref: View | null) => {
    buttonRefs.current[username] = ref;
  }, []);

  const handleCancelRequest = async (receiverUsername: string) => {
    if (!user) return;
    try {
      setCancelingRequestId(receiverUsername);
      setIsLoading(true);
      await cancelFriendRequest(user.username, receiverUsername);
      setOutgoingFriendRequests(prev => prev.filter(request => request.username !== receiverUsername));
      Alert.alert('Success', 'Friend request cancelled');
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      Alert.alert('Error', 'Failed to cancel friend request');
    } finally {
      setIsLoading(false);
      setCancelingRequestId(null);
    }
  };

  const renderFriendCard = (friend: Friend) => (
    <Surface style={[styles.friendCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.friendCardContent}>
        <View style={styles.friendInfo}>
          <Avatar.Text size={50} label={friend.name.charAt(0)} />
          <View style={styles.friendDetails}>
            <Text style={[styles.friendName, { color: theme.colors.text }]}>{friend.name}</Text>
          </View>
        </View>
        <View style={styles.friendActions}>
          <View ref={setButtonRef(friend.username)}>
            <IconButton 
              icon="dots-vertical" 
              onPress={() => handleOpenMenu(friend.username)}
            />
          </View>
        </View>
      </View>
    </Surface>
  );

  const renderFriendRequest = (friend: Friend, type: 'incoming' | 'outgoing') => (
    <Surface style={[styles.requestCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.requestCardHeader}>
        <View style={styles.requestTypeIndicator}>
          <IconButton
            icon={type === 'incoming' ? 'arrow-down' : 'arrow-up'}
            size={20}
            iconColor={type === 'incoming' ? theme.colors.primary : theme.colors.info}
          />
          <Text style={[styles.requestTypeText, { 
            color: type === 'incoming' ? theme.colors.primary : theme.colors.info 
          }]}>
            {type === 'incoming' ? 'Incoming Request' : 'Outgoing Request'}
          </Text>
        </View>
      </View>
      <View style={styles.requestCardContent}>
        <View style={styles.friendInfo}>
          <Avatar.Text 
            size={60} 
            label={friend.name.charAt(0)} 
            style={{ backgroundColor: type === 'incoming' ? theme.colors.primary : theme.colors.info }}
          />
          <View style={styles.friendDetails}>
            <Text style={[styles.friendName, { color: theme.colors.text }]}>{friend.name}</Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          {type === 'incoming' ? (
            <>
              <Button 
                mode="contained" 
                onPress={() => handleAcceptRequest(friend.username)}
                style={[styles.actionButton, styles.acceptButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Accept
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleDeclineRequest(friend.username)}
                style={[
                  styles.actionButton,
                  { borderColor: theme.colors.error }
                ]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Decline
              </Button>
            </>
          ) : (
            <Button 
              mode="outlined" 
              onPress={() => handleCancelRequest(friend.username)}
              style={[
                styles.actionButton,
                { borderColor: theme.colors.error }
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              loading={isLoading && cancelingRequestId === friend.username}
              disabled={isLoading && cancelingRequestId === friend.username}
            >
              Cancel Request
            </Button>
          )}
        </View>
      </View>
    </Surface>
  );

  // Add filtered friends computation
  const filteredFriends = friends.filter(friend => 
    (friend.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIncomingFriendRequests = incomingFriendRequests.filter(request => 
    (request.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (request.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOutgoingFriendRequests = outgoingFriendRequests.filter(request => 
    (request.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (request.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );


  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Friends</Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            {friends.length} friends • {incomingFriendRequests.length} incoming • {outgoingFriendRequests.length} outgoing
          </Text>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={selectedTab}
            onValueChange={setSelectedTab}
            buttons={[
              {
                value: 'all',
                label: 'All Friends',
                icon: 'account-multiple',
              },
              {
                value: 'requests',
                label: `Requests (${incomingFriendRequests.length + outgoingFriendRequests.length})`,
                icon: 'account-plus',
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Sub-tabs for Requests */}
        {selectedTab === 'requests' && (
          <View style={styles.subTabContainer}>
            <SegmentedButtons
              value={selectedRequestType}
              onValueChange={setSelectedRequestType}
              buttons={[
                {
                  value: 'incoming',
                  label: `Incoming (${incomingFriendRequests.length})`,
                  icon: 'arrow-down',
                },
                {
                  value: 'outgoing',
                  label: `Outgoing (${outgoingFriendRequests.length})`,
                  icon: 'arrow-up',
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        )}

        {/* Search Bar */}
        <Searchbar
          placeholder="Search by name or email..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.text}
          inputStyle={{ color: theme.colors.text }}
          placeholderTextColor={theme.colors.subtext}
        />

        {/* Friends List */}
        <ScrollView style={styles.content}>
          {selectedTab === 'all' ? (
            filteredFriends.map(friend => (
              <React.Fragment key={friend.username}>
                {renderFriendCard(friend)}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.requestsContainer}>
              {selectedRequestType === 'incoming' ? (
                filteredIncomingFriendRequests.length > 0 ? (
                  filteredIncomingFriendRequests.map(friend => (
                    <React.Fragment key={friend.username}>
                      {renderFriendRequest(friend, 'incoming')}
                    </React.Fragment>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <IconButton icon="inbox-arrow-down" size={48} />
                    <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                      No incoming friend requests
                    </Text>
                  </View>
                )
              ) : (
                filteredOutgoingFriendRequests.length > 0 ? (
                  filteredOutgoingFriendRequests.map(friend => (
                    <React.Fragment key={friend.username}>
                      {renderFriendRequest(friend, 'outgoing')}
                    </React.Fragment>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <IconButton icon="inbox-arrow-up" size={48} />
                    <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
                      No outgoing friend requests
                    </Text>
                  </View>
                )
              )}
            </View>
          )}
        </ScrollView>

        {/* Friend Actions Menu */}
        <Portal>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={menuPosition}
          >
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                // TODO: Implement view profile
                console.log('View profile:', selectedFriendUsername);
              }} 
              title="View Profile" 
              leadingIcon="account"
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                // TODO: Implement block user
                console.log('Block user:', selectedFriendUsername);
              }} 
              title="Block User" 
              leadingIcon="block-helper"
            />
            <Divider />
            <Menu.Item 
              onPress={() => selectedFriendUsername && handleRemoveFriend(selectedFriendUsername)} 
              title="Remove Friend" 
              leadingIcon="account-remove"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </Portal>

        {/* Add Friend FAB */}
        <FAB
          icon="account-plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setAddModalVisible(true)}
          color={theme.colors.text}
        />

        {/* Add Friend Modal */}
        <Portal>
          <Modal
            visible={addModalVisible}
            onDismiss={() => setAddModalVisible(false)}
            contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Friend</Text>
            <TextInput
              label="Username"
              mode="outlined"
              style={styles.input}
              value={newFriendUsername}
              onChangeText={setNewFriendUsername}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setAddModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSendFriendRequest}
                style={styles.modalButton}
                loading={isLoading}
                disabled={isLoading}
              >
                Send Request
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    paddingBottom: 0
  },
  searchBar: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  friendCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  friendCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendDetails: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendEmail: {
    fontSize: 14,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    minWidth: 100,
  },
  acceptButton: {
    marginBottom: 8,
  },
  declineButton: {
    borderColor: 'red',
  },
  cancelButton: {
    borderColor: 'red',
  },
  subTabContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  requestsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  requestCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  requestCardHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  requestTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestCardContent: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonContent: {
    height: 36,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 8,
  },
});
