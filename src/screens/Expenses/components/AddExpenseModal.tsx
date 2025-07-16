// src/components/AddExpenseModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, Text, TextInput, HelperText, Caption, useTheme, Surface, Divider, Portal, Menu } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { AddExpenseModalProps, Expense, SharedWith, FREE_USER_LIMITS, PREMIUM_USER_LIMITS } from '@/src/types/DataTypes';
import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { db } from "@/firebase";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CurrencyModal from '@/app/trip/components/CurrencyModal';
import { SUPPORTED_CURRENCIES } from '@/src/utilities/CurrencyUtilities';
import IconRadioSelector from './IconRadioSelector';
import AvatarRadioSelector from './AvatarRadioSelector';
import DateButton from '@/src/components/Common/DateButton';
import { useTripExpensesContext } from '@/src/context/TripExpensesContext';
import { incrementDailyExpenseLimitForTrip } from '@/src/services/expenseService';

const MAX_SHARE_LIMIT = 10000000; // 10 million

const AddExpenseModal = ({
  visible, onDismiss, onSubmit, members, tripId, initialData, editingExpenseId, suggestedPayerName, trip, onWatchAd
}: AddExpenseModalProps & { trip: any, onWatchAd: () => void }) => {
	const [expenseName, setExpenseName] = useState('');
	const [expenseAmt, setexpenseAmt] = useState('');
	const [expenseType, setExpenseType] = useState<'group' | 'personal'>('group');
	const [multiplePaidAmtMap, setmultiplePaidAmtMap] = useState('');
	const [paidByNames, setpaidByNames] = useState<string[]>([]);
	const [customPaidAmount, setCustomPaidAmount] = useState<{ [username: string]: string }>({});
	const [splitType, setSplitType] = useState<'even' | 'custom'>('even');
	const [sharedWithNames, setSharedWithNames] = useState<string[]>([]);
	const [customSplitAmount, setcustomSplitAmount] = useState<{ [id: string]: string }>({});
	const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
	const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [expenseDate, setExpenseDate] = useState<Date>(new Date());
	const [paidByCurrencies, setPaidByCurrencies] = useState<{ [username: string]: string }>({});
	const [menuVisible, setMenuVisible] = useState<{ [username: string]: boolean }>({});
	const [currencyModalFor, setCurrencyModalFor] = useState<string | null>(null);
	const [customSplitCurrencies, setCustomSplitCurrencies] = useState<{ [username: string]: string }>({});
	

	const memberEntries = React.useMemo(() => Object.entries(members), [members]);

	const { isLoaded, isSignedIn, user } = useUser()
	if (!isLoaded) return null
	if (!isSignedIn) return <Redirect href="/auth/sign-in" />
	const currentUsername = user.username

	// Reset form when modal is opened/closed or members change
	useEffect(() => {
		const isEditingMode = !!editingExpenseId;
		//console.log("Modal opening. Editing:", isEditingMode, "ID:", editingExpenseId, "Initial Data:", initialData);
		setErrors({});
		setIsSubmitting(false);
		if (visible) {
			// Optionally pre-select all members to share with initially
			const allMemberNames = Object.keys(members);

			setExpenseName(initialData?.activityName || ''); // Use activityName if present
			//setexpenseAmt(initialData?.paidByAndAmounts.map(pba => pba.amount).reduce((sum, amt) => sum + parseFloat(amt), 0).toString() || ''); // Use paidAmt if present
			setSelectedCurrency(initialData?.currency || 'USD');
			let editDate: Date | null = null;
			if (initialData?.createdAt) {
				if (typeof (initialData.createdAt as any).toDate === 'function') {
					editDate = (initialData.createdAt as any).toDate();
				} else if (initialData.createdAt instanceof Date) {
					editDate = initialData.createdAt;
				} else if (typeof initialData.createdAt === 'string' || typeof initialData.createdAt === 'number') {
					editDate = new Date(initialData.createdAt);
				}
			}
			setExpenseDate(editDate && !isNaN(editDate.getTime()) ? editDate : new Date());

			if (isEditingMode && initialData) {
				// --- Pre-fill specific to EDIT mode ---
				if (!initialData.sharedWith || initialData.sharedWith.length < 1) {
					setExpenseType('personal');
					setexpenseAmt(initialData.paidByAndAmounts[0].amount.toString());
				} else if (initialData.paidByAndAmounts && initialData.paidByAndAmounts.length > 0) {
					setExpenseType('group')
					setpaidByNames(initialData.paidByAndAmounts.map(pba => pba.memberName));
					const tempCustomPaidAmts: { [id: string]: string } = {};
					initialData.paidByAndAmounts.forEach(pba => {
						tempCustomPaidAmts[pba.memberName] = pba.amount.toString();
					});
					setCustomPaidAmount(tempCustomPaidAmts);
					setmultiplePaidAmtMap(
						initialData.paidByAndAmounts
							.reduce((sum, pba) => sum + parseFloat(pba.amount), 0)
							.toString()
					);
					const initialSharedNames = initialData.sharedWith.map(sw => sw.payeeName);
					setSharedWithNames(initialSharedNames);
					// Attempt to determine split type based on sharedWith data
					const firstAmount = initialData.sharedWith[0].amount;
					let allAmountsEqual = true;
					setSplitType("even");
					let customSplitAmountToSet: { [id: string]: string } = {};
					for (const sw of initialData.sharedWith) {
						if (Math.abs(sw.amount - firstAmount) > 0.01) {
							allAmountsEqual = false;
							setSplitType("custom")
						}
						customSplitAmountToSet[sw.payeeName] = sw.amount.toString();
					}
					const totalSharedAmount = initialData.sharedWith.reduce((sum, sw) => sum + sw.amount, 0);
					setcustomSplitAmount(customSplitAmountToSet);
					
				} else {
					setExpenseType('group')
					setpaidByNames([])
					setSharedWithNames([]);
					setSplitType('even');
					setcustomSplitAmount({});
				}
			} else {
				// --- Defaults for ADD mode (or if initialData is minimal) ---
				const allMemberNames = Object.keys(members);
				setSharedWithNames(allMemberNames);
				// If suggestedPayerName is available, try to find their ID and set it
				let defaultPayerName = suggestedPayerName;
				if (!defaultPayerName) defaultPayerName = currentUsername;
				if (!defaultPayerName && allMemberNames.length) defaultPayerName = allMemberNames[0];
				setpaidByNames([defaultPayerName]);
				setCustomPaidAmount({ [defaultPayerName]: '0' });
				setSplitType('even');
				setcustomSplitAmount({});
			}
			// Ensure paidByCurrencies is initialized for all payers
			setPaidByCurrencies(prev => {
				const updated = { ...prev };
				paidByNames.forEach(id => {
					if (!updated[id]) {
						updated[id] = trip?.currency || 'USD';
					}
				});
				return updated;
			});
			// Ensure customSplitCurrencies is initialized for all sharedWithNames (for custom split)
			setCustomSplitCurrencies(prev => {
				const updated = { ...prev };
				sharedWithNames.forEach(id => {
					if (!updated[id]) {
						updated[id] = trip?.currency || 'USD';
					}
				});
				return updated;
			});
		} else {
			// Reset all fields on close (already handled well)
			setExpenseName('');
			setexpenseAmt('');
			setpaidByNames([]);
			setSharedWithNames([]);
			setSplitType('even');
			setcustomSplitAmount({});
			setSelectedCurrency('USD');
			setErrors({});
			setIsSubmitting(false);
			setExpenseDate(new Date());
			setPaidByCurrencies(
				(initialData?.paidByAndAmounts || []).reduce((acc, pba) => {
					acc[pba.memberName] = (pba as any).currency || trip?.currency || 'USD';
					return acc;
				}, {} as { [username: string]: string })
			);
		}
	}, [visible, members, initialData, editingExpenseId, suggestedPayerName, currentUsername, trip?.currency]); // Reset on visibility change or if members list changes

	// In useEffect, when splitType or paidByNames changes, for even split, set selectedCurrency to the only payer's currency
	useEffect(() => {
		if (splitType === 'even' && paidByNames.length > 0) {
			const onlyCurrency = paidByCurrencies[paidByNames[0]] || trip?.currency || 'USD';
			setSelectedCurrency(onlyCurrency);
		}
	}, [splitType, paidByNames, paidByCurrencies, trip?.currency]);

	useEffect(() => {
		setPaidByCurrencies(prev => {
			const updated = { ...prev };
			paidByNames.forEach(id => {
				if (!updated[id]) {
					updated[id] = trip?.currency || 'USD';
				}
			});
			return updated;
		});
	}, [paidByNames, trip?.currency]);


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
			if (paidByNames.length === 0) {
				newErrors.paidBy = "Select at least one person to pay.";
				isValid = false;
			}
			// --- Per-currency sum validation ---
			// 1. Sum paidBy amounts per currency
			const paidBySums: { [currency: string]: number } = {};
			paidByNames.forEach(id => {
				const cur = paidByCurrencies[id] || trip?.currency || 'USD';
				const amt = parseFloat(customPaidAmount[id] || '0');
				if (!paidBySums[cur]) paidBySums[cur] = 0;
				paidBySums[cur] += isNaN(amt) ? 0 : amt;
			});
			// --- Even split cannot have multiple paidBy currencies ---
			if (splitType === 'even' && Object.keys(paidBySums).length > 1) {
				newErrors['evenSplitMultiCurrency'] = 'Even split is only allowed when all payers use the same currency.';
				isValid = false;
			}

			// Only check currency sums if not in the evenSplitMultiCurrency error state
			if (!newErrors['evenSplitMultiCurrency']) {
				// 2. Sum sharedWith amounts per currency
				const sharedWithSums: { [currency: string]: number } = {};
				sharedWithNames.forEach(id => {
					let cur = selectedCurrency;
					let amt = 0;
					if (splitType === 'custom') {
						cur = customSplitCurrencies[id] || selectedCurrency;
						amt = parseFloat(customSplitAmount[id] || '0');
					} else {
						// Even split
						cur = selectedCurrency; // already set to payer's currency by useEffect
						const totalPaid = Object.values(customPaidAmount)
							.map(a => parseFloat(a || '0'))
							.reduce((sum, v) => isNaN(v) ? sum : sum + v, 0);
						amt = sharedWithNames.length > 0 ? totalPaid / sharedWithNames.length : 0;
					}
					if (!sharedWithSums[cur]) sharedWithSums[cur] = 0;
					sharedWithSums[cur] += isNaN(amt) ? 0 : amt;
				});
				// 3. For each currency, check sums match
				Object.keys(paidBySums).forEach(cur => {
					const paid = paidBySums[cur] || 0;
					const shared = sharedWithSums[cur] || 0;
					if (Math.abs(paid - shared) > 0.01) {
						newErrors[`currencySum_${cur}`] = `Total paid (${cur}) ${paid.toFixed(2)} does not match total shared (${cur}) ${shared.toFixed(2)}.`;
						isValid = false;
					}
				});
				// Also check for currencies in sharedWithSums not in paidBySums
				Object.keys(sharedWithSums).forEach(cur => {
					if (!(cur in paidBySums)) {
						newErrors[`currencySum_${cur}`] = `No paid amount entered for currency ${cur}, but shared amount exists.`;
						isValid = false;
					}
				});
			}
			
			const totalPaidAmount = Object.values(customPaidAmount)
				.map(amt => parseFloat(amt || '0')) // Default to '0' if undefined or empty
				.reduce((sum, val) => isNaN(val) ? sum : sum + val, 0);
			if (!totalPaidAmount || totalPaidAmount <= 0) {
				newErrors.paidAmount = "Enter a valid paid amount.";
				isValid = false;
			}
			setmultiplePaidAmtMap(totalPaidAmount.toString());
			if (splitType === 'custom') {
				let totalCustomAmount = 0;
				let hasInvalidCustom = false;
				sharedWithNames.forEach(id => {
					const customAmt = parseFloat(customSplitAmount[id] || '0');
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
				if (splitType === 'custom') {
					for (const id of sharedWithNames) {
						const customAmt = parseFloat(customSplitAmount[id] || '0');
						if (customAmt > MAX_SHARE_LIMIT) {
							newErrors[`custom_${id}`] = `Share cannot exceed 10,000,000 (${selectedCurrency}).`;
							isValid = false;
						}
					}
				}
			}
			paidByNames.forEach(id => {
				if (!paidByCurrencies[id]) {
					newErrors[`currency_${id}`] = 'Select a currency';
					isValid = false;
				}
			});
		}

		if (sharedWithNames.length === 0) {
			newErrors.sharedWith = "Select at least one person to share with.";
			isValid = false;
		}

		// Date validation
		if (!expenseDate || !(expenseDate instanceof Date) || isNaN(expenseDate.getTime())) {
			newErrors.date = 'Please select a valid date.';
			isValid = false;
		}

		setErrors(newErrors);
		console.log("Validation errors:", newErrors);
		return isValid;
	}

	const handleInternalSubmit = async () => {

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		setErrors({}); // Clear previous errors

		let parsedSharedWith: SharedWith[] = [];
    let parsedPaidByAndAmounts: {memberName: string, amount: string}[] = []

		try {
				const numOfPpl = sharedWithNames.length
				let totalPaid = 0;

				if (expenseType === 'personal') {
					totalPaid = parseFloat(expenseAmt);
					parsedPaidByAndAmounts = [{memberName: user.username, amount: expenseAmt}];
					parsedSharedWith = []
				} else if (expenseType === 'group') {
					
					parsedPaidByAndAmounts = paidByNames.map(username => ({
						memberName: username,
						amount: customPaidAmount[username],
						currency: paidByCurrencies[username] || trip?.currency || 'USD',
					}));
					
					if (splitType === 'custom') {
						parsedSharedWith = sharedWithNames.map(username => ({
							payeeName: username,
							amount: parseFloat(customSplitAmount[username] || '0'),
							currency: customSplitCurrencies[username] || selectedCurrency
						}));
					} else if (splitType === 'even') { // Even split
						totalPaid = Object.values(customPaidAmount)
							.map(amt => parseFloat(amt || '0'))
							.reduce((sum, val) => isNaN(val) ? sum : sum + val, 0);
						console.log("TOTAL PAID IS " + totalPaid)
						const perPerson = numOfPpl > 0 ? totalPaid / numOfPpl : 0;
						parsedSharedWith = sharedWithNames.map(username => ({
							payeeName: username,
							amount: perPerson,
							currency: selectedCurrency,
						}));
					}
				}
					
			const newExpenseRef = doc(
				collection(db, "trips", tripId, "expenses")
			);
			const newId = newExpenseRef.id;
		
			const expenseData: Expense = {
				id: newId,
				activityName: expenseName.trim(),
				paidByAndAmounts: parsedPaidByAndAmounts,
				sharedWith: parsedSharedWith,		// TO DO SEE WHAT HAPPEN IF NULL WHEN EXPENSE TYPE IS PERSONAL
				currency: selectedCurrency,
				createdAt: Timestamp.fromDate(expenseDate), // store as string
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
		setSharedWithNames(prev => {
			const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
			// When removing a member from custom split, clear their amount
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
		// Allow only numbers and one decimal point
		const cleanedText = text.replace(/[^0-9.]/g, '');
		setcustomSplitAmount(prev => ({ ...prev, [id]: cleanedText }));
	};

	const handleCustomPaidAmountChange = (id: string, text: string) => {
		// Allow only numbers and one decimal point
		const cleanedText = text.replace(/[^0-9.]/g, '');
		setCustomPaidAmount(prev => ({ ...prev, [id]: cleanedText }));
	};

	const handleMultiplePaidByChange = (val: string | string[]) => {
		if (Array.isArray(val)) setpaidByNames(val);
	};

	const { isDarkMode } = useCustomTheme();
	const theme = isDarkMode ? darkTheme : lightTheme;
	const paperTheme = useTheme();

	const today = new Date().toISOString().slice(0, 10);
	const isPremium = trip?.isTripPremium || trip?.premiumStatus === 'premium';
	const amtLeft = isPremium
		? undefined
		: (trip?.dailyExpenseLimit?.[today] ?? FREE_USER_LIMITS.maxExpensesPerDayPerTrip);

	return (
		<>
			<Portal>
				<Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onDismiss}>
					<View style={styles.modalBackground}>
						<Card style={styles.modalCard}>
							<ScrollView>
								<Card.Title title={editingExpenseId ? "Edit Expense" : "Add New Expense"} />
								<Card.Content>
									{/* Show currency sum and even split multi-currency errors at the top */}
									{Object.entries(errors)
										.filter(([key]) => key.startsWith('currencySum_') || key === 'evenSplitMultiCurrency')
										.map(([key, msg]) => (
											<HelperText key={key} type="error" style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>
												{msg}
											</HelperText>
										))}
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
									{ expenseType === 'personal' && (
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
									
									<Surface style={[styles.section, { backgroundColor: theme.colors.background, marginVertical: 8 }]}>
										<Text
											variant="titleMedium"
											style={[
												styles.sectionTitle,
												{ color: theme.colors.text, textAlign: 'left', marginBottom: 16 }
											]}
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
									

									{expenseType === 'group' && (
										<>
										{/* Paid By Section */}

											<AvatarRadioSelector
												title="Paid by"
												value={paidByNames}
												onValueChange={handleMultiplePaidByChange}
												options={memberEntries.map(([id, member]) => ({ value: id, label: id }))}
												containerStyle={{ backgroundColor: theme.colors.background }}
												multiple={true}
											/>
											
											{suggestedPayerName && (
												<Caption style={[styles.suggestionText, { color: theme.colors.primary }]}>💡 Suggestion: {suggestedPayerName} is next to pay</Caption>
											)}
											{errors.paidBy && <HelperText type="error">{errors.paidBy}</HelperText>}

											{/* Custom Paid Amounts Section */}
											
											<Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
												<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
													Paid Amounts
												</Text>
												<View style={styles.customSplitAmountContainer}>
													{paidByNames.map(id => (
														<View key={id} style={styles.customAmountRow}>
															<Text style={[styles.customAmountLabel, { color: theme.colors.text }]}>
																{id}
															</Text>
															{/* Currency Dropdown */}
															<Button
																mode="outlined"
																onPress={() => setCurrencyModalFor(id)}
																style={styles.currencyButton}
															>
																{paidByCurrencies[id] || trip?.currency || 'USD'}
															</Button>
															{/* Amount Input */}
															<TextInput
																mode="outlined"
																dense
																style={[styles.customAmountInput, { backgroundColor: theme.colors.surface }]}
																value={customPaidAmount[id] || ''}
																placeholder="0.00"
																keyboardType="numeric"
																onChangeText={(text) => handleCustomPaidAmountChange(id, text)}
																error={!!errors[`custom_${id}`]}
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
																	sharedWithNames.includes(id) && styles.sharedOptionSelected,
																	{
																		backgroundColor: sharedWithNames.includes(id)
																			? paperTheme.colors.primaryContainer
																			: theme.colors.surface,
																		borderColor: theme.colors.border
																	}
																]}
															>
																<MaterialCommunityIcons
																	name={sharedWithNames.includes(id) ? "checkbox-marked" : "checkbox-blank-outline"}
																	size={24}
																	color={sharedWithNames.includes(id) ? paperTheme.colors.primary : theme.colors.text}
																/>
																<Text style={[
																	styles.sharedOptionText,
																	{
																		color: sharedWithNames.includes(id)
																			? paperTheme.colors.onPrimaryContainer
																			: theme.colors.text
																	}
																]}>
																	{id}
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
											{splitType === 'custom' && sharedWithNames.length > 0 && (
												<Surface style={[styles.section, { backgroundColor: theme.colors.background }]}>
													<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
														Custom Amounts
													</Text>
													<View style={styles.customSplitAmountContainer}>
														{sharedWithNames.map(id => (
															<View key={id} style={styles.customAmountRow}>
																<Text style={[styles.customAmountLabel, { color: theme.colors.text }]}>
																	{id}
																</Text>
																{/* Currency Dropdown for custom split */}
																<Button
																	mode="outlined"
																	onPress={() => setCurrencyModalFor('custom_' + id)}
																	style={styles.currencyButton}
																>
																	{customSplitCurrencies[id] || selectedCurrency}
																</Button>
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
														))}
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
									disabled={isSubmitting || (!isPremium && amtLeft !== undefined && amtLeft <= 0)}
									icon="check"
								>
									{editingExpenseId ? "Save Changes" : "Add Expense"}
								</Button>
							</Card.Actions>

							{!isPremium && amtLeft !== undefined && amtLeft <= 0 ? (
								<>
									<Text style={{ color: theme.colors.error, textAlign: 'center', marginTop: 8 }}>
										Daily expense limit reached. Watch an ad to increase your limit!
									</Text>
									<Button
										mode="contained"
										icon="video"
										onPress={onWatchAd}
										style={{ margin: 12 }}
									>
										Watch Ad to Increase Daily Limit
									</Button>
								</>
							) : null}

						</Card>
						<CurrencyModal
							visible={showCurrencyDialog}
							onDismiss={() => setShowCurrencyDialog(false)}
							selectedCurrency={selectedCurrency}
							onSelectCurrency={setSelectedCurrency}
						/>
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
													if (currencyModalFor && currencyModalFor.startsWith('custom_')) {
														const id = currencyModalFor.replace('custom_', '');
														setCustomSplitCurrencies(v => ({ ...v, [id]: cur }));
													} else if (currencyModalFor) {
														setPaidByCurrencies(v => ({ ...v, [currencyModalFor]: cur }));
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