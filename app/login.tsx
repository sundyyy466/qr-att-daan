import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { signIn } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';

const THEME = {
  background: '#F0F8F2',
  card: '#FFFFFF',
  primary: '#197746',
  primaryDark: '#105D36',
  text: '#172B38',
  muted: '#6D7E8B',
  border: '#D5E2DC',
  error: '#C62845',
  softGreen: '#E4F2E8',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await signIn(
        email.trim(),
        password
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.user) {
        setError('Unable to get your account information.');
        return;
      }

      const profile = await getProfile(data.user.id);

      if (!profile) {
        setError(
          'Your profile could not be loaded. Please check your profile and permissions.'
        );
        return;
      }

      if (profile.role === 'administrator') {
        router.replace('/admin');
      } else if (
        profile.role === 'student' ||
        profile.role === 'teacher'
      ) {
        router.replace('/(tabs)');
      } else {
        setError('Your account has an unrecognized role.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.decorTop} />
            <View style={styles.decorBottom} />

            <View style={styles.card}>
              <View style={styles.brandSection}>
                <View style={styles.logoCircle}>
                  <Ionicons
                    name="qr-code"
                    size={39}
                    color={THEME.primary}
                  />
                </View>

                <Text style={styles.brandTitle}>QR Attendance</Text>
                <View style={styles.brandUnderline} />
              </View>

              <View style={styles.headingSection}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to record your attendance
                </Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>

                
<View style={styles.inputContainer}>
  <Ionicons
    name="mail"
    size={23}
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


                
<View style={styles.passwordLabelRow}>
  <Text style={styles.label}>Password</Text>
</View>


<View style={styles.inputContainer}>
  <Ionicons
    name="lock-closed"
    size={22}
    color="#84949D"
  />

  <TextInput
    style={styles.input}
    value={password}
    onChangeText={setPassword}
    placeholder="Enter your password"
    placeholderTextColor="#84949D"
    secureTextEntry={!showPassword}
    autoCapitalize="none"
    autoCorrect={false}
    editable={!loading}
  />

  <Pressable
    onPress={() => setShowPassword((current) => !current)}
    style={styles.eyeButton}
    accessibilityRole="button"
    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
    disabled={loading}
  >
    <Ionicons
      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
      size={22}
      color="#7A8A96"
    />
  </Pressable>
</View>


                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color={THEME.error}
                    />
                    <Text style={styles.error}>{error}</Text>
                  </View>
                ) : null}

                {loading ? (
                  <View style={styles.signInButton}>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.buttonText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text
                    style={styles.signInButton}
                    onPress={handleLogin}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={24}
                      color="#FFFFFF"
                    />
                    {'   '}Sign In
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>
                  Don't have an account?
                </Text>
                <Link href="/register" style={styles.signupLink}>
                  Sign Up
                </Link>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
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
    overflow: 'hidden',
  },
  decorTop: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: '#E0EFE4',
    opacity: 0.65,
    top: -190,
    left: -155,
  },
  decorBottom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#DDEFE3',
    opacity: 0.65,
    bottom: -190,
    right: -160,
  },
  card: {
    width: '100%',
    maxWidth: 650,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    paddingHorizontal: 30,
    paddingTop: 32,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    shadowColor: '#326B4B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 5,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: THEME.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
  },
  brandUnderline: {
    width: 78,
    height: 3,
    backgroundColor: '#9BCDAA',
    marginTop: 18,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: THEME.muted,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 9,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  minHeight: 54,
  paddingHorizontal: 14,
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#D5E0DC',
},

 
input: {
  flex: 1,
  width: '100%',
  minWidth: 0,
  height: 52,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 16,
  color: THEME.text,
  outlineStyle: 'none',
} as any,

  
eyeButton: {
  padding: 8,
  marginLeft: 4,
  alignItems: 'center',
  justifyContent: 'center',
},

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF0F1',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },
  error: {
    flex: 1,
    color: THEME.error,
    fontSize: 13,
    lineHeight: 19,
  },
  signInButton: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primaryDark,
    borderRadius: 15,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 15,
    paddingVertical: 18,
    overflow: 'hidden',
    marginTop: 28,
    shadowColor: '#17643B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EEE9',
    marginTop: 30,
    marginBottom: 23,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  signupText: {
    fontSize: 15,
    color: THEME.muted,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.primary,
    paddingVertical: 4,
  },
  passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#D5E2E6',
  marginTop: 0,
},

passwordInput: {
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  color: '#142536',
},


});

