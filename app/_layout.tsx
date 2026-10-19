import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  const [role, setRole] = useState<Role | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!session?.user) {
        setRole(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const profile = await getProfile(session.user.id);

      if (active) {
        setRole(profile?.role ?? null);
        setProfileLoading(false);
      }
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const path = segments[0];
  const inAuthGroup = path === 'login' || path === 'register';
  const inTabsGroup = path === '(tabs)';
  const inAdminGroup = path === 'admin';

  if (!session) {
    if (inTabsGroup || inAdminGroup) {
      return <Redirect href="/login" />;
    }
  } else {
    if (inAuthGroup) {
      if (role === 'administrator') {
        return <Redirect href="/admin" />;
      }

      if (role === 'student' || role === 'teacher') {
        return <Redirect href="/(tabs)" />;
      }
    }

    if (inAdminGroup && role !== 'administrator') {
      return <Redirect href="/(tabs)" />;
    }

    if (inTabsGroup && role === 'administrator') {
      return <Redirect href="/admin" />;
    }

    if (!role) {
      return <Redirect href="/login" />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
