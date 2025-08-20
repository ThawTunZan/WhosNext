// src/components/AddExpenseModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, Text, TextInput, HelperText, Caption, useTheme, Surface, Divider, Portal } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { AddExpenseModalProps, Expense, SharedWith, FREE_USER_LIMITS } from '@/src/types/DataTypes';
import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CurrencyModal from '@/src/components/Common/CurrencyModal';
import { SUPPORTED_CURRENCIES } from '@/src/utilities/CurrencyUtilities';
import IconRadioSelector from './IconRadioSelector';
import AvatarRadioSelector from './AvatarRadioSelector';
import DateButton from '@/src/components/Common/DateButton';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useUserTripsContext } from '@/src/context/UserTripsContext';

const MAX_SHARE_LIMIT = 10000000; // 10 million

const AddExpenseModal = ({
  visible, onDismiss, onSubmit, tripId, initialData, editingExpenseId, suggestedPayerName, onWatchAd
}: AddExpenseModalProps & { onWatchAd: () => void }) => {
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmt, setexpenseAmt] = useState<string>('0');
  const [expenseType, setExpenseType] = useState<'group' | 'personal'>('group');
  const [paidByName, setpaidByName] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [splitType, setSplitType] = useState<'even' | 'custom'>('even');
  const [sharedWithNames, setSharedWithNames] = useState<string[]>([]);
  const [customSplitAmount, setcustomSplitAmount] = useState<{ [id: string]: string }>({});
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [paidByCurrency, setPaidByCurrency] = useState<string>('USD');
  const [currencyModalFor, setCurrencyModalFor] = useState<string | null>(null);
  const [customSplitCurrencies, setCustomSplitCurrencies] = useState<{ [username: string]: string }>({});

  const { isDarkMode } = useCustomTheme();
  const paperTheme = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { trips, tripMembersMap } = useUserTripsContext();
  const trip = trips.find(t => t.tripId === tripId);

  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  const currentUsername = user.username;

  // Members can be an array OR an object. Normalize to entries: [id/username, member]
  const actualMembers = (tripMembersMap?.[tripId] ?? []);
  const memberEntries = useMemo(() => {
    if (Array.isArray(actualMembers)) {
      return actualMembers
        .filter(Boolean)
        .map((m: any) => [m?.username ?? m?.id, m] as const);
    }
    return Object.entries(actualMembers);
  }, [actualMembers]);

  // For default selections, we need a list of usernames/ids
  const allMemberNames = useMemo(() => {
    return Array.isArray(actualMembers)
      ? actualMembers.map((m: any) => m?.username ?? m?.id).filter(Boolean)
      : Object.keys(actualMembers || {});
  }, [actualMembers]);

  // Reset form when modal is opened/closed or members change
  useEffect(() => {
    const isEditingMode = !!editingExpenseId;
    setErrors({});
    setIsSubmitting(false);

    if (visible) {
      setExpenseName(initialData?.activityName || '');
      setSelectedCurrency(initialData?.currency || trip?.currency || 'USD');
      setPaidByCurrency(initialData?.currency || trip?.currency || 'USD');

      // Date handling
      let editDate: Date | null = null;
      if (initialData?.createdAt) {
        const anyVal: any = initialData.createdAt as any;
        if (typeof anyVal?.toDate === 'function') {
          editDate = anyVal.toDate();
        } else if (initialData.createdAt instanceof Date) {
          editDate = initialData.createdAt;
        } else if (typeof initialData.createdAt === 'string' || typeof initialData.createdAt === 'number') {
          editDate = new Date(initialData.createdAt);
        }
      }
      setExpenseDate(editDate && !isNaN(editDate.getTime()) ? editDate : new Date());

      if (isEditingMode && initialData) {
        if (!initialData.sharedWith || initialData.sharedWith.length < 1) {
          setExpenseType('personal');
          setexpenseAmt(initialData.amount.toString());
        } else if (initialData.paidBy && initialData.amount > 0) {
          setExpenseType('group');
          setpaidByName(initialData.paidBy);
          setPaidAmount(initialData.amount.toString());

          const initialSharedNames = initialData.sharedWith.map(sw => sw.payeeName);
          setSharedWithNames(initialSharedNames);

          const firstAmount = initialData.sharedWith[0].amount;
          let allAmountsEqual = true;
          let customSplitAmountToSet: { [id: string]: string } = {};
          for (const sw of initialData.sharedWith) {
            if (Math.abs(sw.amount - firstAmount) > 0.01) {
              allAmountsEqual = false;
            }
            customSplitAmountToSet[sw.payeeName] = sw.amount.toString();
          }
          setSplitType(allAmountsEqual ? 'even' : 'custom');
          setcustomSplitAmount(customSplitAmountToSet);
        } else {
          setExpenseType('group');
          setpaidByName('');
          setSharedWithNames([]);
          setSplitType('even');
          setcustomSplitAmount({});
        }
      } else {
        // Defaults for ADD mode
        setSharedWithNames(allMemberNames);

        // Default payer: suggestion -> current user -> first member
        let defaultPayerName = suggestedPayerName;
        if (!defaultPayerName) defaultPayerName = currentUsername;
        if (!defaultPayerName && allMemberNames.length) defaultPayerName = allMemberNames[0];

        setpaidByName(defaultPayerName || '');
        setPaidAmount('0');
        setSplitType('even');
        setcustomSplitAmount({});
      }
    } else {
      // Reset all fields on close
      setExpenseName('');
      setexpenseAmt('0');
      setpaidByName('');
      setPaidAmount('0');
      setSharedWithNames([]);
      setSplitType('even');
      setcustomSplitAmount({});
      setSelectedCurrency('USD');
      setPaidByCurrency('USD');
      setErrors({});
      setIsSubmitting(false);
      setExpenseDate(new Date());
    }
  }, [visible, actualMembers, initialData, editingExpenseId, suggestedPayerName, currentUsername, trip?.currency, allMemberNames]);

  // Initialize per-share currencies (kept for future use; not used while button is disabled)
  useEffect(() => {
    if (visible && sharedWithNames.length > 0) {
      setCustomSplitCurrencies(prev => {
        const updated = { ...prev };
        let changed = false;
        sharedWithNames.forEach(id => {
          if (!updated[id]) {
            updated[id] = trip?.currency || 'USD';
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [visible, sharedWithNames, trip?.currency]);

  // Keep even split currency aligned with payer currency
  useEffect(() => {
    if (splitType === 'even' && paidByCurrency) {
      setSelectedCurrency(paidByCurrency);
    }
  }, [splitType, paidByCurrency]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!expenseName.trim()) {
      newErrors.name = "Expense name is required.";
      isValid = false;
    }

    if (expenseType === 'personal') {
      const amount = parseFloat(expenseAmt);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Enter a valid positive amount.";
        isValid = false;
      }
      if (amount > MAX_SHARE_LIMIT) {
        newErrors.amount = `Each share cannot exceed 10,000,000 (${selectedCurrency}).`;
        isValid = false;
      }
    }

    if (expenseType === 'group') {
      if (!paidByName) {
        newErrors.paidBy = "Select a person to pay.";
        isValid = false;
      }
      const paidAmountValue = parseFloat(paidAmount);
      if (isNaN(paidAmountValue) || paidAmountValue <= 0) {
        newErrors.paidAmount = "Enter a valid paid amount.";
        isValid = false;
      }

      if (splitType === 'custom') {
        let totalCustomAmount = 0;
        let hasInvalidCustom = false;

        sharedWithNames.forEach(id => {
          const customAmt = parseFloat(customSplitAmount[id] || '0');
          if (isNaN(customAmt) || customAmt < 0) {
            newErrors[`custom_${id}`] = "Invalid amount";
            hasInvalidCustom = true;
          }
          if (customAmt > MAX_SHARE_LIMIT) {
            newErrors[`custom_${id}`] = `Share cannot exceed 10,000,000.`;
            isValid = false;
          }
          totalCustomAmount += customAmt;
        });

        if (hasInvalidCustom) {
          newErrors.customTotal = "One or more custom amounts are invalid.";
          isValid = false;
        }
        if (Math.abs(totalCustomAmount - paidAmountValue) > 0.01) {
          newErrors.customTotal = `Total custom amounts (${totalCustomAmount.toFixed(2)}) must equal paid amount (${paidAmountValue.toFixed(2)}).`;
          isValid = false;
        }
      }
    }

    if (expenseType === 'group' && sharedWithNames.length === 0) {
      newErrors.sharedWith = "Select at least one person to share with.";
      isValid = false;
    }

    if (!expenseDate || !(expenseDate instanceof Date) || isNaN(expenseDate.getTime())) {
      newErrors.date = 'Please select a valid date.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInternalSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    let parsedSharedWith: SharedWith[] = [];

    try {
      const numOfPpl = sharedWithNames.length;
      let totalPaid = 0;

      if (expenseType === 'personal') {
        totalPaid = parseFloat(expenseAmt);
        parsedSharedWith = [];
      } else if (expenseType === 'group') {
        totalPaid = parseFloat(paidAmount);

        if (splitType === 'custom') {
          parsedSharedWith = sharedWithNames.map(username => ({
            payeeName: username,
            amount: parseFloat(customSplitAmount[username] || '0'),
            // TEMP: force each share to trip currency (fallback to selected/global)
            currency: trip?.currency || selectedCurrency,
          }));
        } else if (splitType === 'even') {
          const perPerson = numOfPpl > 0 ? totalPaid / numOfPpl : 0;
          parsedSharedWith = sharedWithNames.map(username => ({
            payeeName: username,
            amount: perPerson,
            // TEMP: force each share to trip currency (fallback to selected/global)
            currency: trip?.currency || selectedCurrency,
          }));
        }
      }

      const expenseData: Expense = {
        id: uuidv4(),
        activityName: expenseName.trim(),
        paidBy: paidByName,
        amount: expenseType === 'personal' ? parseFloat(expenseAmt) : parseFloat(paidAmount),
        sharedWith: parsedSharedWith,
        currency: selectedCurrency,
        createdAt: Timestamp.fromDate(expenseDate),
      };

      await onSubmit(expenseData, editingExpenseId);
      onDismiss();
    } catch (error) {
      console.error("Error creating expense:", error);
      setErrors({ submit: `Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSharedMember = (id: string) => {
    setSharedWithNames(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      if (splitType === 'custom' && !newSelection.includes(id)) {
        setcustomSplitAmount(current => {
          const updated = { ...current };
          delete updated[id];
          return updated;
        });
      }
      return newSelection;
    });
  };

  const handleCustomAmountChange = (id: string, text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setcustomSplitAmount(prev => ({ ...prev, [id]: cleanedText }));
  };


  const today = new Date().toISOString().slice(0, 10);
  const isPremium = trip?.isTripPremium || (trip as any)?.premiumStatus === 'premium';
  const amtLeft = isPremium
    ? undefined
    : (trip as any)?.dailyExpenseLimit?.[today] ?? FREE_USER_LIMITS.maxExpensesPerDayPerTrip;

  return (
    <>
      <Portal>
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onDismiss}>
          <View style={styles.modalBackground}>
            <Card style={styles.modalCard}>
              <ScrollView>
                <Card.Title title={editingExpenseId ? "Edit Expense" : "Add New Expense"} />
                <Card.Content>
                  <TextInput
                    label="Expense Name"
                    value={expenseName}
                    onChangeText={setExpenseName}
                    style={styles.input}
                    error={!!errors.name}
                  />
                  {errors.name && <HelperText type="error">{errors.name}</HelperText>}

                  {/* Date Picker Section */}
                  <DateButton
                    value={expenseDate}
                    onChange={setExpenseDate}
                    label="Date"
                    style={{ marginBottom: 16 }}
                  />
                  {errors.date && <HelperText type="error">{errors.date}</HelperText>}

                  {errors.submit && (
                    <HelperText type="error" style={styles.submitError}>
                      {errors.submit}
                    </HelperText>
                  )}

                  {/* Expense Type Section */}
                  <Surface style={[styles.section, { backgroundColor: theme.colors.background, marginVertical: 8 }]}>
                    <Text
                      variant="titleMedium"
                      style={[styles.sectionTitle, { color: theme.colors.text, textAlign: 'left', marginBottom: 16 }]}
                    >
                      Expense Type
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Button
                        mode={expenseType === 'personal' ? 'contained' : 'outlined'}
                        onPress={() => setExpenseType('personal')}
                        style={{ marginRight: 8, width: 150 }}
                      >
                        Personal
                      </Button>
                      <Button
                        mode={expenseType === 'group' ? 'contained' : 'outlined'}
                        onPress={() => setExpenseType('group')}
                        style={{ width: 150 }}
                      >
                        Group
                      </Button>
                    </View>
                  </Surface>

                  {/* Personal Expense Amount */}
                  {expenseType === 'personal' && (
                    <View style={styles.rowInputContainer}>
                      <TextInput
                        label="Amount"
                        value={expenseAmt}
                        onChangeText={setexpenseAmt}
                        keyboardType="numeric"
                        style={[styles.input, styles.amountInput]}
                        error={!!errors.amount}
                      />
                      <Button
                        mode="outlined"
                        onPress={() => setShowCurrencyDialog(true)}
                        style={styles.currencyButton}
                      >
                        {selectedCurrency}
                      </Button>
                    </View>
                  )}
                  {errors.amount && <HelperText type="error">{errors.amount}</HelperText>}

                  {expenseType === 'group' && (
                    <>
                      {/* Paid By Section */}
                      <AvatarRadioSelector
                        title="Paid by"
                        value={paidByName}
                        onValueChange={(value) => {
                          setpaidByName(Array.isArray(value) ? value[0] : value);
                        }}
                        options={memberEntries.map(([id, member]) => ({
                          value: id,
                          label: (member as any)?.fullName || (member as any)?.fullname || (member as any)?.username || id,
                        }))}
                        containerStyle={{ backgroundColor: theme.colors.background }}
                        multiple={false}
                      />

                      {suggestedPayerName && (
                        <Caption style={[styles.suggestionText, { color: theme.colors.primary }]}>
                          💡 Suggestion: {suggestedPayerName} is next to pay
                        </Caption>
                      )}
                      {errors.paidBy && <HelperText type="error">{errors.paidBy}</HelperText>}

                      {/* Paid Amount Section */}
                      <Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                          Paid Amount
                        </Text>
                        <View style={styles.customAmountRow}>
                          <Text style={[styles.customAmountLabel, { color: theme.colors.text }]}>
                            {paidByName || 'Payer'}
                          </Text>
                          <Button
                            mode="outlined"
                            onPress={() => setCurrencyModalFor('payer')}
                            style={styles.currencyButton}
                          >
                            {paidByCurrency}
                          </Button>
                          <TextInput
                            mode="outlined"
                            dense
                            style={[styles.customAmountInput, { backgroundColor: theme.colors.surface }]}
                            value={paidAmount}
                            placeholder="0.00"
                            keyboardType="numeric"
                            onChangeText={setPaidAmount}
                            error={!!errors.paidAmount}
                          />
                        </View>
                        {errors.paidAmount && <HelperText type="error">{errors.paidAmount}</HelperText>}
                      </Surface>

                      {/* Split Type Section */}
                      <IconRadioSelector
                        title="Split Type"
                        value={splitType}
                        onValueChange={v => setSplitType(v as 'even' | 'custom')}
                        options={[
                          { value: 'even', label: 'Split Evenly', icon: 'equal-box' },
                          { value: 'custom', label: 'Custom Split', icon: 'calculator-variant' },
                        ]}
                        containerStyle={{ backgroundColor: theme.colors.background }}
                      />

                      {/* Shared With Section */}
                      <Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                          Shared With
                        </Text>
                        {memberEntries.map(([id, member]) => (
                          <TouchableOpacity
                            key={id}
                            onPress={() => toggleSharedMember(id)}
                            style={[
                              styles.sharedOption,
                              sharedWithNames.includes(id) && styles.sharedOptionSelected,
                              {
                                backgroundColor: sharedWithNames.includes(id)
                                  ? paperTheme.colors.primaryContainer
                                  : theme.colors.surface,
                                borderColor: theme.colors.border,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={sharedWithNames.includes(id) ? "checkbox-marked" : "checkbox-blank-outline"}
                              size={24}
                              color={sharedWithNames.includes(id) ? paperTheme.colors.primary : theme.colors.text}
                            />
                            <Text
                              style={[
                                styles.sharedOptionText,
                                {
                                  color: sharedWithNames.includes(id)
                                    ? paperTheme.colors.onPrimaryContainer
                                    : theme.colors.text,
                                },
                              ]}
                            >
                              {(member as any)?.fullName || (member as any)?.fullname || (member as any)?.username || id}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        {errors.sharedWith && <HelperText type="error">{errors.sharedWith}</HelperText>}
                      </Surface>

                      {/* Custom Amounts Section */}
                      {splitType === 'custom' && sharedWithNames.length > 0 && (
                        <Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
                          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Custom Amounts
                          </Text>
                          <View style={styles.customSplitAmountContainer}>
                            {sharedWithNames.map(id => {
                              const member = Array.isArray(actualMembers)
                                ? actualMembers.find((m: any) => (m?.username ?? m?.id) === id)
                                : (actualMembers as any)[id];

                              return (
                                <View key={id} style={styles.customAmountRow}>
                                  <Text style={[styles.customAmountLabel, { color: theme.colors.text }]}>
                                    {member?.displayName || member?.fullName || member?.username || id}
                                  </Text>

                                  {/* TEMP: Disable per-sharee currency selection; default to trip currency */}
                                  {/*
                                  <Button
                                    mode="outlined"
                                    onPress={() => setCurrencyModalFor('custom_' + id)}
                                    style={styles.currencyButton}
                                  >
                                    {customSplitCurrencies[id] || selectedCurrency}
                                  </Button>
                                  */}

                                  <TextInput
                                    mode="outlined"
                                    dense
                                    style={[styles.customAmountInput, { backgroundColor: theme.colors.surface }]}
                                    value={customSplitAmount[id] || '0'}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    onChangeText={(text) => handleCustomAmountChange(id, text)}
                                    error={!!errors[`custom_${id}`]}
                                  />
                                </View>
                              );
                            })}
                          </View>
                          {errors.customTotal && (
                            <HelperText type="error" style={styles.customTotalError}>
                              {errors.customTotal}
                            </HelperText>
                          )}
                        </Surface>
                      )}
                    </>
                  )}
                </Card.Content>
              </ScrollView>

              <Divider style={{ backgroundColor: theme.colors.border }} />

              <Card.Actions style={styles.modalActions}>
                <Button onPress={onDismiss} disabled={isSubmitting} textColor={theme.colors.text}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleInternalSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || (trip && (trip as any).dailyExpenseLimit && (trip as any).dailyExpenseLimit <= 0)}
                  icon="check"
                >
                  {editingExpenseId ? "Save Changes" : "Add Expense"}
                </Button>
              </Card.Actions>

              {/* Free-user limit CTA */}
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const isPremium = trip?.isTripPremium || (trip as any)?.premiumStatus === 'premium';
                const amtLeft = isPremium
                  ? undefined
                  : (trip as any)?.dailyExpenseLimit?.[today] ?? FREE_USER_LIMITS.maxExpensesPerDayPerTrip;
                return !isPremium && amtLeft !== undefined && amtLeft <= 0 ? (
                  <>
                    <Text style={{ color: theme.colors.error, textAlign: 'center', marginTop: 8 }}>
                      Daily expense limit reached. Watch an ad to increase your limit!
                    </Text>
                    <Button mode="contained" icon="video" onPress={onWatchAd} style={{ margin: 12 }}>
                      Watch Ad to Increase Daily Limit
                    </Button>
                  </>
                ) : null;
              })()}
            </Card>

            {/* Currency Selection Modals */}
            <CurrencyModal
              visible={showCurrencyDialog}
              onDismiss={() => setShowCurrencyDialog(false)}
              selectedCurrency={selectedCurrency}
              onSelectCurrency={setSelectedCurrency}
            />

            {/* Payer currency selection (kept) */}
            <Modal
              visible={!!currencyModalFor}
              transparent
              animationType="fade"
              onRequestClose={() => setCurrencyModalFor(null)}
            >
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)'
              }}>
                <Card style={{ width: 300 }}>
                  <Card.Title title="Select Currency" />
                  <Card.Content>
                    {SUPPORTED_CURRENCIES.map(cur => (
                      <Button
                        key={cur}
                        onPress={() => {
                          if (currencyModalFor === 'payer') {
                            setPaidByCurrency(cur);
                          } else if (currencyModalFor && currencyModalFor.startsWith('custom_')) {
                            const id = currencyModalFor.replace('custom_', '');
                            setCustomSplitCurrencies(v => ({ ...v, [id]: cur }));
                          }
                          setCurrencyModalFor(null);
                        }}
                        style={{ marginVertical: 4 }}
                      >
                        {cur}
                      </Button>
                    ))}
                  </Card.Content>
                  <Card.Actions>
                    <Button onPress={() => setCurrencyModalFor(null)}>Cancel</Button>
                  </Card.Actions>
                </Card>
              </View>
            </Modal>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalCard: {
    height: 700,
    maxHeight: '100%',
  },
  input: {
    marginBottom: 10,
  },
  rowInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  amountInput: {
    flex: 2,
  },
  currencyButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    marginRight: 30,
  },
  splitTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  splitOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  selectedSplitOption: {
    elevation: 3,
  },
  splitOptionText: {
    marginTop: 8,
    textAlign: 'center',
  },
  customSplitAmountContainer: {
    gap: 12,
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customAmountLabel: {
    flex: 1,
    fontSize: 16,
    marginRight: 16,
  },
  customAmountInput: {
    width: 120,
  },
  customTotalError: {
    marginTop: 8,
  },
  submitError: {
    marginTop: 16,
    textAlign: 'center',
  },
  modalActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  suggestionText: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sharedWithContainer: {
    gap: 8,
  },
  sharedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sharedOptionSelected: {
    elevation: 2,
  },
  sharedOptionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  infoText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AddExpenseModal;
