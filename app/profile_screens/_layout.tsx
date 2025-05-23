import { Stack } from 'expo-router';

export default function ProfileScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PaymentMethodsScreen"
      />
      <Stack.Screen
        name="FriendsScreen"
      />
      <Stack.Screen
        name="ContactUsScreen"
      />
      <Stack.Screen
        name="ChangePasswordScreen"
      />
    </Stack>
  );
} 