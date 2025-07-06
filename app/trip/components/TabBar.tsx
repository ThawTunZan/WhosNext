import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

type TabType = "overview" | "expenses" | "settle" | "activities" | "receipts" | "invite" | "leaderboard";

type TabBarProps = {
  selectedTab: TabType;
  onTabSelect: (tab: TabType) => void;
};

const TABS: TabType[] = ["overview", "expenses", "settle", "activities", "receipts", "invite", "leaderboard"];

export default function TabBar({ selectedTab, onTabSelect }: TabBarProps) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
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
              {
                backgroundColor: selectedTab === tab ? paperTheme.colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === tab 
                    ? '#fff'
                    : theme.colors.subtext,
                },
                selectedTab === tab && styles.selectedTabText,
              ]}
              onPress={() => onTabSelect(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  tabText: {
    fontSize: 16,
  },
  selectedTabText: {
    fontWeight: '500',
  },
}); 