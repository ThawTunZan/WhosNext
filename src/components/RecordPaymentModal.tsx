import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, List, Dialog } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Payment } from '../services/FirebaseServices';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { Currency } from '../types/DataTypes';
import CurrencyModal from '@/app/trip/components/CurrencyModal';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../utilities/CurrencyUtilities';

const CURRENCIES: Currency[] = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY', 'JPY', 'INR',
  'BRL', 'MXN', 'RUB', 'ZAR', 'HKD', 'SGD', 'NOK', 'SEK', 'NZD'
] as Currency[];

type RecordPaymentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (paymentData: Payment) => void;
  profiles: Record<string, string>;
  debts: Record<string, number>;
  currentUserId: string;
  tripId: string;
  defaultCurrency?: Currency;
};

export default function RecordPaymentModal({
  visible,
  onDismiss,
  onSubmit,
  profiles,
  debts,
  currentUserId,
  tripId,
  defaultCurrency = 'USD'
}: RecordPaymentModalProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [showPayerDropdown, setShowPayerDropdown] = useState(false);
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [method, setMethod] = useState<'cash' | 'transfer' | 'other'>('cash');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState(currentUserId);
  const [selectedPayee, setSelectedPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);

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
      currency: selectedCurrency,
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
    setSelectedCurrency(defaultCurrency);
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
                      `Owed ${formatCurrency(debts[`${selectedPayer}#${member.id}`], selectedCurrency)}` : 
                      undefined}
                    onPress={() => {
                      setSelectedPayee(member.id);
                      setShowPayeeDropdown(false);
                    }}
                  />
              ))}
            </List.Accordion>
          </View>

          {/* Amount and Currency Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Amount</Text>
            <View style={styles.amountContainer}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                mode="outlined"
                placeholder="Enter amount"
                style={styles.amountInput}
              />
              <Button
                mode="outlined"
                onPress={() => setShowCurrencyDialog(true)}
                style={styles.currencyButton}
              >
                {selectedCurrency}
              </Button>
            </View>
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
            <Text style={[styles.label, { color: theme.colors.text }]}>Note (Optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              mode="outlined"
              placeholder="Add a note"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={!selectedPayer || !selectedPayee || !amount}
          >
            Record Payment
          </Button>
        </ScrollView>
      </Modal>

      <CurrencyModal
        visible={showCurrencyDialog}
        onDismiss={() => setShowCurrencyDialog(false)}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
      />
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
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 2,
  },
  currencyButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  dropdown: {
    marginTop: 4,
  },
  datePicker: {
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
  },
}); 