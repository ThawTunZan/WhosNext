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
import { useSignIn, useOAuth } from '@clerk/clerk-expo'
import { Feather } from '@expo/vector-icons'
import { useTheme as useCustomTheme } from '@/src/context/ThemeContext'
import { lightTheme, darkTheme } from '@/src/theme/theme'
// Note: expo-apple-authentication will be added when you install it

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  // OAuth hooks
  const { startOAuthFlow: googleOAuth } = useOAuth({ 
    strategy: 'oauth_google',
    redirectUrl: Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : undefined,
  })
  const { startOAuthFlow: appleOAuth } = useOAuth({ 
    strategy: 'oauth_apple',
    redirectUrl: Platform.OS === 'web' ? `${window.location.origin}/auth/callback` : undefined,
  })

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: '',
  })

  const { redirect_to } = useLocalSearchParams<{ redirect_to?: string }>()

  const { isDarkMode } = useCustomTheme()
  const theme = isDarkMode ? darkTheme : lightTheme

  // Google OAuth Sign-In
  const onGoogleSignIn = async () => {
    if (!isLoaded) return

    setOauthLoading('google')
    try {
      console.log('Starting Google OAuth flow...')
      const { createdSessionId, signIn, signUp, setActive: clerkSetActive } = await googleOAuth()
      
      console.log('OAuth response:', { 
        createdSessionId, 
        signInStatus: signIn?.status, 
        signUpStatus: signUp?.status,
        signInSessionId: signIn?.createdSessionId,
        signUpSessionId: signUp?.createdSessionId
      })
      
      if (createdSessionId) {
        console.log('Using createdSessionId:', createdSessionId)
        // Session was created, activate it
        await clerkSetActive({ session: createdSessionId })
        router.replace(redirect_to ?? '/')
      } else if (signIn?.status === 'complete') {
        console.log('Sign in complete, using session:', signIn.createdSessionId)
        // User signed in successfully
        await clerkSetActive({ session: signIn.createdSessionId })
        router.replace(redirect_to ?? '/')
      } else if (signUp?.status === 'complete') {
        console.log('Sign up complete, using session:', signUp.createdSessionId)
        // User signed up successfully
        await clerkSetActive({ session: signUp.createdSessionId })
        router.replace(redirect_to ?? '/')
      } else if (signUp?.status === 'missing_requirements') {
        console.log('Missing requirements for sign up:', signUp.missingFields)
        
        // Auto-generate username if missing
        if (signUp.missingFields?.includes('username')) {
          const emailPrefix = signUp.emailAddress?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'user'
          const timestamp = Date.now().toString().slice(-4)
          const generatedUsername = `${emailPrefix}${timestamp}`
          
          console.log('Auto-generating username:', generatedUsername)
          
          try {
            // Update the sign-up with missing fields
            const updatedSignUp = await signUp.update({ 
              username: generatedUsername 
            })
            
            console.log('Updated signup status:', updatedSignUp.status)
            
            if (updatedSignUp.status === 'complete' && updatedSignUp.createdSessionId) {
              console.log('Sign up completed after username update:', updatedSignUp.createdSessionId)
              await clerkSetActive({ session: updatedSignUp.createdSessionId })
              router.replace(redirect_to ?? '/')
            } else {
              console.log('Signup still not complete after username update, current status:', updatedSignUp.status)
              setErrors(prev => ({ 
                ...prev, 
                general: 'Account created successfully! Please sign in with your credentials.' 
              }))
            }
          } catch (updateError) {
            console.error('Error completing signup with username:', updateError)
            setErrors(prev => ({ 
              ...prev, 
              general: 'Account setup in progress. Please try signing in again.' 
            }))
          }
        }
      } else if (signIn?.status === 'needs_identifier') {
        console.log('Sign in needs identifier - user may need to sign up first')
        setErrors(prev => ({ 
          ...prev, 
          general: 'Account found but additional information needed. Please try again or sign up manually.' 
        }))
      } else {
        // Handle other cases or prompt user for additional info
        console.log('OAuth completed but no session created:', { signIn, signUp })
        setErrors(prev => ({ 
          ...prev, 
          general: 'Could not sign in. Please try again.' 
        }))
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err)
      setErrors(prev => ({ 
        ...prev, 
        general: 'Google sign-in failed. Please try again.' 
      }))
    } finally {
      setOauthLoading('')
    }
  }

  // Apple OAuth Sign-In
  const onAppleSignIn = async () => {
    if (!isLoaded) return

    setOauthLoading('apple')
    try {
      const { createdSessionId, signIn, signUp, setActive: clerkSetActive } = await appleOAuth()
      
      if (createdSessionId) {
        // Session was created, activate it
        await clerkSetActive({ session: createdSessionId })
        router.replace(redirect_to ?? '/')
      } else if (signIn?.status === 'complete') {
        // User signed in successfully
        await clerkSetActive({ session: signIn.createdSessionId })
        router.replace(redirect_to ?? '/')
      } else if (signUp?.status === 'complete') {
        // User signed up successfully
        await clerkSetActive({ session: signUp.createdSessionId })
        router.replace(redirect_to ?? '/')
      } else {
        // Handle other cases or prompt user for additional info
        console.log('OAuth completed but no session created:', { signIn, signUp })
        setErrors(prev => ({ 
          ...prev, 
          general: 'Authentication completed but could not sign in. Please try again.' 
        }))
      }
    } catch (err: any) {
      console.error('Apple OAuth error:', err)
      setErrors(prev => ({ 
        ...prev, 
        general: 'Apple sign-in failed. Please try again.' 
      }))
    } finally {
      setOauthLoading('')
    }
  }

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
      newErrors.password = 'Password is required!';
      isValid = false;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView 
        style={styles.avoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {errors.general ? renderError(errors.general) : null}

            {/* Email/Password Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.colors.surface, color: theme.colors.text }, errors.username ? styles.inputError : null
                  ]}
                  placeholder="Username or Email"
                  placeholderTextColor="#8A8A8A"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {renderError(errors.username)}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface, color: theme.colors.text }
                    ]}
                    placeholder="Password"
                    placeholderTextColor="#8A8A8A"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={hidePassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setHidePassword(!hidePassword)}
                  >
                    <Feather 
                      name={hidePassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {renderError(errors.password)}
                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={styles.forgot}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, loading ? styles.signInButtonDisabled : null]}
                onPress={onSignInPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signInText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              {/* Apple Sign-In Button (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.oauthButton, styles.appleButton]}
                  onPress={onAppleSignIn}
                  disabled={oauthLoading !== ''}
                >
                  {oauthLoading === 'apple' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="smartphone" size={20} color="#FFFFFF" />
                      <Text style={styles.appleButtonText}>Continue with Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={[styles.oauthButton, styles.googleButton]}
                onPress={onGoogleSignIn}
                disabled={oauthLoading !== ''}
              >
                {oauthLoading === 'google' ? (
                  <ActivityIndicator color="#1F2937" />
                ) : (
                  <>
                    <Feather name="mail" size={20} color="#1F2937" />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                <Text style={styles.footerLink}>Sign up</Text>
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
    color: '#2563EB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#2563EB',
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
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    width: '100%',
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
  oauthContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  oauthButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#6B7280',
    fontSize: 14,
  },
});
