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
  IconButton,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  Divider,
  List,
  Switch,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type PaymentMethod = {
  id: string;
  type: 'card' | 'bank' | 'paypal' | 'venmo';
  name: string;
  isDefault: boolean;
  lastFour?: string;
  expiryDate?: string;
  icon: string;
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'card' | 'bank' | 'paypal' | 'venmo'>('card');

  // Dummy data for demonstration
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Chase Sapphire',
      lastFour: '4321',
      expiryDate: '12/25',
      isDefault: true,
      icon: 'credit-card',
    },
    {
      id: '2',
      type: 'bank',
      name: 'Bank of America',
      lastFour: '8765',
      isDefault: false,
      icon: 'bank',
    },
    {
      id: '3',
      type: 'paypal',
      name: 'PayPal',
      isDefault: false,
      icon: 'paypal',
    },
    {
      id: '4',
      type: 'venmo',
      name: 'Venmo',
      isDefault: false,
      icon: 'cash',
    },
  ]);

  const renderPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return 'credit-card-outline';
      case 'bank':
        return 'bank-outline';
      case 'paypal':
        return 'currency-usd';
      case 'venmo':
        return 'cash';
      default:
        return 'credit-card-outline';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Payment Methods</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
          Add and manage your payment methods
        </Text>
      </View>

      {/* Default Payment Method */}
      <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Default Payment Method"
          left={(props) => (
            <MaterialCommunityIcons
              name="star-circle"
              size={30}
              color="#FFD700"
              {...props}
            />
          )}
        />
        <Card.Content>
          {paymentMethods.find(m => m.isDefault) ? (
            <List.Item
              title={paymentMethods.find(m => m.isDefault)?.name}
              description={paymentMethods.find(m => m.isDefault)?.lastFour ? 
                `•••• ${paymentMethods.find(m => m.isDefault)?.lastFour}` : undefined}
              left={props => (
                <MaterialCommunityIcons
                  {...props}
                  name={renderPaymentMethodIcon(paymentMethods.find(m => m.isDefault)?.type || 'card')}
                  size={24}
                  color="#666"
                />
              )}
            />
          ) : (
            <Text>No default payment method set</Text>
          )}
        </Card.Content>
      </Card>

      {/* All Payment Methods */}
      <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Card.Title title="All Payment Methods" />
        <Card.Content>
          {paymentMethods.map((method) => (
            <List.Item
              key={method.id}
              title={method.name}
              description={method.lastFour ? `•••• ${method.lastFour}` : undefined}
              left={props => (
                <MaterialCommunityIcons
                  {...props}
                  name={renderPaymentMethodIcon(method.type)}
                  size={24}
                  color="#666"
                />
              )}
              right={props => (
                <View style={styles.methodActions}>
                  {method.isDefault && (
                    <Text style={[styles.defaultLabel, { color: theme.colors.primary }]}>Default</Text>
                  )}
                  <IconButton
                    {...props}
                    icon="dots-vertical"
                    onPress={() => {}}
                  />
                </View>
              )}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Add Payment Method Button */}
      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.addButton}
        icon="plus"
      >
        Add Payment Method
      </Button>

      {/* Add Payment Method Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Payment Method</Text>

          <SegmentedButtons
            value={selectedType}
            onValueChange={value => setSelectedType(value as any)}
            buttons={[
              { value: 'card', label: 'Card' },
              { value: 'bank', label: 'Bank' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'venmo', label: 'Venmo' },
            ]}
            style={styles.segmentedButtons}
          />

          {selectedType === 'card' && (
            <>
              <TextInput
                label="Card Number"
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />
              <View style={styles.row}>
                <TextInput
                  label="Expiry Date"
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/YY"
                />
                <TextInput
                  label="CVV"
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </>
          )}

          {selectedType === 'bank' && (
            <>
              <TextInput
                label="Account Number"
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />
              <TextInput
                label="Routing Number"
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />
            </>
          )}

          {(selectedType === 'paypal' || selectedType === 'venmo') && (
            <TextInput
              label="Email or Username"
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
            />
          )}

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Add
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
  section: {
    margin: 16,
    elevation: 2,
  },
  addButton: {
    margin: 16,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#2196F3',
    marginRight: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
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