import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';

export default function ProfileScreensLayout() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    
    <Stack
      screenOptions={{
        header: ({ route }) => (
            <Appbar.Content 
              title={''} 
              color={theme.colors.text}
            />
        ),
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <Stack.Screen
        name="PaymentMethodsScreen"
        options={{
          title: "Payment Methods"
        }}
      />
      <Stack.Screen
        name="ContactUsScreen"
        options={{
          title: "Contact Us"
        }}
      />
      <Stack.Screen
        name="AppSettings"
        options={{
          title: "Settings"
        }}
      />
      <Stack.Screen
        name="NotificationSettingsScreen"
        options={{
          title: "Notification Settings"
        }}
      />
    </Stack>
  );
}
