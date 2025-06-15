import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useRequireAuth } from '@/src/hooks/useAuthGuard';
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  loadingComponent 
}) => {
  const { shouldRender, isLoading, user } = useRequireAuth();
  const { isDarkMode } = useCustomTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!shouldRender) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background 
      }}>
        <Text style={{ color: theme.colors.text }}>
          Redirecting to sign in...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

// HOC version for wrapping components
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    loadingComponent?: React.ReactNode;
  }
) => {
  return (props: P) => (
    <AuthGuard 
      fallback={options?.fallback}
      loadingComponent={options?.loadingComponent}
    >
      <Component {...props} />
    </AuthGuard>
  );
}; 