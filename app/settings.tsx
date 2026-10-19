import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [showTips, setShowTips] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#17334B" />
        <Text style={styles.backText}>Back to Profile</Text>
      </Pressable>

      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Customize your QR Attendance experience.
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name="notifications-outline" size={22} color="#087E8B" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.rowTitle}>Attendance Tips</Text>
            <Text style={styles.description}>
              Show helpful reminders while using the app.
            </Text>
          </View>
          <Switch value={showTips} onValueChange={setShowTips} />
        </View>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={20} color="#087E8B" />
        <Text style={styles.noteText}>
          Your setting is temporary and resets when this screen is reopened.
          No database changes are made.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBFC',
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: '#17334B',
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#17334B',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 14,
    color: '#71849A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8ECEF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E6F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17334B',
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#71849A',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#E6F8F8',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#36566B',
  },
});
