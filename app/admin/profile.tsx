
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';

const BLUE = '#168BFA';
const TEAL = '#00BDAA';
const NAVY = '#073B63';

export default function AdminProfile() {
    useEffect(() => {
  async function loadSavedImage() {
    try {
      const savedImage =
        await AsyncStorage.getItem('admin_profile_image');

      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Unable to load profile photo:', error);
    }
  }

  loadSavedImage();
}, []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Administrator');
  const [username, setUsername] = useState('administrator');
  const [createdAt, setCreatedAt] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [theme, setTheme] = useState('Light');
  const [language, setLanguage] = useState('English');
  const [choiceOpen, setChoiceOpen] = useState('');
  const [photoMessage, setPhotoMessage] = useState(false);

async function changeProfilePhoto() {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset.base64) {
      Alert.alert('Error', 'Unable to read the selected image.');
      return;
    }

    const savedImage =
      `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;

    await AsyncStorage.setItem('admin_profile_image', savedImage);
    setProfileImage(savedImage);

    Alert.alert('Success', 'Profile picture saved!');
  } catch (error) {
    console.error('Profile photo error:', error);
    Alert.alert('Error', 'Unable to save the profile picture.');
  }
}


  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        const user = data.user;

        if (user) {
          setEmail(user.email ?? '');
          setName(
            user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              'Administrator'
          );
          setUsername(
            user.user_metadata?.username ??
              user.email?.split('@')[0] ??
              'administrator'
          );
          setCreatedAt(
            user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : 'Not available'
          );
        }
      } catch (error) {
        console.error('Profile loading error:', error);
        Alert.alert('Profile', 'Unable to load account information.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function saveProfile() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
          username: username.trim(),
        },
      });

      if (error) throw error;

      setEditOpen(false);
      Alert.alert('Success', 'Your profile information was updated.');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Update failed', 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      Alert.alert(
        'Password too short',
        'Your new password must contain at least 8 characters.'
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordOpen(false);
      setNewPassword('');
      Alert.alert('Success', 'Your password has been changed.');
    } catch (error) {
      console.error('Password update error:', error);
      Alert.alert(
        'Password update failed',
        'Please check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function showSessions() {
    Alert.alert(
      'Login Sessions',
      'Session management is not connected yet. Your current session remains active.'
    );
  }

  function showTwoFactor(value: boolean) {
    setTwoFactor(value);

    Alert.alert(
      'Two-Factor Authentication',
      value
        ? 'The switch is enabled for this screen, but two-factor authentication must still be configured in Supabase before it provides additional security.'
        : 'The switch is now off. This does not change Supabase MFA settings.'
    );
  }

  function chooseOption(type: string, options: string[]) {
    setChoiceOpen(type);
    setChoiceOptions(options);
  }

  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);

  
async function selectOption(value: string) {
  if (choiceOpen === 'Theme') {
    setTheme(value);

    try {
      await AsyncStorage.setItem('admin_theme', value);
    } catch (error) {
      console.error('Unable to save theme:', error);
    }
  }

  if (choiceOpen === 'Language') {
    setLanguage(value);
  }

  setChoiceOpen('');
}


const isDark = theme === 'Dark';

const pageColors = {
  background: isDark ? '#0B1726' : '#EAFBFA',
  card: isDark ? '#17283B' : '#FFFFFF',
  text: isDark ? '#F1F5F9' : '#111A58',
  muted: isDark ? '#B8C7D9' : '#64759A',
  border: isDark ? '#30445B' : '#D7EFF5',
};

  if (loading) {
    
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.muted}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
style={[
  styles.screen,
  { backgroundColor: pageColors.background },
]}      contentContainerStyle={styles.page}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to the previous page"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/admin');
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.heading}>Profile</Text>
          <Text style={styles.subtitle}>
            Manage your administrator account and settings.
          </Text>
        </View>
      </View>

      <View style={styles.topGrid}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
  {profileImage ? (
    <Image
      source={{ uri: profileImage }}
      style={styles.avatarImage}
      accessibilityLabel="Selected profile picture"
    />
  ) : (
    <Text style={styles.avatarFallback}>♙</Text>
  )}
</View>

          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileRole}>System Administrator</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>✓  Administrator</Text>
          </View>

          
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Change profile photo"
  onPress={changeProfilePhoto}
  style={styles.photoButton}
>
  <Text style={styles.photoButtonText}>◎  Change Photo</Text>
</Pressable>

          <Text style={styles.photoHint}>Profile photo upload setup required</Text>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>♙</Text>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditOpen(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✎ Edit Profile</Text>
            </Pressable>
          </View>

          <InfoRow icon="♙" label="Full Name" value={name} />
          <InfoRow icon="✉" label="Email" value={email || 'Not available'} />
          <InfoRow icon="@" label="Username" value={username} />
          <InfoRow icon="◇" label="Role" value="Administrator" />
          <InfoRow icon="▦" label="Account Created" value={createdAt || 'Not available'} />
          <InfoRow icon="◷" label="Last Login" value="Not available" />
        </View>
      </View>

      <View style={styles.bottomGrid}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>▣  Security Settings</Text>

          <ActionRow
            icon="⚿"
            title="Change Password"
            subtitle="Update your account password."
            onPress={() => setPasswordOpen(true)}
          />

          <ActionRow
            icon="▣"
            title="Login Sessions"
            subtitle="Manage your active sessions."
            onPress={showSessions}
          />

          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>◇</Text>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingSubtitle}>
                Extra security for your account.
              </Text>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={showTwoFactor}
              trackColor={{ false: '#C5CEDC', true: TEAL }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Two-factor authentication switch"
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>⚙  Preferences</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>☾</Text>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Theme</Text>
              <Text style={styles.settingSubtitle}>
                Choose your preferred theme.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose theme. Current theme ${theme}`}
              onPress={() =>
                chooseOption('Theme', ['Light', 'Dark', 'System'])
              }
              style={styles.selectButton}
            >
              <Text style={styles.selectText}>{theme}  ⌄</Text>
            </Pressable>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>♧</Text>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>
                Receive system notifications.
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#C5CEDC', true: BLUE }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Notifications switch"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>◎</Text>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Language</Text>
              <Text style={styles.settingSubtitle}>
                Select your language.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose language. Current language ${language}`}
              onPress={() =>
                chooseOption('Language', ['English', 'Filipino', 'Cebuano'])
              }
              style={styles.selectButton}
            >
              <Text style={styles.selectText}>{language}  ⌄</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              style={styles.input}
              accessibilityLabel="Full name"
            />

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="Username"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={email}
              editable={false}
              style={[styles.input, styles.disabledInput]}
              accessibilityLabel="Email address"
            />

            <Text style={styles.helpText}>
              Email changes require a separate account verification flow.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={saveProfile}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setEditOpen(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={passwordOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="New password"
            />

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={changePassword}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? 'Updating...' : 'Update Password'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPasswordOpen(false);
                setNewPassword('');
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={choiceOpen !== ''}
        transparent
        animationType="fade"
        onRequestClose={() => setChoiceOpen('')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose {choiceOpen}</Text>
            {choiceOptions.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => selectOption(option)}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>{option}</Text>
                <Text style={styles.optionCheck}>
                  {((choiceOpen === 'Theme' && theme === option) ||
                    (choiceOpen === 'Language' && language === option))
                    ? '✓'
                    : ''}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setChoiceOpen('')}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAFBFA',
  },
  page: {
    padding: 18,
    paddingBottom: 36,
    gap: 16,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAFBFA',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6EBF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: NAVY,
    fontSize: 27,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: 29,
    fontWeight: '800',
    color: '#101A57',
  },
  subtitle: {
    fontSize: 14,
    color: '#5D7197',
    marginTop: 4,
  },
  topGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  profileCard: {
    flexGrow: 1,
    flexBasis: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7EFF5',
    padding: 22,
    minHeight: 310,
    shadowColor: '#176C8D',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: BLUE,
    borderWidth: 8,
    borderColor: '#E0EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111A58',
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 15,
    color: '#64759A',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 14,
    backgroundColor: '#D5F8EB',
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: 22,
  },
  roleBadgeText: {
    color: '#087953',
    fontWeight: '800',
  },
  photoButton: {
    marginTop: 15,
    backgroundColor: BLUE,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  photoHint: {
    color: '#71819C',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  accountCard: {
    flexGrow: 2,
    flexBasis: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7EFF5',
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#176C8D',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  sectionIcon: {
    color: BLUE,
    backgroundColor: '#E9F2FF',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 9,
    fontSize: 21,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111A58',
  },
  editButton: {
    backgroundColor: BLUE,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 47,
    borderTopWidth: 1,
    borderTopColor: '#E6EFF9',
  },
  infoIcon: {
    width: 36,
    height: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#EAF2FF',
    color: BLUE,
    fontSize: 19,
    fontWeight: '800',
    paddingTop: 5,
  },
  infoLabel: {
    flex: 0.8,
    color: '#5C6D92',
    fontSize: 12,
  },
  infoValue: {
    flex: 1.3,
    color: '#263A69',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  panel: {
    flexGrow: 1,
    flexBasis: 320,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7EFF5',
    shadowColor: '#176C8D',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  panelTitle: {
    color: '#111A58',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 10,
    minHeight: 69,
    borderWidth: 1,
    borderColor: '#E6EFF9',
    borderRadius: 13,
    marginBottom: 7,
    backgroundColor: '#FBFDFF',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    minHeight: 69,
    borderWidth: 1,
    borderColor: '#E6EFF9',
    borderRadius: 13,
    marginBottom: 7,
    backgroundColor: '#FBFDFF',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 6,
    backgroundColor: '#EAF2FF',
    color: BLUE,
    fontSize: 23,
    fontWeight: '700',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#182456',
    fontWeight: '700',
    fontSize: 13,
  },
  settingSubtitle: {
    color: '#697B9E',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  chevron: {
    color: '#1B3879',
    fontSize: 27,
    paddingHorizontal: 4,
  },
  selectButton: {
    minWidth: 95,
    maxWidth: 125,
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DCE7F5',
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    color: '#263A69',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  muted: {
    color: '#64748B',
  },
  pressed: {
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 28, 55, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101A57',
    marginBottom: 17,
  },
  inputLabel: {
    color: '#3B4E72',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E4F2',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#172554',
    marginBottom: 13,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#718096',
  },
  helpText: {
    fontSize: 11,
    color: '#718096',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    alignItems: 'center',
    padding: 14,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 13,
    marginTop: 5,
  },
  cancelText: {
    color: '#52617A',
    fontWeight: '700',
  },
  optionButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EEF7',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: {
    color: '#263A69',
    fontWeight: '600',
  },
  optionCheck: {
    color: TEAL,
    fontWeight: '800',
  },
  avatarImage: {
  width: '100%',
  height: '100%',
  borderRadius: 66,
},
avatarFallback: {
  fontSize: 68,
  color: '#168BFA',
  fontWeight: '400',
},
});
