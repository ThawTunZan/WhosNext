import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar, IconButton, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type Friend = {
  username: string;
  timestamp: any;
};

interface FriendCardProps {
  friend: Friend;
  onMenuPress: (friendId: string, position: { x: number; y: number }) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, onMenuPress }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleMenuPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    onMenuPress(friend.username, { x: pageX, y: pageY });
  };

  return (
    <Surface style={[styles.friendCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.friendInfo}>
        <Avatar.Text size={50} label={friend.username.charAt(0).toUpperCase()} />
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: theme.colors.text }]}>
            {friend.username}
          </Text>
        </View>
      </View>
      <IconButton
        icon="dots-vertical"
        size={20}
        iconColor={theme.colors.subtext}
        onPress={handleMenuPress}
      />
    </Surface>
  );
};

interface FriendRequestCardProps {
  friend: Friend;
  type: 'incoming' | 'outgoing';
  onAccept?: (friendId: string) => void;
  onDecline?: (friendId: string) => void;
  isLoading?: boolean;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  friend,
  type,
  onAccept,
  onDecline,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Surface style={[styles.requestCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.requestInfo}>
        <Avatar.Text size={40} label={friend.username.charAt(0).toUpperCase()} />
        <View style={styles.requestDetails}>
          <Text style={[styles.requestName, { color: theme.colors.text }]}>
            {friend.username}
          </Text>
          <Text style={[styles.requestText, { color: theme.colors.subtext }]}>
            {type === 'incoming' ? 'wants to be your friend' : 'friend request sent'}
          </Text>
        </View>
      </View>
      
      {type === 'incoming' && (
        <View style={styles.requestActions}>
          <Button
            mode="contained"
            onPress={() => onAccept?.(friend.username)}
            disabled={isLoading}
            style={styles.acceptButton}
            contentStyle={styles.buttonContent}
          >
            Accept
          </Button>
          <Button
            mode="outlined"
            onPress={() => onDecline?.(friend.username)}
            disabled={isLoading}
            style={styles.declineButton}
            contentStyle={styles.buttonContent}
          >
            Decline
          </Button>
        </View>
      )}
      
      {type === 'outgoing' && (
        <Text style={[styles.pendingText, { color: theme.colors.subtext }]}>
          Pending
        </Text>
      )}
    </Surface>
  );
};

interface SearchResultCardProps {
  user: Friend;
  onSendRequest: (username: string) => void;
  isLoading?: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  user,
  onSendRequest,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Surface style={[styles.searchCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.searchInfo}>
        <Avatar.Text size={40} label={user.username.charAt(0).toUpperCase()} />
        <View style={styles.searchDetails}>
          <Text style={[styles.searchName, { color: theme.colors.text }]}>
            {user.username}
          </Text>
        </View>
      </View>
      <Button
        mode="contained"
        onPress={() => onSendRequest(user.username)}
        disabled={isLoading}
        contentStyle={styles.buttonContent}
      >
        Add Friend
      </Button>
    </Surface>
  );
};

const styles = StyleSheet.create({
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
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
    fontWeight: '500',
  },
  friendEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  requestCard: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestText: {
    fontSize: 14,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 1,
    marginRight: 8,
  },
  declineButton: {
    flex: 1,
    marginLeft: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  searchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchDetails: {
    marginLeft: 12,
    flex: 1,
  },
  searchName: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchEmail: {
    fontSize: 14,
    marginTop: 2,
  },
});

// Default export for the main component
const FriendComponents = {
  FriendCard,
  FriendRequestCard,
  SearchResultCard,
};

export default FriendComponents; 