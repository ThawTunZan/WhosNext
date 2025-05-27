import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  List,
  Avatar,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Divider,
  Surface,
  FAB,
  SegmentedButtons,
  Menu,
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
} from '@/src/services/FirebaseServices';

const { width } = Dimensions.get('window');

type Friend = {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline';
  //avatar?: string;
};

type FirebaseUser = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  status?: 'online' | 'offline';
  //avatar?: string;
};

export default function FriendsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { isLoaded, isSignedIn, user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedRequestType, setSelectedRequestType] = useState('incoming');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: View | null }>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<Friend[]>([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const friendIds = await getFriendsList(user.id) || [];
      const friendsData = await Promise.all(
        friendIds.map(async (friendId: string) => {
          const friendData = await getUserById(friendId);
          return friendData ? {
            id: friendId,
            name: friendData.username || 'Unknown',
            email: friendData.email || '',
            status: friendData.status || 'offline',
          } : null;
        })
      );
      
      setFriends(friendsData.filter((friend): friend is Friend => friend !== null));
      
      // Load friend requests if they exist in user data
      const userData = await getUserById(user.id);
      console.log('Current user data:', userData);
      
      // Handle incoming requests
      const incomingRequests = userData?.incomingFriendRequests || [];
      console.log('Incoming requests:', incomingRequests);
      
      const incomingRequestsData = await Promise.all(
        incomingRequests
          .filter((request: any) => request.status === 'pending')
          .map(async (request: any) => {
            try {
              const requesterData = await getUserById(request.senderId);
              console.log('Requester data for', request.senderId, ':', requesterData);
              return requesterData ? {
                id: request.senderId,
                name: requesterData.username || 'Unknown',
                email: requesterData.email || '',
                status: requesterData.status || 'offline',
                timestamp: request.timestamp,
              } : null;
            } catch (error) {
              console.error('Error loading requester data:', error);
              return null;
            }
          })
      );
      console.log('Processed incoming requests:', incomingRequestsData);
      setIncomingFriendRequests(incomingRequestsData.filter((request): request is Friend => request !== null));

      // Handle outgoing requests
      const outgoingRequests = userData?.outgoingFriendRequests || [];
      console.log('Outgoing requests:', outgoingRequests);
      
      const outgoingRequestsData = await Promise.all(
        outgoingRequests
          .filter((request: any) => request.status === 'pending')
          .map(async (request: any) => {
            try {
              const recipientData = await getUserById(request.receiverId);
              console.log('Recipient data for', request.receiverId, ':', recipientData);
              return recipientData ? {
                id: request.receiverId,
                name: recipientData.username || 'Unknown',
                email: recipientData.email || '',
                status: recipientData.status || 'offline',
                timestamp: request.timestamp,
              } : null;
            } catch (error) {
              console.error('Error loading recipient data:', error);
              return null;
            }
          })
      );
      console.log('Processed outgoing requests:', outgoingRequestsData);
      setOutgoingFriendRequests(outgoingRequestsData.filter((request): request is Friend => request !== null));
      
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
      const results = await searchUsers(query, user.id);
      setSearchResults(results.map((result: FirebaseUser) => ({
        id: result.id,
        name: result.username || 'Unknown',
        email: result.email || '',
        status: result.status || 'offline',
        //avatar: result.avatar,
      })));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !newFriendUsername.trim()) return;

    try {
      setIsLoading(true);
      const targetUser = await getUserByUsername(newFriendUsername.trim());
      console.log('Found target user:', targetUser);
      
      if (!targetUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (targetUser.id === user.id) {
        Alert.alert('Error', 'You cannot send a friend request to yourself');
        return;
      }

      // Check if we already have an outgoing request to this user
      const userData = await getUserById(user.id);
      console.log('Current user data before sending request:', userData);
      
      const hasExistingRequest = userData?.outgoingFriendRequests?.some(
        (request: any) => request.receiverId === targetUser.id
      );

      if (hasExistingRequest) {
        Alert.alert('Error', 'You have already sent a friend request to this user');
        return;
      }

      await sendFriendRequest(user.id, targetUser.id);
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

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await acceptFriendRequest(user.id, requesterId);
      await loadFriendsData(); // Reload friends data after accepting
      Alert.alert('Success', 'Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await declineFriendRequest(user.id, requesterId);
      setIncomingFriendRequests(prev => prev.filter(request => request.id !== requesterId));
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await removeFriend(user.id, friendId);
      await removeFriend(friendId, user.id); // Remove from both users
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      Alert.alert('Success', 'Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    } finally {
      setIsLoading(false);
      setMenuVisible(false);
    }
  }, [user]);

  const handleBlockUser = async (friendId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await blockUser(user.id, friendId);
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      Alert.alert('Success', 'User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user');
    } finally {
      setIsLoading(false);
      setMenuVisible(false);
    }
  };

  const handleOpenMenu = useCallback((friendId: string) => {
    const button = buttonRefs.current[friendId];
    if (button) {
      button.measureInWindow((x, y, width, height) => {
        setSelectedFriendId(friendId);
        setMenuPosition({ x, y });
        setMenuVisible(true);
      });
    }
  }, []);

  const setButtonRef = useCallback((id: string) => (ref: View | null) => {
    buttonRefs.current[id] = ref;
  }, []);

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
          <View style={[
            styles.statusDot,
            { backgroundColor: friend.status === 'online' ? theme.colors.success : theme.colors.subtext }
          ]} />
          <View ref={setButtonRef(friend.id)}>
            <IconButton 
              icon="dots-vertical" 
              onPress={() => handleOpenMenu(friend.id)}
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
                onPress={() => handleAcceptRequest(friend.id)}
                style={[styles.actionButton, styles.acceptButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Accept
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleDeclineRequest(friend.id)}
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
              onPress={() => {/* Handle cancel request */}}
              style={[
                styles.actionButton,
                { borderColor: theme.colors.error }
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
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
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIncomingFriendRequests = incomingFriendRequests.filter(request => 
    request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOutgoingFriendRequests = outgoingFriendRequests.filter(request => 
    request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.email.toLowerCase().includes(searchQuery.toLowerCase())
  );


  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Friends</Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            {friends.length} friends • {incomingFriendRequests.length} incoming • {outgoingFriendRequests.length} outgoing
          </Text>
        </Surface>

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
                label: 'Requests',
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
                  label: 'Incoming',
                  icon: 'arrow-down',
                },
                {
                  value: 'outgoing',
                  label: 'Outgoing',
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
              <React.Fragment key={friend.id}>
                {renderFriendCard(friend)}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.requestsContainer}>
              {selectedRequestType === 'incoming' ? (
                filteredIncomingFriendRequests.length > 0 ? (
                  filteredIncomingFriendRequests.map(friend => (
                    <React.Fragment key={friend.id}>
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
                    <React.Fragment key={friend.id}>
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
                console.log('View profile:', selectedFriendId);
              }} 
              title="View Profile" 
              leadingIcon="account"
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                // TODO: Implement block user
                console.log('Block user:', selectedFriendId);
              }} 
              title="Block User" 
              leadingIcon="block-helper"
            />
            <Divider />
            <Menu.Item 
              onPress={() => selectedFriendId && handleRemoveFriend(selectedFriendId)} 
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
