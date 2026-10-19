import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';

type Stats = {
  users: number;
  events: number;
  attendance: number;
};

const TEAL = '#08A9B8';
const DARK_TEAL = '#087E8B';
const PAGE = '#F3FAFA';

export default function AdminDashboard() {
  const [profileImage, setProfileImage] = useState<string | null>(null);

useEffect(() => {
  async function loadSavedImage() {
    try {
      const savedImage =
        await AsyncStorage.getItem('admin_profile_image');

      setProfileImage(savedImage);
    } catch (error) {
      console.error('Unable to load dashboard avatar:', error);
    }
  }

  loadSavedImage();
}, []);
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    events: 0,
    attendance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setError('');

    try {
      const [usersResult, eventsResult, attendanceResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('events')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true }),
        ]);

      const problem =
        usersResult.error ||
        eventsResult.error ||
        attendanceResult.error;

      if (problem) throw problem;

      setStats({
        users: usersResult.count ?? 0,
        events: eventsResult.count ?? 0,
        attendance: attendanceResult.count ?? 0,
      });
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setError(
        'Unable to load dashboard data. Check your database permissions.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

 const cards = [
  {
    title: 'Total Users',
    value: stats.users,
    icon: 'people-outline' as const,
    color: '#2678DB',
    caption: 'Registered accounts',
    route: '/admin/users' as const,
  },
  {
    title: 'Total Events',
    value: stats.events,
    icon: 'calendar-outline' as const,
    color: '#2875C7',
    caption: 'School events',
    route: '/admin/events' as const,
  },
  {
    title: 'Attendance Records',
    value: stats.attendance,
    icon: 'checkmark-circle-outline' as const,
    color: '#16856B',
    caption: 'Recorded scans',
    route: '/admin/attendance' as const,
  },
];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadStats();
          }}
          colors={[TEAL]}
        />
      }
    >
      <View style={styles.topHeader}>
        <View style={styles.brandIcon}>
          <Ionicons name="grid-outline" size={27} color={TEAL} />
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>QR-ATT</Text>
          <Text style={styles.brandSubtitle}>Administration</Text>
        </View>

        <View style={styles.adminPill}>
          <Ionicons name="shield-checkmark" size={16} color={DARK_TEAL} />
          <Text style={styles.adminPillText}>Administrator</Text>
        </View>
      </View>

      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Admin Dashboard</Text>
        <Text style={styles.pageSubtitle}>
          QR-ATT | Administration
        </Text>
      </View>


<View style={styles.welcome}>
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Open administrator profile"
    onPress={() => router.push('/admin/profile')}
    style={styles.avatar}
  >
    {profileImage ? (
      <Image
        source={{ uri: profileImage }}
        style={styles.avatarImage}
      />
    ) : (
      <Ionicons
        name="person-outline"
        size={31}
        color="#FFFFFF"
      />
    )}
  </Pressable>

  <View style={styles.welcomeText}>
    <Text style={styles.welcomeGreeting}>Welcome back,</Text>
    <Text style={styles.welcomeTitle}>Administrator</Text>
    <Text style={styles.welcomeDescription}>
      Manage users, events, attendance, and reports.
    </Text>
  </View>

  <View style={styles.welcomeGraphic}>
    <Ionicons
      name="bar-chart-outline"
      size={38}
      color="#FFFFFF"
    />
  </View>
</View>


      {loading ? (
        <ActivityIndicator
          size="large"
          color={TEAL}
          style={styles.loader}
        />
      ) : (
        <>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#B42318"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.grid}>
{cards.map((card) => (
  <Pressable
    key={card.title}
    style={[
  styles.card,
  {
    width: width >= 900 ? '31%' : width >= 600 ? '47%' : '100%',
    flexGrow: 0,
  },
]}
    onPress={() => router.push(card.route)}
    accessibilityRole="button"
  >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${card.color}18` },
                  ]}
                >
                  <Ionicons
                    name={card.icon}
                    size={25}
                    color={card.color}
                  />
                </View>

                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text
                  style={[
                    styles.cardValue,
                    { color: card.color },
                  ]}
                >
                  {card.value}
                </Text>
                <Text style={styles.cardCaption}>
                  {card.caption}
                </Text>
               </Pressable>
))}
          </View>

          <Pressable
  style={styles.overview}
  onPress={() => router.push('/admin/reports')}
  accessibilityRole="button"
  accessibilityLabel="Open admin reports"
>
            <View style={styles.overviewIcon}>
              <Ionicons
                name="analytics-outline"
                size={28}
                color={DARK_TEAL}
              />
            </View>

            <View style={styles.overviewText}>
              <Text style={styles.overviewTitle}>System Overview</Text>
              <Text style={styles.overviewDescription}>
                Your dashboard summarizes the users, school events,
                and attendance records currently available in Supabase.
              </Text>
            </View>
          </Pressable>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name="checkmark-circle"
                size={21}
                color="#16856B"
              />
              <Text style={styles.statusTitle}>Database Summary</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Registered users</Text>
              <Text style={styles.statusValue}>{stats.users}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>School events</Text>
              <Text style={styles.statusValue}>{stats.events}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Attendance records</Text>
              <Text style={styles.statusValue}>{stats.attendance}</Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.footer}>
        QR-ATT Administration
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE,
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingVertical: 8,
  },
  brandIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: '#DDF8F7',
    borderWidth: 1,
    borderColor: '#BDEDEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    marginLeft: 10,
    flex: 1,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#12334A',
    letterSpacing: 0.4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#E1F6F3',
  },
  adminPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK_TEAL,
  },
  pageHeading: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#102F49',
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  welcome: {
padding: 24,
  borderRadius: 20,
  backgroundColor: '#32818E',
  borderWidth: 0,
  marginBottom: 24,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 120,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 12,
    color: '#D5F6F3',
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  welcomeDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#E3FAF8',
    marginTop: 5,
  },
  welcomeGraphic: {
    marginLeft: 8,
    opacity: 0.85,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17334B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loader: {
    marginTop: 35,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    minHeight: 165,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBEA',
    shadowColor: '#12334A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  iconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  cardTitle: {
    fontSize: 12,
    color: '#61758A',
  },
  cardValue: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  cardCaption: {
    fontSize: 11,
    color: '#71849A',
    marginTop: 4,
  },
  overview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBEA',
  },
  overviewIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF8F5',
  },
  overviewText: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17334B',
    marginBottom: 6,
  },
  overviewDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#71849A',
  },
  statusCard: {
    marginTop: 15,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBEA',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#17334B',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF3F3',
  },
  statusLabel: {
    fontSize: 13,
    color: '#61758A',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#17334B',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 11,
    color: '#82949F',
  },
  avatarImage: {
  width: '100%',
  height: '100%',
  borderRadius: 28,
},
});
