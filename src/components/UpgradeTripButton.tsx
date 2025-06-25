import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface UpgradeTripButtonProps {
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

function onPress() {
  console.log('onPress');
}

export const UpgradeTripButton: React.FC<UpgradeTripButtonProps> = ({
  disabled = false,
  loading = false,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Surface 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.surface },
        style
      ]} 
      elevation={2}
    >
      <TouchableOpacity
        style={[
          styles.upgradeButton,
          { 
            backgroundColor: theme.colors.primary,
            opacity: disabled || loading ? 0.6 : 1 
          }
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="diamond" 
              size={24} 
              color="white" 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.upgradeTitle}>
              Upgrade to Premium
            </Text>
            <Text style={styles.upgradeSubtitle}>
              Unlock advanced features
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            {loading ? (
              <Ionicons 
                name="hourglass" 
                size={20} 
                color="white" 
              />
            ) : (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="white" 
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    margin: 0,
  },
  upgradeButton: {
    borderRadius: 12,
    padding: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 