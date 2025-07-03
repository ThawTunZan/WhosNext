// src/components/AddExpenseModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, Text, TextInput, RadioButton, HelperText, Caption, useTheme, Surface, Divider, Portal } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { AddExpenseModalProps, Expense, SharedWith, Currency } from '@/src/types/DataTypes';
import { useMemberProfiles } from "@/src/context/MemberProfilesContext";
import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { db } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CurrencyModal from '@/app/trip/components/CurrencyModal';
import { SUPPORTED_CURRENCIES } from '@/src/utilities/CurrencyUtilities';
import IconRadioSelector from './IconRadioSelector';
import AvatarRadioSelector from './AvatarRadioSelector';

const AddExpenseModal = ({ visible, onDismiss, onSubmit, members, tripId, initialData, editingExpenseId, suggestedPayerId }: AddExpenseModalProps) => {
	const [expenseName, setExpenseName] = useState('');
	const [paidAmtStr, setPaidAmtStr] = useState('');
	const [multiplePaidAmtStr, setMultiplePaidAmtStr] = useState('');
	const [sharedWithIds, setSharedWithIds] = useState<string[]>([]);
	const [paidByIds, setPaidByIds] = useState<string[]>([]);
	const [splitType, setSplitType] = useState<'even' | 'custom'>('even');
	const [paidType, setPaidType] = useState<'single' | 'multiple'>('multiple');
	const [customAmounts, setCustomAmounts] = useState<{ [id: string]: string }>({});
	const [customPaidAmounts, setCustomPaidAmounts] = useState<{ [id: string]: string }>({});
	const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
	const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	const memberEntries = React.useMemo(() => Object.entries(members), [members]);

	const { isLoaded, isSignedIn, user } = useUser()
	if (!isLoaded) return null
	if (!isSignedIn) return <Redirect href="/auth/sign-in" />
	const currentUserId = user.id
	const profiles = useMemberProfiles();

	const allMemberIds = Object.keys(members);
	const initialPayerIds = initialData?.paidByAndAmounts[0].memberId
		// if parent passed an explicit payer-id suggestion, use it
		?? suggestedPayerId
		// otherwise use the current user
		?? currentUserId
		// if even that is missing (unlikely), pick the first member in the list
		?? allMemberIds[0]
		?? "";

	// **After**: initialize state with that computed default
	const [paidById, setPaidByID] = useState<string>(initialPayerIds);

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
			//setPaidAmtStr(initialData?.paidByAndAmounts.map(pba => pba.amount).reduce((sum, amt) => sum + parseFloat(amt), 0).toString() || ''); // Use paidAmt if present
			setSelectedCurrency(initialData?.currency || 'USD');

			if (isEditingMode && initialData) {
				// --- Pre-fill specific to EDIT mode ---
				if (initialData.paidByAndAmounts && initialData.paidByAndAmounts.length === 1) {
					setPaidByID(initialData.paidByAndAmounts[0].memberId);
					setPaidType('single');
					setPaidAmtStr(initialData.paidByAndAmounts[0].amount.toString());
				} else if (initialData.paidByAndAmounts && initialData.paidByAndAmounts.length 	> 1) {
					setPaidByIds(initialData.paidByAndAmounts.map(pba => pba.memberId));
					setPaidType('multiple');
					const tempCustomPaidAmts: { [id: string]: string } = {};
					initialData.paidByAndAmounts.forEach(pba => {
						tempCustomPaidAmts[pba.memberId] = pba.amount.toString();
					});
					setCustomPaidAmounts(tempCustomPaidAmts);
					setMultiplePaidAmtStr(
						initialData.paidByAndAmounts
							.reduce((sum, pba) => sum + parseFloat(pba.amount), 0)
							.toString()
					);
					const initialSharedIds = initialData.sharedWith.map(sw => sw.payeeID);
					setSharedWithIds(initialSharedIds);
					// Attempt to determine split type based on sharedWith data
					const firstAmount = initialData.sharedWith[0].amount;
					let allAmountsEqual = true;
					setSplitType("even");
					let customAmountsToSet: { [id: string]: string } = {};
					for (const sw of initialData.sharedWith) {
						if (Math.abs(sw.amount - firstAmount) > 0.01) {
							allAmountsEqual = false;
							setSplitType("custom")
						}
						customAmountsToSet[sw.payeeID] = sw.amount.toString();
					}
					const totalSharedAmount = initialData.sharedWith.reduce((sum, sw) => sum + sw.amount, 0);
					setCustomAmounts(customAmountsToSet);
					
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
			setSelectedCurrency('USD');
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
		if (paidType === 'single') {
			if (!paidById) {
				newErrors.paidBy = "Select who paid.";
				isValid = false;
			}
			const amount = parseFloat(paidAmtStr);
			if (isNaN(amount) || amount <= 0) {
				newErrors.amount = "Enter a valid positive amount.";
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
					newErrors.customTotal = `Custom amounts must add up to ${amount.toFixed(2)} ${selectedCurrency}. Current total: ${totalCustomAmount.toFixed(2)} ${selectedCurrency}`;
					isValid = false;
				}
			}
		}
		
		if (paidType === 'multiple') {
			if (paidByIds.length === 0) {
				newErrors.paidBy = "Select at least one person to pay.";
				isValid = false;
			}
			const totalPaidAmount = Object.values(customPaidAmounts).reduce((sum, amt) => sum + parseFloat(amt), 0);
			setMultiplePaidAmtStr(totalPaidAmount.toString());
			console.log("Total paid amount:", totalPaidAmount);
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
				}
				if (Math.abs(totalCustomAmount - totalPaidAmount) > 0.01) { // Allow for floating point inaccuracies
					newErrors.customTotal = `Custom amounts must add up to ${totalPaidAmount.toFixed(2)} ${selectedCurrency}. Current total: ${totalCustomAmount.toFixed(2)} ${selectedCurrency}`;
					isValid = false;
				}
			}
		}

		if (sharedWithIds.length === 0) {
			newErrors.sharedWith = "Select at least one person to share with.";
			isValid = false;
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

		const paidAmount = paidType === 'single' ? parseFloat(paidAmtStr) : parseFloat(multiplePaidAmtStr);
		let parsedSharedWith: SharedWith[] = [];
    let parsedPaidByAndAmounts: {memberId: string, amount: string}[] = []

		if (paidType === 'single') {
			parsedPaidByAndAmounts = [{memberId: profiles[paidById], amount: paidAmtStr}];
		} else if (paidType === 'multiple') {
			parsedPaidByAndAmounts = paidByIds.map(id => ({memberId: id, amount: customPaidAmounts[id]}));
		}

		try {
			const numOfPpl = setSharedWithIds.length
			if (splitType === 'custom') {
				parsedSharedWith = sharedWithIds.map(id => ({
					payeeID: id,
					amount: parseFloat(customAmounts[id] || '0'),
					currency: selectedCurrency
				}));
			} else if (splitType === 'even') { // Even split
				parsedSharedWith = sharedWithIds.map(id => ({
					payeeID: id,
					amount: (parseFloat(paidAmtStr)/numOfPpl || 0),
					currency: selectedCurrency,
				}));
			}
				
			const newExpenseRef = doc(
				collection(db, "trips", tripId, "expenses")
			);
			const newId = newExpenseRef.id;

			const expenseData: Expense = {
				id: newId,
				activityName: expenseName.trim(),
				paidByAndAmounts: parsedPaidByAndAmounts,
				sharedWith: parsedSharedWith,
				currency: selectedCurrency,
				// `createdAt` will be added by the service
			};

			await onSubmit(expenseData, editingExpenseId); // Call the onSubmit prop passed from parent
			onDismiss(); // Close modal on success

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
					const updated = { ...current };
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

	const handleCustomPaidAmountChange = (id: string, text: string) => {
		// Allow only numbers and one decimal point
		const cleanedText = text.replace(/[^0-9.]/g, '');
		setCustomPaidAmounts(prev => ({ ...prev, [id]: cleanedText }));
	};

	const handleSinglePaidByChange = (val: string | string[]) => {
		if (typeof val === 'string') setPaidByID(val);
	};
	const handleMultiplePaidByChange = (val: string | string[]) => {
		if (Array.isArray(val)) setPaidByIds(val);
	};

	const { isDarkMode } = useCustomTheme();
	const theme = isDarkMode ? darkTheme : lightTheme;
	const paperTheme = useTheme();

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
									{ paidType === 'single' && (
									<View style={styles.rowInputContainer}>
										<TextInput
											label="Amount"
											value={paidAmtStr}
											onChangeText={setPaidAmtStr}
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
									

									{/* Paid By Type Section */}
									<IconRadioSelector
										title="Paid By Type"
										value={paidType}
										onValueChange={v => setPaidType(v as 'single' | 'multiple')}
										options={[
											{ value: 'single', label: 'Single Payer', icon: 'equal-box' },
											{ value: 'multiple', label: 'Multiple Payers', icon: 'calculator-variant' },
										]}
										containerStyle={{ backgroundColor: theme.colors.background }}
									/>

									{/* Paid By Section */}
									{paidType === 'single' ? (
										<AvatarRadioSelector
											title="Paid by"
											value={paidById}
											onValueChange={handleSinglePaidByChange}
											options={memberEntries.map(([id, member]) => ({ value: id, label: profiles[id] }))}
											containerStyle={{ backgroundColor: theme.colors.background }}
											multiple={false}
										/>
									) : (
										<AvatarRadioSelector
											title="Paid by"
											value={paidByIds}
											onValueChange={handleMultiplePaidByChange}
											options={memberEntries.map(([id, member]) => ({ value: id, label: profiles[id] }))}
											containerStyle={{ backgroundColor: theme.colors.background }}
											multiple={true}
										/>
									)}
									{suggestedPayerId && (
										<Caption style={[styles.suggestionText, { color: theme.colors.primary }]}>💡 Suggestion: {profiles[suggestedPayerId]} is next to pay</Caption>
									)}
									{errors.paidBy && <HelperText type="error">{errors.paidBy}</HelperText>}

									{/* Custom Paid Amounts Section */}
									{paidType === 'multiple' && (
										<Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
											<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
												Paid Amounts
											</Text>
											<View style={styles.customAmountsContainer}>
												{paidByIds.map(id => (
													<View key={id} style={styles.customAmountRow}>
														<Text style={[styles.customAmountLabel, { color: theme.colors.text }]}>
															{profiles[id]}
														</Text>
														<TextInput
															mode="outlined"
															dense
															style={[styles.customAmountInput, { backgroundColor: theme.colors.surface }]}
															value={customPaidAmounts[id] || ''}
															placeholder="0.00"
															keyboardType="numeric"
															onChangeText={(text) => handleCustomPaidAmountChange(id, text)}
															error={!!errors[`custom_${id}`]}
															left={<TextInput.Affix text={selectedCurrency} />}
														/>
													</View>
												))}
											</View>
											{errors.customTotal && (
												<HelperText type="error" style={styles.customTotalError}>
													{errors.customTotal}
												</HelperText>
											)}
										</Surface>
									)}

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
										{memberEntries.length > 0 ? (
											<View style={styles.sharedWithContainer}>
												{memberEntries.map(([id, member]) => (
													<TouchableOpacity
														key={id}
														onPress={() => toggleSharedMember(id)}
														style={[
															styles.sharedOption,
															sharedWithIds.includes(id) && styles.sharedOptionSelected,
															{
																backgroundColor: sharedWithIds.includes(id)
																	? paperTheme.colors.primaryContainer
																	: theme.colors.surface,
																borderColor: theme.colors.border
															}
														]}
													>
														<MaterialCommunityIcons
															name={sharedWithIds.includes(id) ? "checkbox-marked" : "checkbox-blank-outline"}
															size={24}
															color={sharedWithIds.includes(id) ? paperTheme.colors.primary : theme.colors.text}
														/>
														<Text style={[
															styles.sharedOptionText,
															{
																color: sharedWithIds.includes(id)
																	? paperTheme.colors.onPrimaryContainer
																	: theme.colors.text
															}
														]}>
															{profiles[id]}
														</Text>
													</TouchableOpacity>
												))}
											</View>
										) : (
											<Text style={[styles.infoText, { color: theme.colors.error }]}>
												No members available
											</Text>
										)}
										{errors.sharedWith && <HelperText type="error">{errors.sharedWith}</HelperText>}
									</Surface>

									{/* Custom Amounts Section */}
									{splitType === 'custom' && sharedWithIds.length > 0 && (
										<Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
											<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
												Custom Amounts
											</Text>
											<View style={styles.customAmountsContainer}>
												{sharedWithIds.map(id => (
													<View key={id} style={styles.customAmountRow}>
														<Text style={[styles.customAmountLabel, { color: theme.colors.text }]}>
															{profiles[id]}
														</Text>
														<TextInput
															mode="outlined"
															dense
															style={[styles.customAmountInput, { backgroundColor: theme.colors.surface }]}
															value={customAmounts[id] || ''}
															placeholder="0.00"
															keyboardType="numeric"
															onChangeText={(text) => handleCustomAmountChange(id, text)}
															error={!!errors[`custom_${id}`]}
															left={<TextInput.Affix text={selectedCurrency} />}
														/>
													</View>
												))}
											</View>
											{errors.customTotal && (
												<HelperText type="error" style={styles.customTotalError}>
													{errors.customTotal}
												</HelperText>
											)}
										</Surface>
									)}

									{errors.submit && (
										<HelperText type="error" style={styles.submitError}>
											{errors.submit}
										</HelperText>
									)}
								</Card.Content>
							</ScrollView>

							<Divider style={{ backgroundColor: theme.colors.border }} />

							<Card.Actions style={styles.modalActions}>
								<Button
									onPress={onDismiss}
									disabled={isSubmitting}
									textColor={theme.colors.text}
								>
									Cancel
								</Button>
								<Button
									mode="contained"
									onPress={handleInternalSubmit}
									loading={isSubmitting}
									disabled={isSubmitting}
									icon="check"
								>
									{editingExpenseId ? "Save Changes" : "Add Expense"}
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
		maxHeight: '80%',
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
	customAmountsContainer: {
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
	memberOption: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		marginBottom: 8,
	},
	selectedMemberOption: {
		elevation: 2,
	},
	memberName: {
		marginLeft: 8,
		fontSize: 16,
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