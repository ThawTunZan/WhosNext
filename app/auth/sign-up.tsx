// app/auth/sign-up.tsx
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
  StyleSheet,
} from 'react-native'
import { useSignUp, useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isSignedIn } = useUser()
  console.log("isSignedIn:", isSignedIn)
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [hidePassword, setHidePassword] = useState(true)

  const onSignUpPress = async () => {
    if (!isLoaded) return
    try {
      await signUp.create({ username, emailAddress, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error(err)
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.push('/')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.safeWhite}>
        <KeyboardAvoidingView
          style={styles.avoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inner}>
              <Text style={styles.headerVerify}>Verify your email</Text>
              <Text style={styles.verifySubtitle}>
                We sent a code to {emailAddress}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={onVerifyPress}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.inner}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to join Who’s Next</Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <TextInput
              style={styles.input}
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailAddress}
              onChangeText={setEmailAddress}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                secureTextEntry={hidePassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setHidePassword(!hidePassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={hidePassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Continue</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/sign-in')}
              >
                <Text style={styles.footerLink}> Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#E0F2FE', // blue-50
  },
  safeWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  avoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937', // gray-800
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    marginBottom: 24,
    textAlign: 'center',
  },
  headerVerify: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  verifySubtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB', // gray-200
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827', // gray-900
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#2563EB', // blue-600
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB', // blue-600
    fontWeight: '600',
  },
})
