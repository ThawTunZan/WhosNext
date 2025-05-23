import React from 'react';
import { Dialog, TextInput, Button } from 'react-native-paper';

type BudgetDialogProps = {
  visible: boolean;
  onDismiss: () => void;
  value: string;
  onChangeValue: (value: string) => void;
  onSubmit: () => void;
};

export default function BudgetDialog({
  visible,
  onDismiss,
  value,
  onChangeValue,
  onSubmit,
}: BudgetDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Edit Your Budget</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="New Budget"
          value={value}
          onChangeText={onChangeValue}
          keyboardType="numeric"
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={onSubmit}>Save</Button>
      </Dialog.Actions>
    </Dialog>
  );
} 