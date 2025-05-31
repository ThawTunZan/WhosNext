import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, List, Avatar, TextInput, IconButton, Surface, Divider } from 'react-native-paper';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { getFriendsList, getUserById } from '@/src/services/FirebaseServices';
import { useUser } from '@clerk/clerk-expo';

type Friend = {
  id: string;
  username: string;
  status?: 'online' | 'offline' | 'pending';
};

type SelectFriendsModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSelectFriend: (friendId: string, friendName: string, budget: number) => void;
};

export default function SelectFriendsModal({ visible, onDismiss, onSelectFriend }: SelectFriendsModalProps) {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user } = useUser();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [budget, setBudget] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const friendIds = await getFriendsList(user.id);
      
      // Fetch complete data for each friend
      const friendsData = await Promise.all(
        friendIds.map(async (friendId: string) => {
          const friendData = await getUserById(friendId);
          if (!friendData) return null;
          
          return {
            id: friendId,
            username: friendData.username || 'Unknown',
            status: friendData.status || 'offline'
          };
        })
      );

      // Filter out any null values and set friends
      const validFriends = friendsData.filter((friend): friend is Friend => friend !== null);
      setFriends(validFriends);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setBudget('');
    setError(null);
  };

  const handleAdd = () => {
    if (!selectedFriend) {
      setError('Please select a friend');
      return;
    }
    
    const budgetNum = Number(budget);
    if (!budgetNum || budgetNum <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    onSelectFriend(selectedFriend.id, selectedFriend.username, budgetNum);
    onDismiss();
  };

  // Add loading state UI
  if (loading) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <View style={styles.header}>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
              Loading Friends...
            </Text>
            <IconButton icon="close" size={24} onPress={onDismiss} />
          </View>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
            Select Friend
          </Text>
          <IconButton icon="close" size={24} onPress={onDismiss} />
        </View>

        <TextInput
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { backgroundColor: theme.colors.background }]}
          mode="outlined"
        />

        <Surface style={[styles.friendsList, { backgroundColor: theme.colors.background }]}>
          {filteredFriends.map((friend) => (
            <React.Fragment key={friend.id}>
              <List.Item
                title={friend.username}
                left={props => (
                  <Avatar.Text
                    {...props}
                    size={40}
                    label={friend.username.substring(0, 2).toUpperCase()}
                  />
                )}
                right={props => (
                  <IconButton
                    {...props}
                    icon={selectedFriend?.id === friend.id ? "check-circle" : "checkbox-blank-circle-outline"}
                    selected={selectedFriend?.id === friend.id}
                    onPress={() => handleSelectFriend(friend)}
                  />
                )}
                onPress={() => handleSelectFriend(friend)}
                style={[
                  styles.friendItem,
                  selectedFriend?.id === friend.id && { backgroundColor: theme.colors.surface }
                ]}
              />
              <Divider />
            </React.Fragment>
          ))}
        </Surface>

        {selectedFriend && (
          <View style={styles.budgetSection}>
            <TextInput
              label="Budget Amount"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.budgetInput, { backgroundColor: theme.colors.background }]}
              left={<TextInput.Affix text="$" />}
            />
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.actions}>
          <Button onPress={onDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAdd}
            style={styles.button}
            disabled={!selectedFriend || !budget}
          >
            Add Friend
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
  },
  searchInput: {
    marginBottom: 16,
  },
  friendsList: {
    maxHeight: 300,
    borderRadius: 8,
  },
  friendItem: {
    borderRadius: 8,
  },
  budgetSection: {
    marginTop: 16,
  },
  budgetInput: {
    marginBottom: 8,
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 8,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  button: {
    minWidth: 100,
  },
}); 