// src/components/ProposeActivityModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView } from 'react-native';
import {
    Button,
    Card,
    TextInput,
    HelperText,
    Caption,
    Portal,
} from 'react-native-paper';
import {
    ProposeActivityModalProps,
    NewProposedActivityData,
    Currency,
} from '../types/DataTypes';
import CurrencyModal from '@/app/trip/components/CurrencyModal';

const CURRENCIES: Currency[] = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY', 'JPY', 'INR',
    'BRL', 'MXN', 'RUB', 'ZAR', 'HKD', 'SGD', 'NOK', 'SEK', 'NZD'
] as Currency[];

const ProposeActivityModal = ({
    visible,
    onClose,
    onSubmit,
    currentUserId,
    currentUserName,
    initialData,
}: ProposeActivityModalProps) => {
    const [activityName, setActivityName] = useState('');
    const [description, setDescription] = useState('');
    const [estCostStr, setEstCostStr] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(initialData?.currency || 'USD');
    const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Reset form when modal visibility changes
    useEffect(() => {
        if (!visible) {
            setActivityName('');
            setDescription('');
            setEstCostStr('');
            setSelectedCurrency(initialData?.currency || 'USD');
            setErrors({});
            setIsSubmitting(false);
        }
    }, [visible, initialData]);

    // Form Validation
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (!activityName.trim()) {
            newErrors.name = 'Activity name is required.';
            isValid = false;
        }

        const cost = parseFloat(estCostStr);
        if (estCostStr && (isNaN(cost) || cost < 0)) {
            newErrors.cost = 'Enter a valid positive estimated cost or leave blank.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleInternalSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const cost = parseFloat(estCostStr);
        const newActivityData: NewProposedActivityData = {
            name: activityName.trim(),
            description: description.trim() || null,
            estCost: !isNaN(cost) && cost > 0 ? cost : null,
            currency: selectedCurrency,
            suggestedByID: currentUserId,
        };

        try {
            await onSubmit(newActivityData);
            onClose();
        } catch (error) {
            console.error('Submission failed (handled by parent)', error);
            setErrors({ submit: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCostChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9.]/g, '');
        setEstCostStr(cleanedText);
    };

    return (
        <Portal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={visible}
                onRequestClose={onClose}
                style={styles.modalRoot}
            >
                <View style={styles.modalBackground}>
                    <Card style={styles.modalCard}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Card.Title title="💡 Propose New Activity" />
                            <Card.Content>
                                <TextInput
                                    label="Activity Name *"
                                    value={activityName}
                                    onChangeText={setActivityName}
                                    style={styles.input}
                                    error={!!errors.name}
                                    maxLength={100}
                                />
                                {errors.name && <HelperText type="error">{errors.name}</HelperText>}

                                <TextInput
                                    label="Description (Optional)"
                                    value={description}
                                    onChangeText={setDescription}
                                    style={styles.inputMulti}
                                    multiline={true}
                                    numberOfLines={3}
                                    maxLength={500}
                                />

                                <View style={styles.rowInputContainer}>
                                    <TextInput
                                        label="Est. Cost (Optional)"
                                        value={estCostStr}
                                        onChangeText={handleCostChange}
                                        style={[styles.input, styles.costInput]}
                                        keyboardType="numeric"
                                        error={!!errors.cost}
                                    />
                                    <Button
                                        mode="outlined"
                                        onPress={() => setShowCurrencyDialog(true)}
                                        style={styles.currencyButton}
                                    >
                                        {selectedCurrency}
                                    </Button>
                                </View>
                                {errors.cost && <HelperText type="error">{errors.cost}</HelperText>}

                                {errors.submit && (
                                    <HelperText type="error" style={styles.submitError}>
                                        {errors.submit}
                                    </HelperText>
                                )}
                            </Card.Content>
                        </ScrollView>
                        <Card.Actions style={styles.modalActions}>
                            <Button onPress={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleInternalSubmit}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                icon="check"
                            >
                                {initialData ? 'Save Changes' : 'Propose Activity'}
                            </Button>
                        </Card.Actions>
                    </Card>
                    <CurrencyModal
                visible={showCurrencyDialog}
                onDismiss={() => setShowCurrencyDialog(false)}
                selectedCurrency={selectedCurrency}
                onSelectCurrency={setSelectedCurrency}
            />
                </View>
            </Modal>

           
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalRoot: {
        zIndex: 1,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalCard: {
        maxHeight: '80%',
    },
    input: {
        marginBottom: 10,
    },
    inputMulti: {
        marginBottom: 10,
        height: 100,
    },
    rowInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    costInput: {
        flex: 2,
    },
    currencyButton: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
    },
    modalActions: {
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    submitError: {
        marginTop: 10,
    },
});

export default ProposeActivityModal;