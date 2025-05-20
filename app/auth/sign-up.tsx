// app/auth/sign-up.tsx
import * as React from 'react'
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [username, setUsername] = React.useState('')
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [hidePassword, setHidePassword] = React.useState(true)

  const onSignUpPress = async () => {
    if (!isLoaded) return
    try {
      // include username + email + password
      await signUp.create({ username, emailAddress, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(attempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-8">
            <View className="flex-1 justify-center">
              <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Verify your email
              </Text>
              <Text className="text-center text-gray-600 mb-6">
                We sent a code to {emailAddress}
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
                placeholder="Enter verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={onVerifyPress}
                className="bg-blue-600 rounded-xl py-3 items-center shadow-lg"
              >
                <Text className="text-white text-lg font-semibold">Verify</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-8">
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Create Account
            </Text>
            <Text className="text-center text-gray-600 mb-6">
              Sign up to join Who’s Next
            </Text>

            <View className="space-y-4">
              {/* Username */}
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="Username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

              {/* Email */}
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="Email address"
                autoCapitalize="none"
                keyboardType="email-address"
                value={emailAddress}
                onChangeText={setEmailAddress}
              />

              {/* Password */}
              <View className="relative">
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 pr-12"
                  placeholder="Password"
                  secureTextEntry={hidePassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setHidePassword(!hidePassword)}
                  className="absolute right-3 top-3"
                >
                  <Feather
                    name={hidePassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              className="bg-blue-600 rounded-xl py-3 items-center mt-8 shadow-lg"
            >
              <Text className="text-white text-lg font-semibold">Continue</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center space-x-1 mt-6">
              <Text className="text-sm text-gray-500">Already have an account?</Text>
              <Link href="/auth/sign-in" className="text-sm text-blue-600 font-medium">
                Sign in
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
