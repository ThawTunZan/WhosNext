import React, { useState, memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, List, Text } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Currency, Debt, Member, Payment } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';
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
  theme,
  isPayee = false,
  getDebtAmount,
  selectedPayer,
  onDebtSelect
}: { 
  members: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  excludeId?: string;
  theme: any;
  isPayee?: boolean;
  getDebtAmount?: (fromId: string, toId: string) => Promise<{amount: number, currency: Currency}>;
  selectedPayer?: string;
  onDebtSelect?: (amount: number, currency: Currency) => void;
}) => {
  const filteredMembers = excludeId ? members.filter(m => m.id !== excludeId) : members;
  const [memberDebts, setMemberDebts] = useState<Record<string, {amount: number, currency: Currency}>>({});

  console.log('MemberList render - isPayee:', isPayee);
  console.log('MemberList render - selectedPayer:', selectedPayer);
  console.log('MemberList render - memberDebts:', memberDebts);

  // Fetch debt amounts for payee list
  React.useEffect(() => {
    const fetchDebts = async () => {
      console.log('Starting fetchDebts - conditions:', {
        isPayee,
        hasGetDebtAmount: !!getDebtAmount,
        selectedPayer,
        memberCount: filteredMembers.length
      });

      if (!isPayee || !getDebtAmount || !selectedPayer) {
        console.log('Skipping debt fetch - conditions not met');
        return;
      }
      
      const debts: Record<string, {amount: number, currency: Currency}> = {};
      for (const member of filteredMembers) {
        console.log('Fetching debt for member:', member.id);
        const debt = await getDebtAmount(selectedPayer, member.id);
        console.log('Received debt:', debt, 'for member:', member.id);
        if (debt.amount > 0) {
          debts[member.id] = debt;
        }
      }
      console.log('Setting memberDebts:', debts);
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
          const debt = memberDebts[member.id];
          console.log('Rendering member:', member.id, 'debt:', debt);
          
          return (
            <List.Item
              key={member.id}
              title={
                <View style={styles.memberItemContent}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {debt && (
                    <Text style={[styles.debtAmount, { color: theme.colors.primary }]}>
                      {` (Owes ${debt.currency} ${debt.amount.toFixed(2)})`}
                    </Text>
                  )}
                </View>
              }
              onPress={() => {
                onSelect(member.id);
                if (debt && onDebtSelect) {
                  onDebtSelect(debt.amount, debt.currency);
                }
                onClose();
              }}
              style={[
                styles.dropdownItem,
                selectedId === member.id && { backgroundColor: theme.colors.primaryContainer }
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
  const getDebtAmountForMember = async (fromId: string, toId: string): Promise<{amount: number, currency: Currency}> => {
    console.log('getDebtAmountForMember called with:', { fromId, toId });
    console.log('Current debts:', debts);
    
    // Handle the new debt structure where debts is an object keyed by currency
    if (typeof debts === 'object' && !Array.isArray(debts)) {
      for (const [currency, debtsByUser] of Object.entries(debts)) {
        console.log('Checking currency:', currency, 'debts:', debtsByUser);
        
        // Check if there's a debt from the payer to the payee
        const debtKey = `${fromId}#${toId}`;
        const amount = debtsByUser[debtKey];
        
        if (amount) {
          console.log('Found debt:', { currency, amount });
          return { amount, currency: currency as Currency };
        }
      }
    }

    console.log('No matching debt found, returning 0');
    return { amount: 0, currency: defaultCurrency };
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
                    onPress={() => {
                      console.log('Toggling payee dropdown. Current state:', {
                        showPayeeDropdown,
                        selectedPayer,
                        selectedPayee,
                        debtsCount: debts.length
                      });
                      setShowPayeeDropdown(!showPayeeDropdown);
                    }}
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}
                  >
                    <MemberList
                      members={membersList}
                      selectedId={selectedPayee}
                      onSelect={setSelectedPayee}
                      onClose={() => setShowPayeeDropdown(false)}
                      excludeId={selectedPayer}
                      theme={theme}
                      isPayee={true}
                      getDebtAmount={getDebtAmountForMember}
                      selectedPayer={selectedPayer}
                      onDebtSelect={(amount, currency) => {
                        console.log('Debt selected:', { amount, currency });
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