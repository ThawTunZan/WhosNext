// src/components/SettleUpSection.tsx (or wherever it resides)

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Card, Text, Divider, Button, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

import {
    parseAndGroupDebts,
    calculateSimplifiedDebts,
    GroupedSectionData, 
    ParsedDebt,         
    DebtsMap,               
} from '@/src/services/SettleUpUtilities'; 
import { Member } from '@/src/types/DataTypes';
import { useMemberProfiles } from '@/src/context/MemberProfilesContext';

// Props type specific to this component
type SettleUpProps = {
  debts: DebtsMap;
  members: Record<string, Member>;  
};

export default function SettleUpSection({ debts }: SettleUpProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  const profiles = useMemberProfiles();
  const [isSimplified, setIsSimplified] = useState(false);

  const parsedDebts = useMemo(() => parseAndGroupDebts(debts, profiles), [debts, profiles]);
  const simplifiedDebts = useMemo(() => calculateSimplifiedDebts(debts, profiles), [debts, profiles]);

  const shownDebts: GroupedSectionData[] = isSimplified ? simplifiedDebts : parsedDebts;

  const toggleSimplify = useCallback(() => {
      setIsSimplified(prev => !prev);
  }, []);

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

  // Render function for section headers
  const renderSectionHeader = useCallback(({ section }: { section: GroupedSectionData }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
      {section.title}
    </Text> 
  ), [theme.colors]);

  const keyExtractor = useCallback((item: ParsedDebt, index: number) =>
     `${item.fromId}-${item.toId}-${index}`, 
  []);

  const renderListHeader = () => (
    <>
      <Text style={[styles.header, { color: theme.colors.text }]}>💸 Settle Up</Text>
      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={shownDebts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
          <Text style={[styles.noDebtText, { color: theme.colors.subtext }]}>
            No debts to settle 🎉
          </Text>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContentContainer}
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
});