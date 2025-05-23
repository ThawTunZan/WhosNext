import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  Avatar,
  List,
  Chip,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  status: 'active' | 'pending' | 'blocked';
  groups: string[];
  lastInteraction?: string;
};

type Group = {
  id: string;
  name: string;
  members: string[];
  color: string;
};

export default function FriendsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'groups'>('all');

  // Dummy data for demonstration
  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      groups: ['Family', 'Close Friends'],
      lastInteraction: '2 days ago',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'active',
      groups: ['Work', 'Close Friends'],
      lastInteraction: '5 days ago',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      status: 'pending',
      groups: [],
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      status: 'blocked',
      groups: ['Work'],
      lastInteraction: '1 month ago',
    },
  ]);

  const [groups] = useState<Group[]>([
    {
      id: '1',
      name: 'Family',
      members: ['1'],
      color: '#FF9800',
    },
    {
      id: '2',
      name: 'Work',
      members: ['2', '4'],
      color: '#2196F3',
    },
    {
      id: '3',
      name: 'Close Friends',
      members: ['1', '2'],
      color: '#4CAF50',
    },
  ]);

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'blocked':
        return '#F44336';
      default:
        return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Friends</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Manage your friends and groups
        </Text>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search friends..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
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
        <Card style={styles.section}>
          <Card.Content>
            {friends.map((friend) => (
              <List.Item
                key={friend.id}
                title={friend.name}
                description={friend.email}
                left={props => (
                  <Avatar.Text
                    {...props}
                    size={40}
                    label={friend.name.split(' ').map(n => n[0]).join('')}
                  />
                )}
                right={props => (
                  <View style={styles.friendActions}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(friend.status) }
                    ]} />
                    <IconButton
                      {...props}
                      icon="dots-vertical"
                      onPress={() => {}}
                    />
                  </View>
                )}
                style={styles.friendItem}
              />
            ))}
          </Card.Content>
        </Card>
      ) : (
        // Groups List
        <Card style={styles.section}>
          <Card.Content>
            {groups.map((group) => (
              <List.Item
                key={group.id}
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
                  <IconButton
                    {...props}
                    icon="dots-vertical"
                    onPress={() => {}}
                  />
                )}
                style={styles.groupItem}
              />
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
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Add Friend
          </Text>
          <TextInput
            label="Email or Username"
            mode="outlined"
            style={styles.input}
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
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Create Group
          </Text>
          <TextInput
            label="Group Name"
            mode="outlined"
            style={styles.input}
          />
          <Text variant="bodyMedium" style={styles.label}>
            Select Members
          </Text>
          <ScrollView style={styles.membersList}>
            {friends
              .filter(f => f.status === 'active')
              .map(friend => (
                <List.Item
                  key={friend.id}
                  title={friend.name}
                  left={props => (
                    <Avatar.Text
                      {...props}
                      size={40}
                      label={friend.name.split(' ').map(n => n[0]).join('')}
                    />
                  )}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="checkbox-blank-outline"
                      onPress={() => {}}
                    />
                  )}
                />
              ))}
          </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
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
  friendItem: {
    paddingVertical: 8,
  },
  groupItem: {
    paddingVertical: 8,
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
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  membersList: {
    maxHeight: 200,
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