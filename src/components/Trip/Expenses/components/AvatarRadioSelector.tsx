import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text, RadioButton, Checkbox, useTheme, Surface, Avatar } from 'react-native-paper';

export type AvatarRadioOption = {
  value: string;
  label: string;
  avatarUri?: string;
};

interface AvatarRadioSelectorProps {
  title: string;
  value: string | string[];
  options: AvatarRadioOption[];
  onValueChange: (value: string | string[]) => void;
  multiple?: boolean;
  containerStyle?: ViewStyle;
  optionStyle?: ViewStyle;
}

const AvatarRadioSelector: React.FC<AvatarRadioSelectorProps> = ({
  title,
  value,
  options,
  onValueChange,
  multiple = false,
  containerStyle,
  optionStyle,
}) => {
  const paperTheme = useTheme();
  const isSelected = (val: string) =>
    multiple && Array.isArray(value)
      ? value.includes(val)
      : value === val;

  const handlePress = (val: string) => {
    if (multiple && Array.isArray(value)) {
      if (value.includes(val)) {
        onValueChange(value.filter(v => v !== val));
      } else {
        onValueChange([...value, val]);
      }
    } else {
      onValueChange(val);
    }
  };

  return (
    <Surface style={[styles.section, containerStyle]}> 
      <Text variant="titleMedium" style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handlePress(opt.value)}
            style={[
              styles.option,
              isSelected(opt.value) && styles.selectedOption,
              { backgroundColor: isSelected(opt.value) ? paperTheme.colors.primaryContainer : paperTheme.colors.surface },
              optionStyle,
            ]}
          >
            {opt.avatarUri ? (
              <Avatar.Image size={32} source={{ uri: opt.avatarUri }} />
            ) : (
              <Avatar.Text size={32} label={opt.label.slice(0, 2).toUpperCase()} />
            )}
            <Text style={[
              styles.optionText,
              { color: isSelected(opt.value) ? paperTheme.colors.onPrimaryContainer : paperTheme.colors.onSurface }
            ]}>
              {opt.label}
            </Text>
            {multiple ? (
              <Checkbox.Android
                status={isSelected(opt.value) ? 'checked' : 'unchecked'}
                onPress={() => handlePress(opt.value)}
              />
            ) : (
              <RadioButton.Android value={opt.value} status={isSelected(opt.value) ? 'checked' : 'unchecked'} />
            )}
          </TouchableOpacity>
        ))}
      </View>
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
    flexDirection: 'column',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  selectedOption: {
    elevation: 3,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
});

export default AvatarRadioSelector; 