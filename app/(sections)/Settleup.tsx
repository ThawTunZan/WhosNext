// src/components/SettleUpSection.tsx (or wherever it resides)

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Card, Text, Divider, Button, useTheme, FAB, List, Avatar } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { useUser } from '@clerk/clerk-expo';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

import {
    parseAndGroupDebts,
    calculateSimplifiedDebts,
    GroupedSectionData, 
    ParsedDebt,         
    DebtsMap,               
} from '@/src/utilities/SettleUpUtilities'; 
import { Member } from '@/src/types/DataTypes';
import { useMemberProfiles } from '@/src/context/MemberProfilesContext';
import RecordPaymentModal from '@/src/components/RecordPaymentModal';
import { firebaseRecordPayment, firebaseGetTripPayments, Payment } from '@/src/services/FirebaseServices';

// Props type specific to this component
type SettleUpProps = {
  debts: DebtsMap;
  members: Record<string, Member>;  
  tripId: string;
};

export default function SettleUpSection({ debts, members, tripId }: SettleUpProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();
  const { user } = useUser();
  const profiles = useMemberProfiles();

  const [isSimplified, setIsSimplified] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Fetch payments when component mounts or tripId changes
  useEffect(() => {
    const fetchPayments = async () => {
      if (tripId) {
        const fetchedPayments = await firebaseGetTripPayments(tripId);
        setPayments(fetchedPayments);
      }
    };
    fetchPayments();
  }, [tripId]);

  const parsedDebts = useMemo(() => parseAndGroupDebts(debts, profiles), [debts, profiles]);
  const simplifiedDebts = useMemo(() => calculateSimplifiedDebts(debts, profiles), [debts, profiles]);

  const shownDebts: GroupedSectionData[] = isSimplified ? simplifiedDebts : parsedDebts;

  const toggleSimplify = useCallback(() => {
    setIsSimplified(prev => !prev);
  }, []);

  const handlePaymentSubmit = async (paymentData: Payment) => {
    // Update backend
    await firebaseRecordPayment(paymentData);

    // Update UI
    setPayments(prevPayments => [...prevPayments, paymentData]);

    setShowPaymentModal(false);
  };

  // Render function for each debt item
  const renderItem = useCallback(({ item }: { item: ParsedDebt }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Title
        title={`Owes ${item.toName}`}
        titleStyle={{ color: theme.colors.text }}
        right={() => (
          <Text style={[styles.amountText, { color: theme.colors.text }]}>
            ${item.amount.toFixed(2)}
          </Text>
        )}
        rightStyle={styles.amountContainer}
      />
    </Card>
  ), [theme.colors]);

  // Render payment item
  const renderPaymentItem = (payment: Payment) => {
    const fromUser = profiles[payment.fromUserId] || payment.fromUserId;
    const toUser = profiles[payment.toUserId] || payment.toUserId;
    
    // Handle different date formats
    let paymentDate: Date;
    if (payment.paymentDate instanceof Date) {
      paymentDate = payment.paymentDate;
    } else if (payment.paymentDate instanceof Timestamp) {
      // Handle Firestore Timestamp
      paymentDate = payment.paymentDate.toDate();
    } else {
      // Fallback to current date if invalid
      paymentDate = new Date();
      console.warn('Invalid payment date format:', payment.paymentDate);
    }

    return (
      <List.Item
        title={`${fromUser} → ${toUser}`}
        description={`${format(paymentDate, 'MMM d, yyyy')} • ${payment.method}`}
        left={props => (
          <Avatar.Icon 
            {...props} 
            icon={payment.method === 'cash' ? 'cash' : payment.method === 'transfer' ? 'bank-transfer' : 'note'} 
            size={40}
            style={{ backgroundColor: theme.colors.primary }}
          />
        )}
        right={props => (
          <Text {...props} style={[styles.paymentAmount, { color: theme.colors.text }]}>
            ${payment.amount.toFixed(2)}
          </Text>
        )}
        style={[styles.paymentItem, { backgroundColor: theme.colors.surface }]}
      />
    );
  };

  const renderListHeader = () => (
    <>
      <Text style={[styles.header, { color: theme.colors.text }]}>💸 Settle Up</Text>
      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
    </>
  );

  // Render function for section headers
  const renderSectionHeader = useCallback(({ section }: { section: GroupedSectionData }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
      {section.title}
    </Text>
  ), [theme.colors]);

  const keyExtractor = useCallback((item: ParsedDebt, index: number) =>
    `${item.fromId}-${item.toId}-${index}`,
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
            <Button
              mode="contained"
              onPress={toggleSimplify}
              style={styles.button}
              icon={isSimplified ? "playlist-remove" : "playlist-check"}
            >
              {isSimplified ? 'Show All Debts' : 'Simplify Debts'}
            </Button>
            {renderPaymentsSection()}
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.noDebtText, { color: theme.colors.subtext }]}>
            No debts to settle 🎉
          </Text>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContentContainer}
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
        profiles={profiles}
        debts={debts}
        currentUserId={user?.id || ''}
        tripId={tripId}
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
    marginVertical: 2,
    borderRadius: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginRight: 16,
  },
  noPaymentsText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});