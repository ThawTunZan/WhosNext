import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreensLayout() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        header: ({ route }) => (
          <Appbar.Header style={[
            styles.header,
            { 
              backgroundColor: theme.colors.background,
              paddingTop: insets.top,
              height: (Platform.OS === 'ios' ? 44 : 56) + insets.top
            }
          ]}>
            <Appbar.BackAction 
              onPress={() => router.back()} 
              color={theme.colors.text}
            />
            <Appbar.Content 
              title={''} 
              color={theme.colors.text}
            />
          </Appbar.Header>
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
        name="ChangePasswordScreen"
        options={{
          title: "Change Password"
        }}
      />
      <Stack.Screen
        name="AppSettings"
        options={{
          title: "Settings"
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: "Privacy Settings"
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 0,
  }
}); 