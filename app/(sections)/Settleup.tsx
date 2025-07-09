// src/components/SettleUpSection.tsx (or wherever it resides)

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, SectionList, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, Divider, Button, useTheme, FAB, List, Avatar, SegmentedButtons, IconButton } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useUser } from '@clerk/clerk-expo';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

import {
    standardCalculateSimplifiedDebts,
    calculateSimplifiedDebtsToTripCurrency,
    calculateSimplifiedDebtsPerCurrency,
    ParsedDebt,         
} from '@/src/TripSections/SettleUp/utilities/SettleUpUtilities'; 
import { Member, Debt, Payment } from '@/src/types/DataTypes';
import RecordPaymentModal from '@/src/TripSections/Payment/components/RecordPaymentModal';
import { firebaseRecordPayment, firebaseDeletePayment } from '@/src/services/FirebaseServices';
import { useTripData } from '@/src/hooks/useTripData';

// Props type specific to this component
type SettleUpProps = {
  debts?: Debt[];
  members: Record<string, Member>;  
  tripId: string;
  tripCurrency: string;
};

// Define section type
type DebtSection = {
  data: Debt[];
  fromName: string;
};

export default function SettleUpSection({ debts = [], members, tripId, tripCurrency }: SettleUpProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();
  const { user } = useUser();

  const [value, setValue] = useState('all'); // 'all' | 'simplified' | 'currency'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { payments, loading: paymentsLoading, error: paymentsError } = useTripData(tripId);
  const [shownDebts, setShownDebts] = useState<DebtSection[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [expandedPaymentIds, setExpandedPaymentIds] = useState<Set<string>>(new Set());

  // Toggle payment expansion
  const togglePaymentExpanded = useCallback((paymentId: string) => {
    setExpandedPaymentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  }, []);

  // Transform debts from DB format to array format
  const transformDebts = useCallback((rawDebts: any): Debt[] => {
    if (!rawDebts) return [];
    
    const transformedDebts: Debt[] = [];
    Object.entries(rawDebts).forEach(([currency, debtsByUsers]) => {
      Object.entries(debtsByUsers as Record<string, number>).forEach(([userPair, amount]) => {
        const [fromUserName, toUserName] = userPair.split('#');
        transformedDebts.push({
          fromUserName,
          toUserName,
          amount,
          currency: currency
        });
      });
    });
    return transformedDebts;
  }, []);

  // Group debts by currency
  const groupDebts = useCallback((debts: Debt[]) => {
    // Group by currency
    const grouped = debts.reduce((acc, debt) => {
      const fromName = debt.fromUserName || 'Unknown';
      if (!acc[fromName]) {
        acc[fromName] = [];
      }
      acc[fromName].push(debt);
      return acc;
    }, {} as Record<string, Debt[]>);

    // Convert to array format with data property
    return Object.entries(grouped).map(([fromName, debts]) => ({
      data: debts,
      fromName: fromName
    }));
  }, []);

  // Calculate parsed and simplified debts
  useEffect(() => {
    const calculateDebts = async () => {
      const validDebts = transformDebts(debts);
      let processedDebts: Debt[] = [];
      
      try {
        switch (value) {
          case 'all':
            processedDebts = await standardCalculateSimplifiedDebts(validDebts);
            break;
          case 'simplified':
            processedDebts = await calculateSimplifiedDebtsPerCurrency(validDebts);
            break;
          case 'currency':
            processedDebts = await calculateSimplifiedDebtsToTripCurrency(validDebts, tripCurrency);
            break;
        }
        setShownDebts(groupDebts(processedDebts));
      } catch (error) {
        console.error('Error calculating debts:', error);
        // If currency conversion fails, fall back to showing raw debts
        if (value === 'all') {
          setShownDebts(groupDebts(validDebts));
        }
      }
    };
    calculateDebts();
  }, [debts, tripCurrency, value, transformDebts, groupDebts]);

  const handlePaymentSubmit = async (paymentData: Payment) => {
    // Update backend
    await firebaseRecordPayment(paymentData);

    // Update UI
    // setPayments(prevPayments => [...prevPayments, paymentData]); // This line is removed as payments are now managed by useTripData

    setShowPaymentModal(false);
  };

  const handleDeletePayment = useCallback(async (payment: Payment) => {
    try {
      await firebaseDeletePayment(tripId, payment);
      // Optionally, you can refetch payments by calling useTripData again or rely on the listener
      setSnackbarMessage("Payment deleted successfully");
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting payment:', error);
      setSnackbarMessage("Failed to delete payment");
      setSnackbarVisible(true);
    }
  }, [tripId]);

  // Render function for each debt item
  const renderItem = useCallback(({ item }: { item: Debt }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Title
        title={`owes ${item.toUserName}`}
        titleStyle={{ color: theme.colors.text }}
        right={() => (
          <Text style={[styles.amountText, { color: theme.colors.text }]}>
            {item.amount.toFixed(2)} {item.currency}
          </Text>
        )}
        rightStyle={styles.amountContainer}
      />
    </Card>
  ), [theme.colors]);

  // Render payment item
  const renderPaymentItem = useCallback((payment: Payment) => {
    const fromUser = payment.fromUserName
    const toUser = payment.toUserName
    
    // Handle different date formats
    let paymentDate: Date;
    if (payment.paymentDate instanceof Date) {
      paymentDate = payment.paymentDate;
    } else if (payment.paymentDate instanceof Timestamp) {
      paymentDate = payment.paymentDate.toDate();
    } else {
      paymentDate = new Date();
      console.warn('Invalid payment date format:', payment.paymentDate);
    }

    const isExpanded = expandedPaymentIds.has(payment.id || '');

    return (
      <Card style={[styles.paymentItem, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => togglePaymentExpanded(payment.id || '')}>
          <Card.Title
            title={`${fromUser} → ${toUser}`}
            subtitle={format(paymentDate, 'MMM d, yyyy')}
            left={props => (
              <Avatar.Icon 
                {...props} 
                icon={payment.method === 'cash' ? 'cash' : payment.method === 'transfer' ? 'bank-transfer' : 'note'} 
                size={40}
                style={{ backgroundColor: theme.colors.primary }}
              />
            )}
            right={props => (
              <View style={styles.paymentItemRight}>
                <Text style={[styles.paymentAmount, { color: theme.colors.text }]}>
                  ${payment.amount.toFixed(2)}
                </Text>
                <IconButton
                  {...props}
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  onPress={() => togglePaymentExpanded(payment.id || '')}
                />
              </View>
            )}
          />
        </TouchableOpacity>

        {isExpanded && (
          <Card.Content>
            <Divider style={styles.divider} />
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>From</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{fromUser}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>To</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{toUser}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Amount</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  ${payment.amount.toFixed(2)} {payment.currency}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Method</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.subtext }]}>Date</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {format(paymentDate, 'MMMM d, yyyy')}
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                <IconButton
                  icon="delete"
                  mode="contained"
                  containerColor={theme.colors.error}
                  iconColor={theme.colors.surface}
                  size={20}
                  onPress={() => {
                    Alert.alert(
                      "Delete Payment",
                      "Are you sure you want to delete this payment?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Delete", 
                          style: "destructive",
                          onPress: () => handleDeletePayment(payment)
                        }
                      ]
                    );
                  }}
                />
              </View>
            </View>
          </Card.Content>
        )}
      </Card>
    );
  }, [expandedPaymentIds, theme.colors, handleDeletePayment]);

  const renderListHeader = () => (
    <>
      <Text style={[styles.header, { color: theme.colors.text }]}>💸 Settle Up</Text>
      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
    </>
  );

  // Render function for section headers
  const renderSectionHeader = useCallback(({ section }: { section: DebtSection }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
      {section.fromName}
    </Text>
  ), [theme.colors]);

  const keyExtractor = useCallback((item: Debt, index: number) =>
    `${item.fromUserName}-${item.toUserName}-${index}`,
  []);

  const renderPaymentsSection = () => (
    <View style={styles.paymentsSection}>
      <Text style={[styles.header, { color: theme.colors.text }]}>📝 Payment History</Text>
      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
      {payments.length === 0 ? (
        <Text style={[styles.noPaymentsText, { color: theme.colors.subtext }]}>
          No payments recorded yet
        </Text>
      ) : (
        payments
          .sort((a, b) => {
            const dateA = a.paymentDate instanceof Date ? a.paymentDate : a.paymentDate.toDate();
            const dateB = b.paymentDate instanceof Date ? b.paymentDate : b.paymentDate.toDate();
            return dateB.getTime() - dateA.getTime();
          })
          .map((payment, index) => (
            <React.Fragment key={payment.id || index}>
              {renderPaymentItem(payment)}
              {index < payments.length - 1 && (
                <Divider style={{ backgroundColor: theme.colors.divider }} />
              )}
            </React.Fragment>
          ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={shownDebts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={
          <>
            <SegmentedButtons
              value={value}
              onValueChange={setValue}
              style={styles.segmentedButton}
              buttons={[
                {
                  value: 'all',
                  label: 'All Debts',
                  icon: 'format-list-bulleted',
                },
                {
                  value: 'simplified',
                  label: 'Simplify',
                  icon: 'playlist-check',
                },
                {
                  value: 'currency',
                  label: `To ${tripCurrency}`,
                  icon: 'currency-usd',
                }
              ]}
            />
            <View style={styles.paymentsSection}>
              <Text style={[styles.header, { color: theme.colors.text }]}>📝 Payment History</Text>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
              {payments.length === 0 ? (
                <Text style={[styles.noPaymentsText, { color: theme.colors.subtext }]}>
                  No payments recorded yet
                </Text>
              ) : (
                payments
                  .sort((a, b) => {
                    const dateA = a.paymentDate instanceof Date ? a.paymentDate : a.paymentDate.toDate();
                    const dateB = b.paymentDate instanceof Date ? b.paymentDate : b.paymentDate.toDate();
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((payment, index) => (
                    <React.Fragment key={payment.id || index}>
                      {renderPaymentItem(payment)}
                    </React.Fragment>
                  ))
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.noDebtText, { color: theme.colors.subtext }]}>
            No debts to settle 🎉
          </Text>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.listContentContainer, { paddingBottom: 80 }]}
      />

      <FAB
        icon="cash-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowPaymentModal(true)}
        label="Record Payment"
      />

        <RecordPaymentModal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentSubmit}
          debts={debts}
          currentUsername={user?.username || ''}
          tripId={tripId}
          defaultCurrency={tripCurrency}
          members={members}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  divider: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  card: {
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  amountContainer: {
    paddingRight: 16,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  noDebtText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  paymentsSection: {
    marginTop: 20,
    paddingTop: 10,
  },
  paymentItem: {
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  noPaymentsText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  segmentedButton: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  paymentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  expandedContent: {
    paddingVertical: 8,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});