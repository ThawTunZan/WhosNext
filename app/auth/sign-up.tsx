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
  ActivityIndicator,
} from 'react-native'
import { useSignUp, useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isSignedIn } = useUser()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    code: '',
    general: '',
  })

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      username: '',
      email: '',
      password: '',
      code: '',
      general: '',
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required'
      isValid = false
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
      isValid = false
    }

    // Email validation
    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const validateCode = () => {
    let isValid = true
    const newErrors = { ...errors, code: '', general: '' }

    if (!code.trim()) {
      newErrors.code = 'Verification code is required'
      isValid = false
    } else if (code.length !== 6) {
      newErrors.code = 'Code must be 6 digits'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const onSignUpPress = async () => {
    if (!isLoaded || loading) return
    if (!validateForm()) return

    setLoading(true)
    setErrors({ username: '', email: '', password: '', code: '', general: '' })

    try {
      await signUp.create({ username, emailAddress, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      console.error(err)
      if (err.errors?.[0]?.message?.includes('username')) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }))
      } else if (err.errors?.[0]?.message?.includes('email')) {
        setErrors(prev => ({ ...prev, email: 'Email is already registered' }))
      } else if (err.errors?.[0]?.message?.includes('password')) {
        setErrors(prev => ({ ...prev, password: 'Password is too weak' }))
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'Sign up failed. Please try again.',
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded || loading) return
    if (!validateCode()) return

    setLoading(true)
    setErrors({ ...errors, code: '', general: '' })

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.push('/')
      }
    } catch (err: any) {
      console.error(err)
      setErrors(prev => ({
        ...prev,
        code: 'Invalid verification code',
      }))
    } finally {
      setLoading(false)
    }
  }

  const renderError = (error: string) => {
    if (!error) return null
    return <Text style={styles.errorText}>{error}</Text>
  }

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.safeWhite}>
        <KeyboardAvoidingView
          style={styles.avoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inner}>
              <Text style={styles.headerVerify}>Verify your email</Text>
              <Text style={styles.verifySubtitle}>
                We sent a code to {emailAddress}
              </Text>

              {renderError(errors.general)}

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.code ? styles.inputError : null,
                  ]}
                  placeholder="Enter verification code"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text)
                    if (errors.code) {
                      setErrors(prev => ({ ...prev, code: '' }))
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {renderError(errors.code)}
              </View>

              <TouchableOpacity
                onPress={onVerifyPress}
                style={[
                  styles.actionButton,
                  loading ? styles.actionButtonDisabled : null,
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Verify</Text>
                )}
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to join Who's Next</Text>

            {renderError(errors.general)}

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.username ? styles.inputError : null,
                  ]}
                  placeholder="Username"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text)
                    if (errors.username) {
                      setErrors(prev => ({ ...prev, username: '' }))
                    }
                  }}
                />
                {renderError(errors.username)}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.email ? styles.inputError : null,
                  ]}
                  placeholder="Email address"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={emailAddress}
                  onChangeText={(text) => {
                    setEmailAddress(text)
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }))
                    }
                  }}
                />
                {renderError(errors.email)}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1 },
                      errors.password ? styles.inputError : null,
                    ]}
                    placeholder="Password"
                    secureTextEntry={hidePassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }))
                      }
                    }}
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
                {renderError(errors.password)}
              </View>
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              style={[
                styles.actionButton,
                loading ? styles.actionButtonDisabled : null,
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
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
    backgroundColor: '#E0F2FE',
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
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  actionButtonDisabled: {
    backgroundColor: '#93C5FD',
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
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
