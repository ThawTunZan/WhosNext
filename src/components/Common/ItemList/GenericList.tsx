import React, { memo } from 'react';
import { View, SectionList, Text, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface Section<T> {
  title: string;
  data: T[];
}

interface GenericListProps<T> {
  sections: Section<T>[];
  searchQuery: string;
  renderItem: ({ item }: { item: T }) => React.ReactElement;
  searchFields: (item: T) => string[];
  emptyMessage: {
    withSearch: string;
    withoutSearch: string;
  };
  isRefreshing: boolean;
  onRefresh: () => void;
  styles: any;
  expandedId?: string | null;
}

function GenericList<T>({
  sections,
  searchQuery,
  renderItem,
  searchFields,
  emptyMessage,
  isRefreshing,
  onRefresh,
  styles,
}: GenericListProps<T>) {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const paperTheme = useTheme();

  /*
  TODO
  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return searchFields(item).some(field => 
      field.toLowerCase().includes(searchLower)
    );
  });
*/
  // Filter each section's data by search
  const filteredSections = sections
    .map(section => ({
      ...section,
      data: section.data.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        return searchFields(item).some(field =>
          field.toLowerCase().includes(searchLower)
        );
      })
    }))
    .filter(section => section.data.length > 0);

  return (
    <SectionList
      sections={filteredSections}
      renderItem={renderItem}
      keyExtractor={(item: any) => item.id}
      renderSectionHeader={({ section: { title } }) => (
        <View style={{ paddingVertical: 8, paddingHorizontal: 8, backgroundColor: theme.colors.background }}>
          <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
          <View style={{ height: 1, backgroundColor: theme.colors.surfaceVariant, marginTop: 4, marginBottom: 8 }} />
        </View>
      )}
      ListEmptyComponent={
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}> 
          <Text style={{ color: theme.colors.text }}>
            {searchQuery ? emptyMessage.withSearch : emptyMessage.withoutSearch}
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={paperTheme.colors.primary}
        />
      }
      contentContainerStyle={styles.listContentContainer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      stickySectionHeadersEnabled={false}
    />
  );
}

export default memo(GenericList); 