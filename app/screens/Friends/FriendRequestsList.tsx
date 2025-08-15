import React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { FriendRequestCard } from './FriendRequestCard';

type Friend = {
  username: string;
  timestamp: any;
};

type FriendRequestsListProps = {
  type: 'incoming' | 'outgoing';
  requests: Friend[];
  theme: any;
  handleAcceptRequest?: (username: string) => void;
  handleDeclineRequest?: (username: string) => void;
  handleCancelRequest?: (username: string) => void;
  styles: any;
  isLoading?: boolean;
  cancelingRequestId?: string | null;
};

export const FriendRequestsList: React.FC<FriendRequestsListProps> = ({
  type,
  requests,
  theme,
  handleAcceptRequest,
  handleDeclineRequest,
  handleCancelRequest,
  styles,
  isLoading,
  cancelingRequestId,
}) => {
  if (requests.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <IconButton icon={type === 'incoming' ? 'inbox-arrow-down' : 'inbox-arrow-up'} size={48} />
        <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>
          {type === 'incoming' ? 'No incoming friend requests' : 'No outgoing friend requests'}
        </Text>
      </View>
    );
  }

  return (
    <>
      {requests.map(friend => (
        <FriendRequestCard
          key={friend.username}
          friend={friend}
          type={type}
          theme={theme}
          handleAcceptRequest={handleAcceptRequest}
          handleDeclineRequest={handleDeclineRequest}
          handleCancelRequest={handleCancelRequest}
          isLoading={isLoading}
          cancelingRequestId={cancelingRequestId}
        />
      ))}
    </>
  );
};