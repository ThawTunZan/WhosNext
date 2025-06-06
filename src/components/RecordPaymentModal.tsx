import React, { useState, memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, List, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Currency, Debt, Member } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { Payment } from '@/src/services/FirebaseServices';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import CurrencyModal from '@/app/trip/components/CurrencyModal';
import { useMemberProfiles } from "@/src/context/MemberProfilesContext";

type RecordPaymentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (payment: Payment) => Promise<void>;
  debts: Debt[];
  currentUserId: string;
  tripId: string;
  defaultCurrency: Currency;
  members: Record<string, Member>;
};

const MemberList = memo(({ 
  members, 
  selectedId, 
  onSelect, 
  onClose,
  excludeId,
  theme
}: { 
  members: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  excludeId?: string;
  theme: any;
}) => {
  const filteredMembers = excludeId ? members.filter(m => m.id !== excludeId) : members;
  
  return (
    <View style={styles.dropdownOverlay}>
      <ScrollView 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        style={[styles.dropdownScroll, { backgroundColor: theme.colors.surface }]}
      >
        {filteredMembers.map((member) => (
          <List.Item
            key={member.id}
            title={member.name}
            onPress={() => {
              onSelect(member.id);
              onClose();
            }}
            style={[
              styles.dropdownItem,
              selectedId === member.id && { backgroundColor: theme.colors.primaryContainer }
            ]}
          />
        ))}
      </ScrollView>
    </View>
  );
});

export default function RecordPaymentModal({
  visible,
  onDismiss,
  onSubmit,
  debts = [],
  currentUserId,
  tripId,
  defaultCurrency = 'USD',
  members
}: RecordPaymentModalProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const profiles = useMemberProfiles();

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
  const membersList = React.useMemo(() => {
    return Object.entries(members).map(([id, member]) => ({
      id,
      name: profiles[id] || id
    }));
  }, [members, profiles]);

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
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                <Text style={[styles.title, { color: theme.colors.text }]}>Record Payment</Text>

                {/* Payer Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Paying From</Text>
                  <List.Accordion
                    title={selectedPayer ? profiles[selectedPayer] || selectedPayer : "Select payer"}
                    expanded={showPayerDropdown}
                    onPress={() => setShowPayerDropdown(!showPayerDropdown)}
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}
                  >
                    <MemberList
                      members={membersList}
                      selectedId={selectedPayer}
                      onSelect={setSelectedPayer}
                      onClose={() => setShowPayerDropdown(false)}
                      theme={theme}
                    />
                  </List.Accordion>
                </View>

                {/* Payee Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Paying To</Text>
                  <List.Accordion
                    title={selectedPayee ? profiles[selectedPayee] || selectedPayee : "Select payee"}
                    expanded={showPayeeDropdown}
                    onPress={() => setShowPayeeDropdown(!showPayeeDropdown)}
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}
                  >
                    <MemberList
                      members={membersList}
                      selectedId={selectedPayee}
                      onSelect={setSelectedPayee}
                      onClose={() => setShowPayeeDropdown(false)}
                      excludeId={selectedPayer}
                      theme={theme}
                    />
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
                  <View style={[styles.methodContainer, { backgroundColor: theme.colors.surface }]}>
                    <Button
                      mode={method === 'cash' ? 'contained' : 'outlined'}
                      onPress={() => setMethod('cash')}
                      style={styles.methodButton}
                      icon="cash"
                    >
                      Cash
                    </Button>
                    <Button
                      mode={method === 'transfer' ? 'contained' : 'outlined'}
                      onPress={() => setMethod('transfer')}
                      style={styles.methodButton}
                      icon="bank-transfer"
                    >
                      Transfer
                    </Button>
                    <Button
                      mode={method === 'other' ? 'contained' : 'outlined'}
                      onPress={() => setMethod('other')}
                      style={styles.methodButton}
                      icon="dots-horizontal"
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
              </ScrollView>
              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button mode="outlined" onPress={onDismiss} style={styles.button}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleSubmit} style={styles.button}>
                  Record Payment
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <CurrencyModal
        visible={showCurrencyDialog}
        onDismiss={() => setShowCurrencyDialog(false)}
        onSelectCurrency={(currency) => {
          setSelectedCurrency(currency);
          setShowCurrencyDialog(false);
        }}
        selectedCurrency={selectedCurrency}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: '100%',
    flex: 1,
  },
  container: {
    padding: 20,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    marginTop: 8,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    height: 40,
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
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 200,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
}); 