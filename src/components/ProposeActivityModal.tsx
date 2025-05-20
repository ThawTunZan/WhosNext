// src/components/ProposeActivityModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView } from 'react-native';
import {
    Button,
    Card,
    TextInput,
    HelperText,
    Caption,
} from 'react-native-paper';
import {
    ProposeActivityModalProps,
    NewProposedActivityData,
} from '../types/DataTypes'; // Adjust path

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
    const [estCostStr, setEstCostStr] = useState(''); // Store as string for input
    const [currencyStr, setCurrencyStr] = useState('$'); // Default or fetch later
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Reset form when modal visibility changes
    useEffect(() => {
        if (!visible) {
            // Reset all fields on close
            setActivityName('');
            setDescription('');
            setEstCostStr('');
            setCurrencyStr('$'); //
            setErrors({});
            setIsSubmitting(false);
        } else {
            setCurrencyStr('$'); // Example default
        }
    }, [visible]);

    // --- Form Validation ---
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (!activityName.trim()) {
            newErrors.name = 'Activity name is required.';
            isValid = false;
        }

        const cost = parseFloat(estCostStr);
        if (estCostStr && (isNaN(cost) || cost < 0)) {
            // Only validate if cost is entered
            newErrors.cost = 'Enter a valid positive estimated cost or leave blank.';
            isValid = false;
        }

        // Add more validation if needed (e.g., currency format)

        setErrors(newErrors);
        return isValid;
    };

    // --- Submit Handler ---
    const handleInternalSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({}); // Clear previous errors

        // Prepare data object - ensure cost is a number or undefined
        const cost = parseFloat(estCostStr);
        const newActivityData: NewProposedActivityData = {
            name: activityName.trim(),
            description: description.trim() || null,
            estCost: !isNaN(cost) && cost > 0 ? cost : null,
            currency: currencyStr.trim() || null,
            suggestedByID: currentUserId,
            suggestedByName: currentUserName,
        };

        try {
            await onSubmit(newActivityData); // Call the parent's submit handler
             onClose();
        } catch (error) {
            console.error('Submission failed (handled by parent)', error);
             setErrors({ submit: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            // Only set submitting false if an error occurred *here*,
            // otherwise parent controls flow after onSubmit call. Let's always set it false.
             setIsSubmitting(false);
        }
    };

    // --- Input Handlers ---
    const handleCostChange = (text: string) => {
        // Allow only numbers and one decimal point
        const cleanedText = text.replace(/[^0-9.]/g, '');
        setEstCostStr(cleanedText);
    };

    const handleCurrencyChange = (text: string) => {
        // Basic trimming, maybe add validation later
        setCurrencyStr(text.trim().toUpperCase());
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
                    <ScrollView keyboardShouldPersistTaps="handled">
                        <Card.Title title="💡 Propose New Activity" />
                        <Card.Content>
                            {/* Activity Name */}
                            <TextInput
                                label="Activity Name *"
                                value={activityName}
                                onChangeText={setActivityName}
                                style={styles.input}
                                error={!!errors.name}
                                maxLength={100} // Example max length
                            />
                            {errors.name && <HelperText type="error">{errors.name}</HelperText>}

                            {/* Description */}
                            <TextInput
                                label="Description (Optional)"
                                value={description}
                                onChangeText={setDescription}
                                style={styles.inputMulti}
                                multiline={true}
                                numberOfLines={3}
                                maxLength={500} // Example max length
                            />

                            {/* Estimated Cost & Currency */}
                             <View style={styles.rowInputContainer}>
                                <TextInput
                                    label="Est. Cost (Optional)"
                                    value={estCostStr}
                                    onChangeText={handleCostChange}
                                    style={[styles.input, styles.costInput]}
                                    keyboardType="numeric"
                                    error={!!errors.cost}
                                />
                                <TextInput
                                    label="Currency"
                                    value={currencyStr}
                                    onChangeText={handleCurrencyChange}
                                    style={[styles.input, styles.currencyInput]}
                                    maxLength={3} // e.g., USD, EUR
                                    autoCapitalize="characters"
                                 />
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
            </View>
        </Modal>
    );
};

// Styles (borrowing from AddExpenseModal and adapting)
const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalCard: {
        width: '90%',
        maxHeight: '85%',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    inputMulti: {
        marginBottom: 12,
        backgroundColor: 'transparent',
        height: 80, // Adjust height for multiline
        textAlignVertical: 'top', // Align text to top
    },
    rowInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align labels top
        justifyContent: 'space-between',
    },
     costInput: {
         flex: 2, // Take more space
         marginRight: 10,
     },
     currencyInput: {
         flex: 1, // Take less space
     },
    modalActions: {
        justifyContent: 'flex-end',
        paddingTop: 15,
        paddingBottom: 5,
        paddingRight: 10,
    },
    submitError: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 14,
    },
});

export default ProposeActivityModal;