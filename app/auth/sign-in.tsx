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
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/clerk-expo'
import { Feather } from '@expo/vector-icons'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: '',
  })

  const { redirect_to } = useLocalSearchParams<{ redirect_to?: string }>()

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      username: '',
      password: '',
      general: '',
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required'
      isValid = false
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
      isValid = false
    }

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

  const onSignInPress = async () => {
    if (!isLoaded || loading) return

    if (!validateForm()) return

    setLoading(true)
    setErrors({ username: '', password: '', general: '' })

    try {
      const attempt = await signIn.create({ identifier: username, password })
      
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.replace(redirect_to ?? '/')
      }
    } catch (err: any) {
      console.error(err)
      // Handle specific error cases
      if (err.errors?.[0]?.message?.includes('identifier')) {
        setErrors(prev => ({ ...prev, username: 'Invalid username' }))
      } else if (err.errors?.[0]?.message?.includes('password')) {
        setErrors(prev => ({ ...prev, password: 'Invalid password' }))
      } else {
        setErrors(prev => ({ 
          ...prev, 
          general: 'Sign in failed. Please check your credentials and try again.' 
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const renderError = (error: string) => {
    if (!error) return null
    return <Text style={styles.errorText}>{error}</Text>
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Who's Next</Text>

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

              <TouchableOpacity
                onPress={() => router.push('/auth/forgot-password')}
              >
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onSignInPress}
              style={[
                styles.signInButton,
                loading ? styles.signInButtonDisabled : null,
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                <Text style={styles.footerLink}> Sign Up</Text>
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
  },
  forgot: {
    alignSelf: 'flex-end',
    color: '#2563EB',
    fontSize: 14,
    marginTop: 4,
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  signInText: {
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
