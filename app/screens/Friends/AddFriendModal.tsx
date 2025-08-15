import React from 'react';
import { View } from 'react-native';
import { Portal, Modal, Text, TextInput, Button } from 'react-native-paper';

type AddFriendModalProps = {
  visible: boolean;
  onDismiss: () => void;
  theme: any;
  newFriendUsername: string;
  setNewFriendUsername: (username: string) => void;
  handleSendFriendRequest: () => void;
  isLoading: boolean;
  styles: any;
};

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onDismiss,
  theme,
  newFriendUsername,
  setNewFriendUsername,
  handleSendFriendRequest,
  isLoading,
  styles,
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
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
          onPress={onDismiss}
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
);