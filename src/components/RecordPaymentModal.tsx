import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, List } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Payment } from '../services/FirebaseServices';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

type RecordPaymentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (paymentData: Payment) => void;
  profiles: Record<string, string>;
  debts: Record<string, number>;
  currentUserId: string;
  tripId: string;
};

export default function RecordPaymentModal({
  visible,
  onDismiss,
  onSubmit,
  profiles,
  debts,
  currentUserId,
  tripId
}: RecordPaymentModalProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [showPayerDropdown, setShowPayerDropdown] = useState(false);
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);
  const [method, setMethod] = useState<'cash' | 'transfer' | 'other'>('cash');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState(currentUserId);
  const [selectedPayee, setSelectedPayee] = useState('');
  const [amount, setAmount] = useState('');

  // Get list of all members who can be payers or payees
  const members = useMemo(() => {
    const memberIds = new Set<string>();
    
    // Add all members involved in debts
    Object.keys(debts).forEach(key => {
      const [debtor, creditor] = key.split('#');
      memberIds.add(debtor);
      memberIds.add(creditor);
    });
    
    return Array.from(memberIds).map(id => ({
      id,
      name: profiles[id] || id
    }));
  }, [debts, profiles]);

  const handleSubmit = () => {
    if (!selectedPayer || !selectedPayee || !amount) return;

    onSubmit({
      tripId,
      fromUserId: selectedPayer,
      toUserId: selectedPayee,
      amount: parseFloat(amount),
      method,
      paymentDate: date,
      note,
      createdTime: serverTimestamp(),
      createdDate: Timestamp.now()
    });

    // Reset form
    setAmount('');
    setMethod('cash');
    setDate(new Date());
    setNote('');
    setSelectedPayee('');
    setSelectedPayer(currentUserId);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <ScrollView>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.text }]}
          >
            Record Payment
          </Text>

          {/* Payer Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Paying From</Text>
            <List.Accordion
              title={selectedPayer ? profiles[selectedPayer] || selectedPayer : "Select payer"}
              expanded={showPayerDropdown}
              onPress={() => setShowPayerDropdown(!showPayerDropdown)}
              style={styles.dropdown}
            >
              {members.map((member) => (
                <List.Item
                  key={member.id}
                  title={member.name}
                  onPress={() => {
                    setSelectedPayer(member.id);
                    setShowPayerDropdown(false);
                  }}
                />
              ))}
            </List.Accordion>
          </View>

          {/* Payee Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Paying To</Text>
            <List.Accordion
              title={selectedPayee ? profiles[selectedPayee] || selectedPayee : "Select payee"}
              expanded={showPayeeDropdown}
              onPress={() => setShowPayeeDropdown(!showPayeeDropdown)}
              style={styles.dropdown}
            >
              {members
                .filter(member => member.id !== selectedPayer) // Exclude the selected payer
                .map((member) => (
                  <List.Item
                    key={member.id}
                    title={member.name}
                    description={debts[`${selectedPayer}#${member.id}`] > 0 ? 
                      `Owed $${debts[`${selectedPayer}#${member.id}`].toFixed(2)}` : 
                      undefined}
                    onPress={() => {
                      setSelectedPayee(member.id);
                      setShowPayeeDropdown(false);
                    }}
                  />
              ))}
            </List.Accordion>
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              placeholder="Enter amount"
              style={styles.input}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Payment Method</Text>
            <SegmentedButtons
              value={method}
              onValueChange={value => setMethod(value as 'cash' | 'transfer' | 'other')}
              buttons={[
                { value: 'cash', label: '💵 Cash' },
                { value: 'transfer', label: '🏦 Transfer' },
                { value: 'other', label: '📝 Other' }
              ]}
            />
          </View>

          {/* Date Picker */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Date</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setDate(selectedDate);
                }}
                style={styles.datePicker}
              />
            ) : (
              <>
                <Button
                  onPress={() => setShowDatePicker(true)}
                  mode="outlined"
                >
                  {date.toLocaleDateString()}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Note Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              mode="outlined"
              placeholder="Add a note"
              multiline
              style={styles.input}
              maxLength={100}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              disabled={!selectedPayer || !selectedPayee || !amount}
            >
              Record Payment
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  datePicker: {
    width: '100%',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
  },
}); 