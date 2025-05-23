export const lightTheme = {
  colors: {
    primary: '#2563EB',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#1F2937',
    subtext: '#6B7280',
    border: '#E5E7EB',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    info: '#2563EB',
    card: '#FFFFFF',
    divider: '#E5E7EB',
    notification: '#EF4444',
    placeholder: '#9CA3AF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    disabled: '#E5E7EB',
    surfaceVariant: '#F9FAFB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: {
    small: 4,
    medium: 8,
    large: 12,
  },
  elevation: {
    none: 0,
    small: 2,
    medium: 4,
    large: 8,
  },
};

export const darkTheme = {
  colors: {
    primary: '#3B82F6',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    subtext: '#9CA3AF',
    border: '#374151',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    card: '#1F2937',
    divider: '#374151',
    notification: '#EF4444',
    placeholder: '#6B7280',
    backdrop: 'rgba(0, 0, 0, 0.7)',
    disabled: '#374151',
    surfaceVariant: '#374151',
  },
  spacing: {
    ...lightTheme.spacing,
  },
  roundness: {
    ...lightTheme.roundness,
  },
  elevation: {
    ...lightTheme.elevation,
  },
};

export type Theme = typeof lightTheme;

export const useThemeColors = (isDarkMode: boolean) => {
  return isDarkMode ? darkTheme.colors : lightTheme.colors;
}; 