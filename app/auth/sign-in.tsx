// app/auth/sign-in.tsx
import React, { useState } from 'react'
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
import { Link, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/clerk-expo'
import { Feather } from '@expo/vector-icons'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)

  const onSignInPress = async () => {
    if (!isLoaded) return
    try {
      // use username as the identifier
      const attempt = await signIn.create({ identifier: username, password })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.replace('/')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 pt-8"
        >
          <View className="flex-1 justify-center">
            <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Welcome Back
            </Text>
            <Text className="text-center text-gray-600 mb-6">
              Sign in to continue to Who’s Next
            </Text>

            <View className="space-y-4">
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="Username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

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

              <Link
                href="/auth/forgot-password"
                className="self-end text-sm text-blue-600 font-medium"
              >
                Forgot password?
              </Link>
            </View>

            <TouchableOpacity
              onPress={onSignInPress}
              className="bg-blue-600 rounded-xl py-3 items-center mt-8 shadow-lg"
            >
              <Text className="text-white text-lg font-semibold">
                Sign In
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center space-x-1 mt-6">
              <Text className="text-sm text-gray-500">
                Don’t have an account?
              </Text>
              <Link
                href="/auth/sign-up"
                className="text-sm text-blue-600 font-medium"
              >
                Sign Up
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
