
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(
        email.trim(),
        password,
        {
          full_name: fullName.trim(),
          role,
        }
      );

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View pointerEvents="none" style={styles.decorTop} />
      <View pointerEvents="none" style={styles.decorBottom} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.brandSection}>
                <View style={styles.logoCircle}>
                  <Ionicons
                    name="qr-code"
                    size={38}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.brandTitle}>QR Attendance</Text>
                <View style={styles.brandUnderline} />
              </View>

              <View style={styles.headingSection}>
                <Text style={styles.title}>
                  {success ? 'Almost There!' : 'Create Account'}
                </Text>
                <Text style={styles.subtitle}>
                  {success
                    ? 'Verify your email to get started'
                    : 'Register to start recording attendance'}
                </Text>
              </View>

              {success ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Ionicons
                      name="mail-open-outline"
                      size={34}
                      color={COLORS.primary}
                    />
                  </View>

                  <Text style={styles.successTitle}>
                    Check your email!
                  </Text>
                  <Text style={styles.successText}>
                    We sent a confirmation link to {email}. Open the link
                    to verify your account, then return here to sign in.
                  </Text>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => router.replace('/login')}
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={22}
                      color="#FFFFFF"
                    />
                    <Text style={styles.buttonText}>Back to Sign In</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.form}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color="#84949D"
                    />
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter your full name"
                      placeholderTextColor="#84949D"
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>

                  <Text style={styles.label}>I am a...</Text>
                  <View style={styles.roleRow}>
                    <Pressable
                      style={[
                        styles.roleChip,
                        role === 'student' && styles.roleChipActive,
                      ]}
                      onPress={() => setRole('student')}
                      disabled={loading}
                    >
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color={
                          role === 'student' ? COLORS.primary : '#84949D'
                        }
                      />
                      <Text
                        style={[
                          styles.roleChipText,
                          role === 'student' && styles.roleChipTextActive,
                        ]}
                      >
                        Student
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.roleChip,
                        role === 'teacher' && styles.roleChipActive,
                      ]}
                      onPress={() => setRole('teacher')}
                      disabled={loading}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={
                          role === 'teacher' ? COLORS.primary : '#84949D'
                        }
                      />
                      <Text
                        style={[
                          styles.roleChipText,
                          role === 'teacher' && styles.roleChipTextActive,
                        ]}
                      >
                        Teacher
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={21}
                      color="#84949D"
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your.email@school.edu"
                      placeholderTextColor="#84949D"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color="#84949D"
                    />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 6 characters"
                      placeholderTextColor="#84949D"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!loading}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      accessibilityLabel={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={21}
                        color="#84949D"
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color="#84949D"
                    />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#84949D"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!loading}
                    />
                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeButton}
                      accessibilityLabel={
                        showConfirmPassword
                          ? 'Hide confirmation password'
                          : 'Show confirmation password'
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={21}
                        color="#84949D"
                      />
                    </Pressable>
                  </View>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={20}
                        color={COLORS.danger}
                      />
                      <Text style={styles.error}>{error}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    style={[
                      styles.primaryButton,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="person-add-outline"
                          size={22}
                          color="#FFFFFF"
                        />
                        <Text style={styles.buttonText}>Create Account</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {!success && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.signupRow}>
                    <Text style={styles.signupText}>
                      Already have an account?
                    </Text>
                    <Link href="/login" style={styles.signupLink}>
                      Sign In
                    </Link>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.footerText}>
              QR Attendance · School Event Check-in
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F3',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  decorTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#E3F1E7',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#E3F1E7',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#E4EEE7',
    shadowColor: '#16452B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 5,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E5F3E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#172B24',
    textAlign: 'center',
  },
  brandUnderline: {
    width: 72,
    height: 3,
    backgroundColor: '#91CBA4',
    marginTop: 16,
    borderRadius: 3,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#172B24',
    textAlign: 'center',
    marginBottom: 7,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#718078',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172B24',
    marginTop: 13,
    marginBottom: 7,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E0D8',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#172B24',
    outlineStyle: 'none',
  } as any,
  eyeButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChip: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D4E0D8',
    backgroundColor: '#FFFFFF',
  },
  roleChipActive: {
    borderColor: '#287348',
    backgroundColor: '#EAF5ED',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64746B',
  },
  roleChipTextActive: {
    color: '#287348',
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  error: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.danger,
  },
  primaryButton: {
    minHeight: 56,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: '#17643A',
    paddingHorizontal: 18,
    shadowColor: '#17643A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EEE9',
    marginTop: 25,
    marginBottom: 22,
  },
  signupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  signupText: {
    fontSize: 14,
    color: '#718078',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#17643A',
    paddingVertical: 3,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E5F3E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#172B24',
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: '#718078',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#718078',
  },
});
