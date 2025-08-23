import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, TextInput, Button, Portal, Snackbar } from 'react-native-paper';
import CurrencyModal from '@/src/components/Common/CurrencyModal';
import { claimMockUser, updatePersonalBudget } from "@/src/utilities/TripUtilities";

type BudgetDialogProps = {
  currentUsername: string;
  tripId: string;
  currency: string;
  visible: boolean;
  onDismiss: () => void;
};

export default function BudgetDialog({
  currentUsername,
  tripId,
  currency: initialCurrency,
  visible: budgetDialogVisible,
  onDismiss,
}: BudgetDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  
  const [newBudgetInput, setNewBudgetInput] = useState<string>("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");


  // TODO im not sure if should depend on the new budget input because of bouncing
  const submitBudgetChange = useCallback(async (currency: string) => {
      const parsed = parseFloat(newBudgetInput);
      if (isNaN(parsed) || parsed < 0) {
        setSnackbarMessage("Please enter a valid number.");
        setSnackbarVisible(true);
        return;
      }
      try {
        await updatePersonalBudget(tripId, currentUsername, parsed, currency);
        setSnackbarMessage("Personal budget updated!");
        setSnackbarVisible(true);
      } catch (err: any) {
        console.error(err);
        setSnackbarMessage(err.message || "Failed to update budget.");
        setSnackbarVisible(true);
      } finally {
        onDismiss();
      }
    }, [newBudgetInput, tripId, currentUsername]);


  return (
    <>
      <Dialog visible={budgetDialogVisible} onDismiss={onDismiss}>
        <Dialog.Title>Edit Your Budget</Dialog.Title>
        <Dialog.Content>
          <View style={styles.inputContainer}>
            <TextInput
              label="New Budget"
              value={newBudgetInput}
              onChangeText={setNewBudgetInput}
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Affix text={selectedCurrency === 'USD' ? '$' : selectedCurrency} />}
            />
            <Button
              mode="outlined"
              onPress={() => setShowCurrencyDialog(true)}
              style={styles.currencyButton}
            >
              {selectedCurrency}
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={() => submitBudgetChange(selectedCurrency)}>Save</Button>
        </Dialog.Actions>
      </Dialog>

      <Portal>
        <CurrencyModal
          visible={showCurrencyDialog}
          onDismiss={() => setShowCurrencyDialog(false)}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
        />
      </Portal>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
  },
  currencyButton: {
    minWidth: 80,
  },
}); 