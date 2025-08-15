import React from 'react';
import { View } from 'react-native';
import { Surface, IconButton, Text, Avatar, Button } from 'react-native-paper';

type Friend = {
  username: string;
  timestamp: any;
};

type FriendRequestCardProps = {
  friend: Friend;
  type: 'incoming' | 'outgoing';
  theme: any;
  handleAcceptRequest?: (username: string) => void;
  handleDeclineRequest?: (username: string) => void;
  handleCancelRequest?: (username: string) => void;
  isLoading?: boolean;
  cancelingRequestId?: string | null;
};

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  friend,
  type,
  theme,
  handleAcceptRequest,
  handleDeclineRequest,
  handleCancelRequest,
  isLoading,
  cancelingRequestId,
}) => (
  <Surface style={{ borderRadius: 16, marginBottom: 16, overflow: 'hidden', backgroundColor: theme.colors.surface }} elevation={2}>
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton
          icon={type === 'incoming' ? 'arrow-down' : 'arrow-up'}
          size={20}
          iconColor={type === 'incoming' ? theme.colors.primary : theme.colors.info}
        />
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: type === 'incoming' ? theme.colors.primary : theme.colors.info,
        }}>
          {type === 'incoming' ? 'Incoming Request' : 'Outgoing Request'}
        </Text>
      </View>
    </View>
    <View style={{ padding: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Avatar.Text
          size={60}
          label={friend.username.charAt(0)}
          style={{ backgroundColor: type === 'incoming' ? theme.colors.primary : theme.colors.info }}
        />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>{friend.username}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {type === 'incoming' ? (
          <>
            <Button
              mode="contained"
              onPress={() => handleAcceptRequest && handleAcceptRequest(friend.username)}
              style={{ borderRadius: 8, marginVertical: 4, marginBottom: 8 }}
              contentStyle={{ height: 36 }}
              labelStyle={{ fontSize: 14, fontWeight: '600' }}
            >
              Accept
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDeclineRequest && handleDeclineRequest(friend.username)}
              style={{ borderRadius: 8, marginVertical: 4, borderColor: theme.colors.error }}
              contentStyle={{ height: 36 }}
              labelStyle={{ fontSize: 14, fontWeight: '600' }}
            >
              Decline
            </Button>
          </>
        ) : (
          <Button
            mode="outlined"
            onPress={() => handleCancelRequest && handleCancelRequest(friend.username)}
            style={{ borderRadius: 8, marginVertical: 4, borderColor: theme.colors.error }}
            contentStyle={{ height: 36 }}
            labelStyle={{ fontSize: 14, fontWeight: '600' }}
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