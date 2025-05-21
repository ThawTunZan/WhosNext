// src/components/AddExpenseModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, Text, TextInput, RadioButton, HelperText, Caption } from 'react-native-paper';
import { AddExpenseModalProps, Expense, SharedWith } from '../types/DataTypes';
import { useMemberProfiles } from "@/src/context/MemberProfilesContext";
import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { db } from "@/firebase";
import { collection, doc } from "firebase/firestore";

const AddExpenseModal = ({ visible, onClose, onSubmit, members, tripId, initialData, editingExpenseId, suggestedPayerId }: AddExpenseModalProps) => {
  const [expenseName, setExpenseName] = useState('');
  const [paidAmtStr, setPaidAmtStr] = useState('');
  const [paidById, setPaidByID] = useState<string>('');
  const [sharedWithIds, setSharedWithIds] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'even' | 'custom'>('even');
  const [customAmounts, setCustomAmounts] = useState<{ [id: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const memberEntries = React.useMemo(() => Object.entries(members), [members]);

  const { isLoaded, isSignedIn, user } = useUser()
  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />
  const currentUserId = user.id
  const profiles = useMemberProfiles();
  
  // Reset form when modal is opened/closed or members change
  useEffect(() => {
    const isEditingMode = !!editingExpenseId;
    console.log("Modal opening. Editing:", isEditingMode, "ID:", editingExpenseId, "Initial Data:", initialData);
    setErrors({});
    setIsSubmitting(false);
    if (visible) {
      // Optionally pre-select all members to share with initially
      const allMemberIds = Object.keys(members);
      
      setExpenseName(initialData?.activityName || ''); // Use activityName if present
      setPaidAmtStr(initialData?.paidAmt?.toString() || ''); // Use paidAmt if present
      if (isEditingMode && initialData) {
        // --- Pre-fill specific to EDIT mode ---
        setPaidByID(initialData.paidById);
      
        if (initialData.sharedWith && initialData.sharedWith.length > 0) {
            const initialSharedIds = initialData.sharedWith.map(sw => sw.payeeID);
            setSharedWithIds(initialSharedIds);
            // Attempt to determine split type based on sharedWith data
            const firstAmount = initialData.sharedWith[0].amount;
            let allAmountsEqual = true;
            let customAmountsToSet: { [id: string]: string } = {};
            for (const sw of initialData.sharedWith) {
                if (Math.abs(sw.amount - firstAmount) > 0.01) {
                    allAmountsEqual = false;
                }
                customAmountsToSet[sw.payeeID] = sw.amount.toString();
            }
            const totalSharedAmount = initialData.sharedWith.reduce((sum, sw) => sum + sw.amount, 0);
            const paidAmount = parseFloat(initialData.paidAmt?.toString() || '0');
            
            // If all amounts are equal AND their sum (times count) matches paidAmt, assume even. Otherwise, custom.
            if (allAmountsEqual && Math.abs(totalSharedAmount - paidAmount) < 0.01 * initialData.sharedWith.length) {
                setSplitType('even');
                setCustomAmounts({}); // Clear custom amounts for even split
            } else {
                setSplitType('custom');
                setCustomAmounts(customAmountsToSet);
            }
        } else {
            // Default sharing if no sharedWith in initialData (should not happen for edit)
            const allMemberIds = Object.keys(members);
            setSharedWithIds(allMemberIds);
            setSplitType('even');
            setCustomAmounts({});
        }
      } else {
          // --- Defaults for ADD mode (or if initialData is minimal) ---
          const allMemberIds = Object.keys(members);
          setSharedWithIds(allMemberIds);
          // If suggestedPayerName is available, try to find their ID and set it
          let defaultPayerId = suggestedPayerId;
          if (!defaultPayerId) defaultPayerId = currentUserId;
          if (!defaultPayerId && allMemberIds.length) defaultPayerId = allMemberIds[0];
          setPaidByID(defaultPayerId);

          setSplitType('even');
          setCustomAmounts({});
      }
  } else {
      // Reset all fields on close (already handled well)
      setExpenseName('');
      setPaidAmtStr('');
      setPaidByID('');
      setSharedWithIds([]);
      setSplitType('even');
      setCustomAmounts({});
      setErrors({});
      setIsSubmitting(false);
  }
  }, [visible, members, initialData, editingExpenseId, suggestedPayerId, currentUserId]); // Reset on visibility change or if members list changes


  const validateForm = (): boolean => {
      const newErrors: { [key: string]: string } = {};
      let isValid = true;

      if (!expenseName.trim()) {
          newErrors.name = "Expense name is required.";
          isValid = false;
      }
      if (!paidById) {
          newErrors.paidBy = "Select who paid.";
          isValid = false;
      }
       const amount = parseFloat(paidAmtStr);
      if (isNaN(amount) || amount <= 0) {
          newErrors.amount = "Enter a valid positive amount.";
          isValid = false;
      }
      if (sharedWithIds.length === 0) {
          newErrors.sharedWith = "Select at least one person to share with.";
          isValid = false;
      }

      if (splitType === 'custom') {
          let totalCustomAmount = 0;
          let hasInvalidCustom = false;
          sharedWithIds.forEach(id => {
              const customAmt = parseFloat(customAmounts[id] || '0');
              if (isNaN(customAmt) || customAmt < 0) {
                  newErrors[`custom_${id}`] = "Invalid amount"; // Error per input
                  hasInvalidCustom = true;
              }
              totalCustomAmount += customAmt;
          });

          if (hasInvalidCustom) {
              newErrors.customTotal = "One or more custom amounts are invalid.";
              isValid = false;
          } else if (Math.abs(totalCustomAmount - amount) > 0.01) { // Allow for floating point inaccuracies
               newErrors.customTotal = `Custom amounts must add up to ${amount.toFixed(2)}. Current total: ${totalCustomAmount.toFixed(2)}`;
               isValid = false;
          }
      }

      setErrors(newErrors);
      return isValid;
  }

  const handleInternalSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    const paidAmount = parseFloat(paidAmtStr);
    let parsedSharedWith: SharedWith[] = [];

    try {
      if (splitType === 'even') {
        const numShares = sharedWithIds.length;
        if (numShares === 0) throw new Error("Cannot split evenly among zero people."); // Should be caught by validation
        const share = parseFloat((paidAmount / numShares).toFixed(2));

        // Adjust for potential rounding errors on the last person
        let totalCalculated = 0;
        parsedSharedWith = sharedWithIds.map((id, index) => {
            let currentShare = share;
            if (index === numShares - 1) { // Last person gets the remainder
                const remainder = paidAmount - totalCalculated - share;
                currentShare = parseFloat((share + remainder).toFixed(2));
            }
             totalCalculated += share; // Use the base share for tracking total
             return {
                payeeID: id,
                payeeName: profiles[id] || 'Unknown',
                amount: currentShare,
            };
        });

      } else { // Custom split
        parsedSharedWith = sharedWithIds.map(id => ({
          payeeID: id,
          payeeName: profiles[id] || 'Unknown',
          amount: parseFloat(customAmounts[id] || '0'), // Already validated
        }));
      }
      const newExpenseRef = doc(
        collection(db, "trips", tripId, "expenses")
      );
      const newId = newExpenseRef.id;

      const expenseData: Expense = {
        id: newId,
        activityName: expenseName.trim(),
        paidById: paidById, // Get name from selected ID
        paidAmt: paidAmount,
        sharedWith: parsedSharedWith,
        // `createdAt` will be added by the service
      };

      await onSubmit(expenseData, editingExpenseId); // Call the onSubmit prop passed from parent
      onClose(); // Close modal on success

    } catch (error) {
      console.error("Error creating expense:", error);
      setErrors({ submit: `Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSharedMember = (id: string) => {
    setSharedWithIds(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
       // When removing a member from custom split, clear their amount
        if (splitType === 'custom' && !newSelection.includes(id)) {
            setCustomAmounts(current => {
                const updated = {...current};
                delete updated[id];
                return updated;
            });
        }
      return newSelection;
    });
  };

   const handleCustomAmountChange = (id: string, text: string) => {
      // Allow only numbers and one decimal point
      const cleanedText = text.replace(/[^0-9.]/g, '');
      setCustomAmounts(prev => ({ ...prev, [id]: cleanedText }));
   };


  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
          <Card style={styles.modalCard}>
           <ScrollView keyboardShouldPersistTaps="handled" >
            <Card.Title title="Add New Expense" />
            <Card.Content>
              {/* Expense Name */}
              <TextInput
                label="Expense Name"
                value={expenseName}
                onChangeText={setExpenseName}
                style={styles.input}
                error={!!errors.name}
              />
              {errors.name && <HelperText type="error">{errors.name}</HelperText>}


              {/* Paid By Selection */}
              <Text style={styles.label}>Paid by:</Text>
              {suggestedPayerId && (
                  <Caption style={styles.suggestionText}>
                      Suggestion: {profiles[suggestedPayerId]} is next to pay.
                  </Caption>
              )}
              {memberEntries.length > 0 ? (
                <RadioButton.Group onValueChange={newValue => setPaidByID(newValue)} value={paidById}>
                  {memberEntries.map(([id, member]) => (
                    <View key={id} style={styles.radioItem}>
                       <RadioButton value={id} />
                       <Text>{profiles[id]}</Text>
                    </View>
                  ))}
                </RadioButton.Group>
              ) : (
                  <Text style={styles.infoText}>No members available to select.</Text>
              )}
               {errors.paidBy && <HelperText type="error">{errors.paidBy}</HelperText>}


              {/* Amount */}
              <TextInput
                label="Total Amount Paid"
                value={paidAmtStr}
                onChangeText={setPaidAmtStr}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.amount}
              />
              {errors.amount && <HelperText type="error">{errors.amount}</HelperText>}

              {/* Shared With Selection */}
              <Text style={styles.label}>Shared With:</Text>
              {memberEntries.length > 0 ? memberEntries.map(([id, member]) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => toggleSharedMember(id)}
                  style={[styles.sharedOption, sharedWithIds.includes(id) && styles.sharedOptionSelected]}
                >
                  <Text>{profiles[id]}</Text>
                  {/* Maybe add a Checkbox icon here */}
                </TouchableOpacity>
              )) : <Text style={styles.infoText}>No members available.</Text>}
              {errors.sharedWith && <HelperText type="error">{errors.sharedWith}</HelperText>}


              {/* Split Type Selection */}
              <Text style={styles.label}>Split Type:</Text>
              <RadioButton.Group onValueChange={newValue => setSplitType(newValue as 'even' | 'custom')} value={splitType}>
                 <View style={styles.radioItem}>
                    <RadioButton value="even" />
                    <Text>Split Evenly</Text>
                 </View>
                 <View style={styles.radioItem}>
                    <RadioButton value="custom" />
                    <Text>Custom Amounts</Text>
                 </View>
              </RadioButton.Group>

               {/* Custom Amounts Input */}
              {splitType === 'custom' && sharedWithIds.length > 0 && (
                <View style={styles.customAmountsContainer}>
                  <Text style={styles.label}>Enter Custom Amounts:</Text>
                  {sharedWithIds.map(id => (
                    <View key={id} style={styles.customAmountRow}>
                      <Text style={styles.customAmountLabel}>{profiles[id]}:</Text>
                      <TextInput
                        dense // Smaller input
                        style={styles.customAmountInput}
                        value={customAmounts[id] || ''}
                        placeholder="Amount"
                        keyboardType="numeric"
                        onChangeText={(text) => handleCustomAmountChange(id, text)}
                        error={!!errors[`custom_${id}`]}

                      />
                       {errors[`custom_${id}`] && <HelperText type="error" style={styles.inlineError}>{errors[`custom_${id}`]}</HelperText>}
                    </View>
                  ))}
                  {errors.customTotal && <HelperText type="error">{errors.customTotal}</HelperText>}
                </View>
              )}

             {/* General Submit Error */}
              {errors.submit && <HelperText type="error" style={styles.submitError}>{errors.submit}</HelperText>}

            </Card.Content>
             </ScrollView>
            <Card.Actions style={styles.modalActions}>
              <Button onPress={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button
                  mode="contained"
                  onPress={handleInternalSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                Add Expense
              </Button>
            </Card.Actions>
          </Card>
      </View>
    </Modal>
  );
};

// Add Styles (similar to original, but adjust as needed)
const styles = StyleSheet.create({
  suggestionText: {
  marginBottom: 8,
  marginLeft: 5, // Indent slightly
  fontStyle: 'italic',
  color: '#555',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
  },
  modalCard: {
    width: '90%', // Wider modal
    maxHeight: '85%', // Max height
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent', // Use Paper's theme background
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  radioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
  },
  sharedOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 6,
  },
  sharedOptionSelected: {
    backgroundColor: '#e0e0e0', // Or use theme primary color lightly
    borderColor: '#a0a0a0',
  },
  customAmountsContainer: {
      marginTop: 15,
      padding: 10,
      backgroundColor: '#f5f5f5',
      borderRadius: 4,
  },
   customAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    customAmountLabel: {
        width: '40%', // Adjust as needed
        marginRight: 10,
    },
    customAmountInput: {
        flex: 1, // Take remaining space
        backgroundColor: 'white'
    },
    inlineError:{
      // Styles for errors next to custom inputs if needed
    },
  modalActions: {
    justifyContent: 'flex-end', // Align buttons to the right
    paddingTop: 15,
    paddingBottom: 5,
  },
  submitError: {
      marginTop: 10,
      textAlign: 'center',
  },
   infoText: {
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 10,
  }
});

export default AddExpenseModal;