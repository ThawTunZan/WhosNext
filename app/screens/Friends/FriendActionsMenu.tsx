import React from 'react';
import { Portal, Menu, Divider } from 'react-native-paper';

type FriendActionsMenuProps = {
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  menuPosition: { x: number; y: number } | null;
  selectedFriendUsername: string | null;
  handleRemoveFriend: (username: string) => void;
  theme: any;
};

export const FriendActionsMenu: React.FC<FriendActionsMenuProps> = ({
  menuVisible,
  setMenuVisible,
  menuPosition,
  selectedFriendUsername,
  handleRemoveFriend,
  theme,
}) => {
  return (
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
  );
};