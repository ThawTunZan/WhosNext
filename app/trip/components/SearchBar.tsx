import React from 'react';
import { StyleSheet, View, Keyboard, TextInput } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface SearchBarProps {
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ 
  searchQuery, 
  onChangeSearch,
  placeholder = 'Search...'
}: SearchBarProps) => {
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleChangeText = (text: string) => {
    onChangeSearch(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtext}
        value={searchQuery}
        onChangeText={handleChangeText}
        style={[
          styles.searchBar,
          { 
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.text 
          }
        ]}
        autoComplete="off"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
