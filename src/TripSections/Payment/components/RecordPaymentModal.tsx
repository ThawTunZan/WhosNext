import React, { useState, memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, List, Text, HelperText } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Debt, Member, Payment } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import CurrencyModal from '@/app/trip/components/CurrencyModal';

type RecordPaymentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (payment: Payment) => Promise<void>;
  debts: Debt[];
  currentUsername: string;
  tripId: string;
  defaultCurrency: string;
  members: Record<string, Member>;
};

const MemberList = memo(({ 
  members, 
  selectedUsername, 
  onSelect, 
  onClose,
  excludeUsername,
  theme,
  isPayee = false,
  getDebtAmount,
  selectedPayer,
  onDebtSelect
}: { 
  members: { username: string; name: string }[];
  selectedUsername: string;
  onSelect: (username: string) => void;
  onClose: () => void;
  excludeUsername?: string;
  theme: any;
  isPayee?: boolean;
  getDebtAmount?: (fromUsername: string, toUsername: string) => Promise<{amount: number, currency: string}>;
  selectedPayer?: string;
  onDebtSelect?: (amount: number, currency: string) => void;
}) => {
  const filteredMembers = excludeUsername ? members.filter(m => m.username !== excludeUsername) : members;
  const [memberDebts, setMemberDebts] = useState<Record<string, {amount: number, currency: string}>>({});

  // Fetch debt amounts for payee list
  React.useEffect(() => {
    const fetchDebts = async () => {
      if (!isPayee || !getDebtAmount || !selectedPayer) {
        console.log('Skipping debt fetch - conditions not met');
        return;
      }
      
      const debts: Record<string, {amount: number, currency: string}> = {};
      for (const member of filteredMembers) {
        const debt = await getDebtAmount(selectedPayer, member.username);
        if (debt.amount > 0) {
          debts[member.username] = debt;
        }
      }
      setMemberDebts(debts);
    };

    fetchDebts();
  }, [isPayee, getDebtAmount, selectedPayer, filteredMembers]);
  
  return (
    <View style={styles.dropdownOverlay}>
      <ScrollView 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        style={[styles.dropdownScroll, { backgroundColor: theme.colors.surface }]}
      >
        {filteredMembers.map((member) => {
          const debt = memberDebts[member.username];
          return (
            <List.Item
              key={member.username}
              title={
                <View style={styles.memberItemContent}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  {debt && (
                    <Text style={[styles.debtAmount, { color: theme.colors.primary }]}>
                      {` (Owes ${debt.currency} ${debt.amount.toFixed(2)})`}
                    </Text>
                  )}
                </View>
              }
              onPress={() => {
                onSelect(member.username);
                if (debt && onDebtSelect) {
                  onDebtSelect(debt.amount, debt.currency);
                }
                onClose();
              }}
              style={[
                styles.dropdownItem,
                selectedUsername === member.username && { backgroundColor: theme.colors.primaryContainer }
              ]}
            />
          );
        })}
      </ScrollView>
    </View>
  );
});

export default function RecordPaymentModal({
  visible,
  onDismiss,
  onSubmit,
  debts = [],
  currentUsername,
  tripId,
  defaultCurrency = 'USD',
  members
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
  const [selectedPayer, setSelectedPayer] = useState(currentUsername);
  const [selectedPayee, setSelectedPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get list of all members who can be payers or payees
  const membersList = React.useMemo(() => {
    return Object.entries(members).map(([username, member]) => ({
      username,
      name: username
    }));
  }, [members]);

  // Get the total debt amount between two members
  const getDebtAmountForMember = async (fromUsername: string, toUsername: string): Promise<{amount: number, currency: string}> => {
    
    // Handle the new debt structure where debts is an object keyed by currency
    if (typeof debts === 'object' && !Array.isArray(debts)) {
      for (const [currency, debtsByUser] of Object.entries(debts)) {
        // Check if there's a debt from the payer to the payee
        const debtKey = `${fromUsername}#${toUsername}`;
        const amount = debtsByUser[debtKey];
        
        if (amount) {
          return { amount, currency: currency };
        }
      }
    }

    console.log('No matching debt found, returning 0');
    return { amount: 0, currency: defaultCurrency };
  };

  const handleSubmit = async () => {
    // Date validation
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      setErrors({ date: 'Please select a valid date.' });
      return;
    }
    if (!selectedPayer || !selectedPayee || !amount) {
      // Show error or validation message
      return;
    }
    setErrors({});
    const payment: Payment = {
      fromUserName: selectedPayer,
      toUserName: selectedPayee,
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
                    title={selectedPayer || "Select payer"}
                    expanded={showPayerDropdown}
                    onPress={() => setShowPayerDropdown(!showPayerDropdown)}
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}
                  >
                    <MemberList
                      members={membersList}
                      selectedUsername={selectedPayer}
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
                    title={selectedPayee || "Select payee"}
                    expanded={showPayeeDropdown}
                    onPress={() => {
                      setShowPayeeDropdown(!showPayeeDropdown);
                    }}
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}
                  >
                    <MemberList
                      members={membersList}
                      selectedUsername={selectedPayee}
                      onSelect={setSelectedPayee}
                      onClose={() => setShowPayeeDropdown(false)}
                      excludeUsername={selectedPayer}
                      theme={theme}
                      isPayee={true}
                      getDebtAmount={getDebtAmountForMember}
                      selectedPayer={selectedPayer}
                      onDebtSelect={(amount, currency) => {
                        
                        setAmount(amount.toString());
                        setSelectedCurrency(currency);
                      }}
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
                  {errors.date && <HelperText type="error">{errors.date}</HelperText>}
                </View>

                {/* Note Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Note (Optional)</Text>
                  <TextInput
                    value={note}
                    maxLength={100}
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  memberItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  memberName: {
    fontSize: 16,
  },
  debtAmount: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
}); 