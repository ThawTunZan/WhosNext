import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import { StyleSheet, Platform } from 'react-native';

export default function ProfileScreensLayout() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Stack
      screenOptions={{
        header: ({ route }) => (
          <Appbar.Header style={[
            styles.header,
            { backgroundColor: theme.colors.background }
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
        name="FriendsScreen"
        options={{
          title: "Friends & Groups"
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
        name="settings"
        options={{
          title: "Settings"
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 44 : 56,
    elevation: 0,
    marginTop: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100
  }
}); 