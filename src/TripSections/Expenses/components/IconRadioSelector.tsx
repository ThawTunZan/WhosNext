import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text, RadioButton, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconRadioOption = {
  value: string;
  label: string;
  icon: string;
};

interface IconRadioSelectorProps {
  title: string;
  value: string;
  options: IconRadioOption[];
  onValueChange: (value: string) => void;
  containerStyle?: ViewStyle;
  optionStyle?: ViewStyle;
}

const IconRadioSelector: React.FC<IconRadioSelectorProps> = ({
  title,
  value,
  options,
  onValueChange,
  containerStyle,
  optionStyle,
}) => {
  const paperTheme = useTheme();
  return (
    <Surface style={[styles.section, containerStyle]}> 
      <Text variant="titleMedium" style={styles.sectionTitle}>{title}</Text>
      <RadioButton.Group onValueChange={onValueChange} value={value}>
        <View style={styles.optionsContainer}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onValueChange(opt.value)}
              style={[
                styles.option,
                value === opt.value && styles.selectedOption,
                { backgroundColor: value === opt.value ? paperTheme.colors.primaryContainer : paperTheme.colors.surface },
                optionStyle,
              ]}
            >
              <MaterialCommunityIcons
                name={opt.icon as any}
                size={24}
                color={value === opt.value ? paperTheme.colors.onPrimaryContainer : paperTheme.colors.onSurface}
              />
              <Text style={[
                styles.optionText,
                { color: value === opt.value ? paperTheme.colors.onPrimaryContainer : paperTheme.colors.onSurface }
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </RadioButton.Group>
    </Surface>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  selectedOption: {
    elevation: 3,
  },
  optionText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default IconRadioSelector; 