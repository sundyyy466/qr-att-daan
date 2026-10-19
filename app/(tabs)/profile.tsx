import { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  

  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const router = useRouter();
  const handleChangePhoto = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permission needed',
      'Please allow gallery access to choose a profile photo.'
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]?.uri) {
    setProfilePhoto(result.assets[0].uri);
  }
};

  const loadProfile = useCallback(async () => {
    if (!user) return;

    const p = await getProfile(user.id);

    setProfile(p);
    setDraftName(p?.full_name ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: draftName.trim(),
            }
          : prev
      );

      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Failed to sign out.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
     {user && (
  <>
    <View style={styles.profileHeader}>
      <Pressable
  style={styles.avatarWrapper}
  onPress={async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  }}
  accessibilityRole="button"
  accessibilityLabel="Change profile photo"
>
  {avatarUri ? (
    <Image
      source={{ uri: avatarUri }}
      style={styles.avatar}
    />
  ) : (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {(profile?.full_name || user.email || 'S')
          .charAt(0)
          .toUpperCase()}
      </Text>
    </View>
  )}

  <View style={styles.avatarBadge}>
    <Ionicons name="camera" size={15} color="#FFFFFF" />
  </View>
</Pressable>

      <Text style={styles.profileName}>
        {profile?.full_name || 'Student Name'}
      </Text>

      <Text style={styles.profileSubtitle}>
  {profile?.role === 'teacher'
    ? 'Teacher'
    : profile?.role === 'administrator'
    ? 'Administrator'
    : 'Student'}
</Text>

      <Text style={styles.profileEmail}>
  {profile?.email || user.email}
</Text>

<Text style={styles.profileUserIdLabel}>User ID</Text>
<Text style={styles.profileUserId}>
  {user.id}
</Text>
    </View>
        </>
      )}

    
<Pressable
  onPress={() => {
    setDraftName(profile?.full_name ?? '');
    setEditing(true);
  }}
  style={styles.settingsRow}
  accessibilityRole="button"
>
  <View style={styles.settingsIcon}>
    <Ionicons
      name="person-outline"
      size={20}
      color={COLORS.primary}
    />
  </View>

  <Text style={styles.settingsText}>Edit Profile</Text>

  <Ionicons
    name="chevron-forward"
    size={20}
    color={COLORS.textSecondary}
  />
</Pressable>

{editing && (
  <View style={styles.editForm}>
    <Text style={styles.editLabel}>Full Name</Text>

    <TextInput
      style={styles.editInput}
      value={draftName}
      onChangeText={setDraftName}
      placeholder="Enter your full name"
      autoCapitalize="words"
    />

    <View style={styles.editButtons}>
      <Pressable
        style={styles.cancelButton}
        onPress={() => {
          setDraftName(profile?.full_name ?? '');
          setEditing(false);
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>

      <Pressable
        style={styles.saveButton}
        onPress={handleSaveName}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </Pressable>
    </View>
  </View>
)}


<Pressable
  onPress={() => router.push('/settings')}
  style={styles.settingsRow}
  accessibilityRole="button"
>
  <View style={styles.settingsIcon}>
    <Ionicons
      name="settings-outline"
      size={20}
      color={COLORS.primary}
    />
  </View>

  <Text style={styles.settingsText}>Settings</Text>

  <Ionicons
    name="chevron-forward"
    size={20}
    color={COLORS.textSecondary}
  />
</Pressable>

<AppButton
  title="Sign Out"
  icon="log-out-outline"
  onPress={handleSignOut}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },

  roleBadgeStudent: {
    backgroundColor: '#607D8B',
  },

  roleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },

  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  editHint: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  nameInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
  alignItems: 'center',
  backgroundColor: COLORS.card,
  borderRadius: 20,
  padding: 24,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: COLORS.border,
},
avatar: {
  width: 88,
  height: 88,
  borderRadius: 44,
  backgroundColor: '#DDF5F5',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
},
avatarText: {
  fontSize: 36,
  fontWeight: '800',
  color: COLORS.primary,
},
profileName: {
  fontSize: 21,
  fontWeight: '800',
  color: COLORS.textPrimary,
  textAlign: 'center',
  marginBottom: 4,
},
profileSubtitle: {
  fontSize: 13,
  color: COLORS.textSecondary,
  marginBottom: 5,
},
profileEmail: {
  fontSize: 13,
  color: COLORS.textSecondary,
  textAlign: 'center',
},
settingsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.card,
  borderRadius: 14,
  padding: 14,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: COLORS.border,
},

settingsIcon: {
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: COLORS.background,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},

settingsText: {
  flex: 1,
  fontSize: 15,
  fontWeight: '600',
  color: COLORS.textPrimary,
},

  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },

  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: 4,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E4F5EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },

  studentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#39775D',
  },
  profileUserIdLabel: {
  fontSize: 12,
  color: COLORS.textSecondary,
  marginTop: 10,
},

profileUserId: {
  fontSize: 11,
  color: COLORS.textSecondary,
  textAlign: 'center',
  marginTop: 3,
},

editForm: {
  backgroundColor: COLORS.card,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
},
editLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.textPrimary,
  marginBottom: 8,
},
editInput: {
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: COLORS.textPrimary,
  marginBottom: 14,
},
editButtons: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 10,
},
cancelButton: {
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: COLORS.border,
},
cancelButtonText: {
  color: COLORS.textPrimary,
  fontWeight: '600',
},

});