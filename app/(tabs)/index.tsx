import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getProfile, getUserRole } from '@/lib/profiles';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';

import {
  getStudentEventStatuses,
  getTeacherEventAttendance,
} from '@/lib/attendance';
import {
  getUpcomingStudentEvent,
  getTeacherEvents,
} from '@/lib/events';
const TEAL = '#0D9DA8';
const DARK_TEAL = '#087E8B';
const LIGHT_AQUA = '#E6F8F8';
const CARD_BORDER = '#D8ECEF';

export default function Index() {
  const { user } = useAuth();
  const [eventStats, setEventStats] = useState({
  total: 0,
  active: 0,
  closed: 0,
});
  const [userRole, setUserRole] = useState<string | null>(null);
  
const [teacherStats, setTeacherStats] = useState({
  present: 0,
  late: 0,
  total: 0,
});

  useEffect(() => {
  let cancelled = false;

  async function loadRole() {
    if (!user) {
      setUserRole(null);
      return;
    }

    try {
      const role = await getUserRole(user.id);

      if (!cancelled) {
        setUserRole(role ?? 'student');
      }
    } catch (error) {
      console.error('Failed to load user role:', error);
    }
  }

  loadRole();

  return () => {
    cancelled = true;
  };
}, [user?.id]);
  const [studentName, setStudentName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshDashboard = async () => {
  if (!user) return;

  setRefreshing(true);

  try {
    const [statuses, event] = await Promise.all([
      getStudentEventStatuses(user.id),
      getUpcomingStudentEvent(),
    ]);

    setAttendanceCounts({
      present: statuses.filter((item) => item.status === 'present').length,
      late: statuses.filter((item) => item.status === 'late').length,
      upcoming: statuses.filter((item) => item.status === 'upcoming').length,
    });

    setUpcomingEvent(event);
  } catch (error) {
    console.error('Failed to refresh dashboard:', error);
  } finally {
    setRefreshing(false);
  }
};
  const [attendanceCounts, setAttendanceCounts] = useState({
  present: 0,
  late: 0,
  upcoming: 0,
});
const [upcomingEvent, setUpcomingEvent] = useState<{
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
} | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStudentName() {
      if (!user) {
        setStudentName('');
        return;
      }

      const profile = await getProfile(user.id);
      const event = await getUpcomingStudentEvent();

if (!cancelled) {
  setUpcomingEvent(event);
}
      
      if (!cancelled && profile?.full_name) {
        setStudentName(profile.full_name.trim());
      }
      getStudentEventStatuses(user.id)
  .then((statuses) => {
    setAttendanceCounts({
      present: statuses.filter((item) => item.status === 'present').length,
      late: statuses.filter((item) => item.status === 'late').length,
      upcoming: statuses.filter((item) => item.status === 'upcoming').length,
    });
  })
  .catch((error) => {
    console.error('Failed to load attendance counts:', error);
  });
    }

    loadStudentName();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);
  
  useEffect(() => {
    let cancelled = false;

    async function loadTeacherStats() {
      if (!user || userRole !== 'teacher') return;

      try {
        const events = await getTeacherEventAttendance(user.id);
        const attendees = events.flatMap((event) => event.attendees);

        if (!cancelled) {
          setTeacherStats({
            present: attendees.filter((item) => item.status === 'present').length,
            late: attendees.filter((item) => item.status === 'late').length,
            total: attendees.length,
          });
        }
      } catch (error) {
        console.error('Failed to load teacher attendance:', error);
      }
    }

    loadTeacherStats();

    return () => {
      cancelled = true;
    };
  }, [user?.id, userRole]);
  useEffect(() => {
  let cancelled = false;

  async function loadEventStats() {
    try {
      const events = await getTeacherEvents();

      if (cancelled) return;

      const now = Date.now();

      const activeEvents = events.filter((event) => {
        if (event.status?.toLowerCase() === 'closed') {
          return false;
        }

        if (!event.start_time || !event.end_time) {
          return event.status?.toLowerCase() === 'active';
        }

        const start = new Date(event.start_time).getTime();
        const end = new Date(event.end_time).getTime();

        return now >= start && now <= end;
      });

      const closedEvents = events.filter(
        (event) =>
          event.status?.toLowerCase() === 'closed' ||
          (!!event.end_time &&
            new Date(event.end_time).getTime() < now)
      );

      setEventStats({
        total: events.length,
        active: activeEvents.length,
        closed: closedEvents.length,
      });
    } catch (error) {
      console.error('Failed to load event counts:', error);
    }
  }

  loadEventStats();

  return () => {
    cancelled = true;
  };
}, []);

  if (userRole === 'teacher') {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Header title="QR Attendance" />
        </View>

        
<View
  style={{
    backgroundColor: '#5fa7ae',
    borderRadius: 16,
    marginHorizontal: 4,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  }}
>
  <Pressable
    onPress={() => router.push('/profile')}
    accessibilityRole="button"
    accessibilityLabel="Open teacher profile"
    style={{
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name="person" size={42} color="#398F89" />
  </Pressable>

  <View style={{ flex: 1 }}>
    <Text style={{ color: '#e6edf3', fontSize: 15 }}>
      Good day,
    </Text>

    <Text style={{ color: 'rgb(255, 255, 255)', fontSize: 26, fontWeight: 'bold' }}>
      {studentName || 'Teacher'}
    </Text>

    <Text style={{ color: '#e6edf3', fontSize: 15 }}>
      Teacher
    </Text>

    <Text style={{ color: '#e6edf3', fontSize: 14, marginTop: 4 }}>
      Ready for your next school event?
    </Text>
  </View>
</View>


<View style={styles.eventStatsRow}>
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="View total events"
    onPress={() => router.push('/teacher')}
    style={[
      styles.eventStatCard,
      { backgroundColor: '#E8F2FF' },
    ]}
  >
    <Ionicons
      name="calendar-outline"
      size={22}
      color="#2875C7"
    />
    <Text style={styles.eventStatLabel}>Total Events</Text>
    <Text
      style={[
        styles.eventStatValue,
        { color: '#2875C7' },
      ]}
    >
      {eventStats.total}
    </Text>
    <Text style={styles.eventStatHint}>View events ›</Text>
  </Pressable>

  <Pressable
    accessibilityRole="button"
    accessibilityLabel="View active events"
    onPress={() => router.push('/teacher')}
    style={[
      styles.eventStatCard,
      { backgroundColor: '#DDF8EA' },
    ]}
  >
    <Ionicons
      name="checkmark-circle-outline"
      size={22}
      color="#16856B"
    />
    <Text style={styles.eventStatLabel}>Active</Text>
    <Text
      style={[
        styles.eventStatValue,
        { color: '#16856B' },
      ]}
    >
      {eventStats.active}
    </Text>
    <Text style={styles.eventStatHint}>View active ›</Text>
  </Pressable>

  <Pressable
    accessibilityRole="button"
    accessibilityLabel="View closed events"
    onPress={() => router.push('/teacher')}
    style={[
      styles.eventStatCard,
      { backgroundColor: '#FFE9EC' },
    ]}
  >
    <Ionicons
      name="lock-closed-outline"
      size={22}
      color="#D9485F"
    />
    <Text style={styles.eventStatLabel}>Closed</Text>
    <Text
      style={[
        styles.eventStatValue,
        { color: '#D9485F' },
      ]}
    >
      {eventStats.closed}
    </Text>
    <Text style={styles.eventStatHint}>View closed ›</Text>
  </Pressable>
</View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionDescription}>
            Choose what you want to do.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Pressable
            style={styles.primaryCard}
            onPress={() => router.push('/teacher')}
          >
            <View style={styles.primaryIcon}>
              <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.primaryTextContainer}>
              <Text style={styles.primaryTitle}>Create Event</Text>
              <Text style={styles.primarySubtitle}>
                Set up a new school event.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={TEAL} />
          </Pressable>

          <Pressable
            style={styles.primaryCard}
            onPress={() => router.push('/teacher')}
          >
            <View style={styles.primaryIcon}>
              <Ionicons name="qr-code-outline" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.primaryTextContainer}>
              <Text style={styles.primaryTitle}>Generate QR</Text>
              <Text style={styles.primarySubtitle}>
                Create or select an event QR code.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={TEAL} />
          </Pressable>

          <Pressable
            style={styles.primaryCard}
            onPress={() => router.push('/history')}
          >
            <View style={styles.primaryIcon}>
              <Ionicons name="people-outline" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.primaryTextContainer}>
              <Text style={styles.primaryTitle}>View Attendance</Text>
              <Text style={styles.primarySubtitle}>
                Review student attendance records.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={TEAL} />
          </Pressable>

          <Pressable
            style={styles.primaryCard}
            onPress={() => router.push('/teacher')}
          >
            <View style={styles.primaryIcon}>
              <Ionicons name="calendar-outline" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.primaryTextContainer}>
              <Text style={styles.primaryTitle}>Event List</Text>
              <Text style={styles.primarySubtitle}>
                View, edit, and manage existing events.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={TEAL} />
          </Pressable>
        </View>
        

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="information-circle-outline" size={24} color={TEAL} />
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>Attendance Summary</Text>
            <Text style={styles.tipDescription}>
              Open View Attendance to see the Present, Late, and Total counts
              for your selected event.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Header title="QR Attendance" />
            <Pressable
              onPress={refreshDashboard}
              disabled={refreshing}
              style={styles.refreshButton}
            >
              <Ionicons
                name="refresh-outline"
                size={22}
                color={refreshing ? '#94A3B8' : '#0D9488'}
              />
            </Pressable>
          </View>
        </View>



       
<Pressable
  style={styles.welcomeCard}
  onPress={() => router.push('/profile')}
  accessibilityRole="button"
  accessibilityLabel="Open student profile"
>  <View style={styles.studentAvatar}>
  <Ionicons name="person" size={32} color="#0D9488" />
 </View>
  <View style={styles.welcomeTextContainer}>
    <Text style={styles.welcomeLabel}>WELCOME BACK,</Text>
    <Text style={styles.welcomeTitle}>
      {studentName || 'Student'}
    </Text>
    <Text style={styles.welcomeSubtitle}>
      Ready for your next school event?
    </Text>
  </View>

  <Pressable
    style={styles.welcomeIcon}
    onPress={() => router.push('/scan')}
    accessibilityRole="button"
    accessibilityLabel="Scan event QR code"
  >
    <Ionicons name="qr-code-outline" size={36} color="#FFFFFF" />
  </Pressable>
</Pressable>
                <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{attendanceCounts.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{attendanceCounts.late}</Text>
            <Text style={styles.statLabel}>late</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{attendanceCounts.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>
        
       
        <Pressable
          style={styles.upcomingEventCard}
          onPress={() => router.push('/history')}
        >
          <View style={styles.upcomingEventIcon}>
            <Ionicons name="calendar-outline" size={24} color="#0D9488" />
          </View>

          <View style={styles.upcomingEventText}>
            <Text style={styles.upcomingEventLabel}>UPCOMING EVENT</Text>

            <Text style={styles.upcomingEventTitle}>
              {upcomingEvent?.title ?? 'No upcoming events'}
            </Text>

            {upcomingEvent?.start_time ? (
              <Text style={styles.upcomingEventDate}>
                {new Date(upcomingEvent.start_time).toLocaleString()}
              </Text>
            ) : (
              <Text style={styles.upcomingEventDate}>
                Check back later for new events.
              </Text>
            )}

            <Text style={styles.upcomingEventDate}>
              Tap to view attendance history
            </Text>
          </View>
        </Pressable>
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
  <AppButton
    title="Scan QR Code"
    icon="qr-code-outline"
    onPress={() => router.push('/scan')}
  />
</View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  headerContainer: {
  paddingHorizontal: 16,
  paddingTop: 4,
  paddingBottom: 8,
},
headerContent: {
  position: 'relative',
},
refreshButton: {
  position: 'absolute',
  right: 8,
  top: 8,
  padding: 10,
  zIndex: 1,
},
  welcomeCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    padding: 20,
    minHeight: 160,
    borderRadius: 22,
    backgroundColor: DARK_TEAL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  welcomeTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeLabel: {
    color: '#B8F3F0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#E5FAFA',
    fontSize: 13,
    lineHeight: 19,
  },
  welcomeIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#17334B',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 5,
  },
  sectionDescription: {
    color: '#71849A',
    fontSize: 13,
  },
  primaryCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: LIGHT_AQUA,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  primaryTextContainer: {
    flex: 1,
  },
  primaryTitle: {
    color: '#17334B',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },
  primarySubtitle: {
    color: '#60788D',
    fontSize: 12,
    lineHeight: 17,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: LIGHT_AQUA,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    color: '#17334B',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  tipDescription: {
    color: '#71849A',
    fontSize: 12,
    lineHeight: 18,
  },
    statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCEFEF',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#134E4A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
    upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D8ECEF',
  },
  upcomingEventIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E6F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upcomingEventText: {
    flex: 1,
  },
  upcomingEventLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginBottom: 6,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#134E4A',
    marginBottom: 4,
  },
  upcomingEventDate: {
    fontSize: 12,
    color: '#64748B',
  },
  studentAvatar: {
  width: 58,
  height: 58,
  borderRadius: 29,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},

  eventStatsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  eventStatCard: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 12,
    gap: 5,
  },
  eventStatLabel: {
    fontSize: 12,
    color: '#344054',
  },
  eventStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventStatHint: {
    fontSize: 10,
    color: '#667085',
    marginTop: 4,
  },

});