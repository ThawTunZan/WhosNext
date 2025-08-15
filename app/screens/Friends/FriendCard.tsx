import React from 'react';
import { View } from 'react-native';
import { Surface, Avatar, Text, IconButton } from 'react-native-paper';

type Friend = {
  username: string;
  timestamp: any;
};

type FriendCardProps = {
  friend: Friend;
  theme: any;
  setButtonRef: (ref: View | null) => void;
  handleOpenMenu: (username: string) => void;
};

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  theme,
  setButtonRef,
  handleOpenMenu,
}) => (
  <Surface style={{ borderRadius: 12, marginBottom: 12, overflow: 'hidden', backgroundColor: theme.colors.surface }} elevation={1}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Avatar.Text size={50} label={friend.username.charAt(0)} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>{friend.username}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }} ref={setButtonRef}>
        <IconButton icon="dots-vertical" onPress={() => handleOpenMenu(friend.username)} />
      </View>
    </View>
  </Surface>
);