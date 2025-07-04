import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

export default function ProfileHeader({ title, subtitle }: { title: string, subtitle: string }) {
  const router = useRouter();
  const { isDarkMode, setDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center' }]}>
      <IconButton
        icon="arrow-left"
        size={28}
        onPress={() => router.back()}
        style={{ marginLeft: -25, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { marginTop:20,flexShrink: 1 }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[{ marginTop: 5, flexShrink: 1 }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 0,
    flexShrink: 1,
  },
});