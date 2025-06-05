import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, TextInput, Button, Portal } from 'react-native-paper';
import { Currency } from '@/src/types/DataTypes';
import CurrencyModal from './CurrencyModal';

type BudgetDialogProps = {
  visible: boolean;
  onDismiss: () => void;
  value: string;
  onChangeValue: (value: string) => void;
  onSubmit: (currency: Currency) => void;
  currency: Currency;
};

export default function BudgetDialog({
  visible,
  onDismiss,
  value,
  onChangeValue,
  onSubmit,
  currency: initialCurrency,
}: BudgetDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(initialCurrency);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);

  const handleSubmit = () => {
    onSubmit(selectedCurrency);
  };

  return (
    <>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Edit Your Budget</Dialog.Title>
        <Dialog.Content>
          <View style={styles.inputContainer}>
            <TextInput
              label="New Budget"
              value={value}
              onChangeText={onChangeValue}
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
          <Button onPress={handleSubmit}>Save</Button>
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