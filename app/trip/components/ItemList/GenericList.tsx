import React, { memo } from 'react';
import { View, FlatList, Text, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface GenericListProps<T> {
  data: T[];
  searchQuery: string;
  profiles: Record<string, string>;
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
  data,
  searchQuery,
  profiles,
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

  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return searchFields(item).some(field => 
      field.toLowerCase().includes(searchLower)
    );
  });

  return (
    <FlatList
      data={filteredData}
      renderItem={renderItem}
      keyExtractor={(item: any) => item.id}
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
    />
  );
}

export default memo(GenericList); 