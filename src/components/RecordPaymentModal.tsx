import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, List, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Currency, Debt } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { Payment } from '@/src/services/FirebaseServices';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

type RecordPaymentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (payment: Payment) => Promise<void>;
  profiles: Record<string, string>;
  debts: Debt[];
  currentUserId: string;
  tripId: string;
  defaultCurrency: Currency;
};

export default function RecordPaymentModal({
  visible,
  onDismiss,
  onSubmit,
  profiles,
  debts = [],
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
  const members = React.useMemo(() => {
    const memberIds = new Set<string>();
    
    // Add all members involved in debts
    if (Array.isArray(debts)) {
      debts.forEach(debt => {
        memberIds.add(debt.fromUserId);
        memberIds.add(debt.toUserId);
      });
    }
    
    return Array.from(memberIds).map(id => ({
      id,
      name: profiles[id] || id
    }));
  }, [debts, profiles]);

  // Get the total debt amount between two members
  const getDebtAmount = async (fromId: string, toId: string): Promise<number> => {
    let totalDebt = 0;
    for (const debt of debts) {
      if (debt.fromUserId === fromId && debt.toUserId === toId) {
        const convertedAmount = await convertCurrency(debt.amount, debt.currency, defaultCurrency);
        totalDebt += convertedAmount;
      }
    }
    return totalDebt;
  };

  const handleSubmit = async () => {
    if (!selectedPayer || !selectedPayee || !amount) {
      // Show error or validation message
      return;
    }

    const payment: Payment = {
      fromUserId: selectedPayer,
      toUserId: selectedPayee,
      amount: parseFloat(amount),
      currency: selectedCurrency,
      method,
      paymentDate: date,
      note,
      tripId,
      createdTime: serverTimestamp(),
      createdDate: Timestamp.now()
    };

    await onSubmit(payment);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Record Payment</Text>

        {/* Payer Selection */}
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
                  setSelectedPayee(''); // Reset payee when payer changes
                }}
              />
            ))}
          </List.Accordion>
        </View>

        {/* Payee Selection */}
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
                  description={async () => {
                    const debtAmount = await getDebtAmount(selectedPayer, member.id);
                    return debtAmount > 0 ? 
                      `Owed ${debtAmount.toFixed(2)} ${defaultCurrency}` : 
                      undefined;
                  }}
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
          <View style={styles.methodContainer}>
            <Button
              mode={method === 'cash' ? 'contained' : 'outlined'}
              onPress={() => setMethod('cash')}
              style={styles.methodButton}
            >
              Cash
            </Button>
            <Button
              mode={method === 'transfer' ? 'contained' : 'outlined'}
              onPress={() => setMethod('transfer')}
              style={styles.methodButton}
            >
              Transfer
            </Button>
            <Button
              mode={method === 'other' ? 'contained' : 'outlined'}
              onPress={() => setMethod('other')}
              style={styles.methodButton}
            >
              Other
            </Button>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Date</Text>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {format(date, 'MMM d, yyyy')}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
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
            style={styles.noteInput}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={onDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSubmit} style={styles.button}>
            Record Payment
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginRight: 8,
  },
  currencyButton: {
    minWidth: 80,
  },
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateButton: {
    alignSelf: 'flex-start',
  },
  noteInput: {
    height: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    marginLeft: 8,
  },
}); 