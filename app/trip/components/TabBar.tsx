import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

type TabType = "overview" | "expenses" | "settle" | "activities" | "add" | "receipts" | "invite";

type TabBarProps = {
  selectedTab: TabType;
  onTabSelect: (tab: TabType) => void;
};

const TABS: TabType[] = ["overview", "expenses", "settle", "activities", "add", "receipts", "invite"];

export default function TabBar({ selectedTab, onTabSelect }: TabBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => (
          <View
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.selectedTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.selectedTabText,
              ]}
              onPress={() => onTabSelect(tab)}
            >
              {tab === "add" ? "+" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  selectedTab: {
    backgroundColor: '#6200ee',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  selectedTabText: {
    color: '#fff',
    fontWeight: '500',
  },
}); 