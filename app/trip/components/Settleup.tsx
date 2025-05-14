// src/components/SettleUpSection.tsx (or wherever it resides)
import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Card, Text, Divider, Button } from 'react-native-paper';

import {
    parseAndGroupDebts,
    calculateSimplifiedDebts,
    GroupedSectionData, 
    ParsedDebt,         
    DebtsMap,           
    MembersMap          
} from '../../../src/services/SettleUpUtilities'; 

// Props type specific to this component
type SettleUpProps = {
  debts: DebtsMap;
  members: MembersMap;  
};

export default function SettleUpSection({ debts, members }: SettleUpProps) {
  const [isSimplified, setIsSimplified] = useState(false);

  const parsedDebts = useMemo(() => parseAndGroupDebts(debts, members), [debts, members]);
  const simplifiedDebts = useMemo(() => calculateSimplifiedDebts(debts, members), [debts, members]);

  const shownDebts: GroupedSectionData[] = isSimplified ? simplifiedDebts : parsedDebts;

  const toggleSimplify = useCallback(() => {
      setIsSimplified(prev => !prev);
  }, []);

  // Render function for each debt item
  const renderItem = useCallback(({ item }: { item: ParsedDebt }) => ( // Use imported ParsedDebt type
    <Card style={styles.card}>
      <Card.Title
        title={`Owes ${item.toName}`}
        right={() => (
          <Text style={styles.amountText}>
            ${item.amount.toFixed(2)}
          </Text>
        )}
        rightStyle={styles.amountContainer}
      />
    </Card>
  ), []); 

  // Render function for section headers
  const renderSectionHeader = useCallback(({ section }: { section: GroupedSectionData }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text> 
  ), []);

  const keyExtractor = useCallback((item: ParsedDebt, index: number) =>
     `${item.fromId}-${item.toId}-${index}`, 
  []);

  const renderListHeader = () => (
    <>
      <Text style={styles.header}>💸 Settle Up</Text>
      <Divider style={styles.divider} />
    </>
  );

  // Render Footer for the SectionList
  const renderListFooter = () => (
    <Button
        mode="contained"
        onPress={toggleSimplify}
        style={styles.button}
        icon={isSimplified ? "playlist-remove" : "playlist-check"}
      >
        {isSimplified ? 'Show All Debts' : 'Simplify Debts'}
      </Button>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={shownDebts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderListHeader} // <-- Add Header Here
        ListFooterComponent={renderListFooter} // <-- Add Button Here
        ListEmptyComponent={<Text style={styles.noDebtText}>No debts to settle 🎉</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContentContainer} // Add padding if needed inside list
         // Optionally add style={{ flex: 1 }}
      />
    </View>
  );
}

// --- STYLES --- (Keep relevant styles, adjust as needed)
const styles = StyleSheet.create({
  container: {
    flex: 1, // Make this container take up available space
     // Remove paddingHorizontal here if handled by listContentContainer
   },
   listContentContainer: {
     paddingHorizontal: 15, // Add horizontal padding inside the list
     paddingBottom: 20, // Add padding at the bottom of list content
   },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5, // Align with list content
  },
  divider: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8, // Increased spacing
    color: '#333',
    paddingHorizontal: 5, // Align with card indentation
  },
  card: {
    marginBottom: 10, // Increased spacing
    borderRadius: 8,  // Slightly adjusted radius
    backgroundColor: '#fff',
    elevation: 2,
  },
   amountContainer: {
     paddingRight: 16, // Added for better alignment of the right element
   },
  amountText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a1a1a', // Darker color for amount
  },
  noDebtText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginTop: 40, // More spacing when empty
    marginBottom: 20,
  },
  button: {
    marginTop: 10, // Ensure button is spaced from list
    marginBottom: 20, // More space at the bottom
    marginHorizontal: 10,
  },
});