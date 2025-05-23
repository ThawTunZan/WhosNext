import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
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
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type Friend = {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline';
  avatar?: string;
};

type Group = {
  id: string;
  name: string;
  members: string[];
  color: string;
};

export default function FriendsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'groups'>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  // Dummy data
  const friends: Friend[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'online' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'offline' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', status: 'online' },
  ];

  const groups: Group[] = [
    { id: '1', name: 'Travel Buddies', members: ['1', '2'], color: '#4CAF50' },
    { id: '2', name: 'Weekend Squad', members: ['1', '2', '3'], color: '#2196F3' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Friends & Groups</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
          Manage your friends and groups
        </Text>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search friends..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        iconColor={theme.colors.text}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.subtext}
      />

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <Button
          mode={selectedTab === 'all' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('all')}
          style={styles.tabButton}
        >
          All Friends
        </Button>
        <Button
          mode={selectedTab === 'groups' ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab('groups')}
          style={styles.tabButton}
        >
          Groups
        </Button>
      </View>

      {selectedTab === 'all' ? (
        // Friends List
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {friends.map((friend) => (
              <React.Fragment key={friend.id}>
                <List.Item
                  title={friend.name}
                  description={friend.email}
                  left={props => (
                    <Avatar.Text
                      {...props}
                      size={40}
                      label={friend.name.charAt(0)}
                    />
                  )}
                  right={props => (
                    <View style={styles.friendActions}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: friend.status === 'online' ? theme.colors.success : theme.colors.subtext }
                      ]} />
                      <IconButton {...props} icon="dots-vertical" onPress={() => {}} />
                    </View>
                  )}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.subtext }}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      ) : (
        // Groups List
        <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {groups.map((group) => (
              <React.Fragment key={group.id}>
                <List.Item
                  title={group.name}
                  description={`${group.members.length} members`}
                  left={props => (
                    <Avatar.Text
                      {...props}
                      size={40}
                      label={group.name[0]}
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  right={props => (
                    <IconButton {...props} icon="dots-vertical" onPress={() => {}} />
                  )}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.subtext }}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => setAddModalVisible(true)}
          icon="account-plus"
          style={styles.actionButton}
        >
          Add Friend
        </Button>
        <Button
          mode="contained"
          onPress={() => setGroupModalVisible(true)}
          icon="account-group"
          style={styles.actionButton}
        >
          Create Group
        </Button>
      </View>

      {/* Add Friend Modal */}
      <Portal>
        <Modal
          visible={addModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Friend</Text>
          <TextInput
            label="Email or Username"
            mode="outlined"
            style={styles.input}
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
              onPress={() => setAddModalVisible(false)}
              style={styles.modalButton}
            >
              Send Invite
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Create Group Modal */}
      <Portal>
        <Modal
          visible={groupModalVisible}
          onDismiss={() => setGroupModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Create Group</Text>
          <TextInput
            label="Group Name"
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setGroupModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => setGroupModalVisible(false)}
              style={styles.modalButton}
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  section: {
    margin: 16,
    elevation: 2,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
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
}); 