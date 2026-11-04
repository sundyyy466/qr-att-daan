
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getStudentEventStatuses,
  getTeacherEventAttendance,
  type StudentEventStatus,
} from '@/lib/attendance';
import { getUserRole } from '@/lib/profiles';

type FilterStatus = 'all' | 'present' | 'late' | 'upcoming';

export default function HistoryScreen() {
  const { user } = useAuth();

  const [records, setRecords] = useState<StudentEventStatus[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState<
  Awaited<ReturnType<typeof getTeacherEventAttendance>>
>([]);
const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
const [studentSearch, setStudentSearch] = useState('');

  const loadHistory = useCallback(async (isPullToRefresh = false) => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

setLoading(!isPullToRefresh);
setError('');

    try {
      const userRole = await getUserRole(user.id);
      setRole(userRole);
      if (userRole === 'teacher') {
  const result = await getTeacherEventAttendance(user.id);
  setTeacherAttendance(result);

  if (result.length > 0 && !selectedEventId) {
    setSelectedEventId(result[0].eventId);
  } else if (result.length === 0) {
    setSelectedEventId(null);
  }
}

      if (userRole === 'student') {
        const result = await getStudentEventStatuses(user.id);
        setRecords(result);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Student history loading error:', err);
      setError('Could not load attendance. Please try again.');
} finally {
  setLoading(false);
  setRefreshing(false);
}
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

 const filteredRecords = records.filter((record) => {
  const matchesFilter =
    filter === 'all' || record.status === filter;

  const matchesSearch = record.eventTitle
    .toLowerCase()
    .includes(searchQuery.trim().toLowerCase());

  return matchesFilter && matchesSearch;
});
const selectedAttendance = teacherAttendance.find(
  (item) => item.eventId === selectedEventId
);
const selectedTeacherAttendees =
  selectedAttendance?.attendees ?? [];

const teacherPresentCount = selectedTeacherAttendees.filter(
  (attendee) => attendee.status === 'present'
).length;

const teacherLateCount = selectedTeacherAttendees.filter(
  (attendee) => attendee.status === 'late'
).length;

const teacherTotalCount = selectedTeacherAttendees.length;

const presentCount = records.filter(
  (record) => record.status === 'present'
).length;

const lateCount = records.filter(
  (record) => record.status === 'late'
).length;

const totalCount = presentCount + lateCount;


const upcomingCount = records.filter(
  (record) => record.status === 'upcoming'
).length;
const studentPresentCount = records.filter(
  (record) => record.status === 'present'
).length;

const studentLateCount = records.filter(
  (record) => record.status === 'late'
).length;

const studentTotalCount = studentPresentCount + studentLateCount;
const allStudentsForEvent = teacherAttendance.length
  ? teacherAttendance
      .find((item) => item.eventId === selectedEventId)
      ?.attendees ?? []
  : [];

const filteredTeacherStudents = allStudentsForEvent.filter(
  (student) =>
    student.studentName
      .toLowerCase()
      .includes(studentSearch.trim().toLowerCase())
);


  if (role === 'teacher') {
  const selectedEvent = teacherAttendance.find(
    (item) => item.eventId === selectedEventId
  );

  const attendees = selectedEvent?.attendees ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TEACHER RECORDS</Text>
      <Text style={styles.title}>Attendance List</Text>
      <Text style={styles.subtitle}>
        View student attendance for your events.
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>Loading attendance...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : teacherAttendance.length === 0 ? (
        <Text style={styles.message}>
          No events found for your account.
        </Text>
      ) : (
        <>
          <FlatList
            horizontal
            data={teacherAttendance}
            keyExtractor={(item) => item.eventId}
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 16 }}
            renderItem={({ item }) => (
              <Text
                onPress={() => setSelectedEventId(item.eventId)}
                style={{
                  padding: 12,
                  marginRight: 8,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor:
                    selectedEventId === item.eventId
                      ? COLORS.primary
                      : '#FFFFFF',
                  color:
                    selectedEventId === item.eventId
                      ? '#FFFFFF'
                      : COLORS.textPrimary,
                  fontWeight: '700',
                }}
              >
                {item.title}
              </Text>
            )}
          />

          <Text style={styles.eventTitle}>
            {selectedEvent?.title ?? 'Select an event'}
          </Text>
          <Text style={styles.eventDate}>
            {selectedEvent?.startTime
              ? new Date(selectedEvent.startTime).toLocaleString()
              : 'Date not set'}
          </Text>
          <Text style={styles.eventDate}>
            Venue: {selectedEvent?.venue || 'Not specified'}
          </Text>

          <View style={styles.summaryRow}>
  <View style={styles.summaryCard}>
    <Text style={styles.summaryNumber}>{teacherPresentCount}</Text>
    <Text style={styles.summaryLabel}>Present</Text>
  </View>

  <View style={styles.summaryCard}>
    <Text style={[styles.summaryNumber, styles.absentText]}>
      {teacherLateCount}
    </Text>
    <Text style={styles.summaryLabel}>Late</Text>
  </View>

  <View style={styles.summaryCard}>
    <Text style={[styles.summaryNumber, styles.upcomingText]}>
      {teacherTotalCount}
    </Text>
    <Text style={styles.summaryLabel}>Total</Text>
  </View>
</View>

          <TextInput
            style={styles.searchInput}
            value={studentSearch}
            onChangeText={setStudentSearch}
            placeholder="Search student name..."
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
          />

          <FlatList
            data={filteredTeacherStudents}
            refreshControl={
  <RefreshControl
    refreshing={refreshing}
    onRefresh={() => {
      setRefreshing(true);
      loadHistory(true);
    }}
    tintColor={COLORS.primary}
    colors={[COLORS.primary]}
  />
}
            keyExtractor={(item) => item.studentId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>
                    {item.studentName}
                  </Text>
                  <Text style={[styles.badge, styles.presentBadge]}>
                    Present
                  </Text>
                  <Text style={styles.eventDate}>
                    Scanned: {new Date(item.scannedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.message}>
                No scanned students found.
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}

if (role && role !== 'student') {
  return null;
}

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>YOUR RECORDS</Text>
      <Text style={styles.title}>Attendance History</Text>
      <Text style={styles.subtitle}>
        See your attendance status for school events.
      </Text>
      <TextInput
  style={styles.searchInput}
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search events..."
  placeholderTextColor={COLORS.textSecondary}
  accessibilityLabel="Search attendance by event name"
  autoCapitalize="none"
  clearButtonMode="while-editing"
/>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>

        <View style={styles.summaryCard}>
  <Text style={[styles.summaryNumber, styles.absentText]}>
    {lateCount}
  </Text>
  <Text style={styles.summaryLabel}>Late</Text>
</View>

        <View style={styles.summaryCard}>
  <Text style={[styles.summaryNumber, styles.upcomingText]}>
    {totalCount}
  </Text>
  <Text style={styles.summaryLabel}>Total</Text>
</View>
      </View>

      <View style={styles.filters}>
        {(['all', 'present', 'late', 'upcoming'] as const).map((item) => (
          <Text
            key={item}
            onPress={() => setFilter(item)}
            accessibilityRole="button"
            style={[
              styles.filterButton,
              filter === item && styles.activeFilter,
              filter === item && styles.activeFilterText,
            ]}
          >
            {item === 'all'
              ? 'All'
              : item.charAt(0).toUpperCase() + item.slice(1)}
          </Text>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>Loading attendance...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredRecords.length === 0 ? (
        <Text style={styles.message}>
          {records.length === 0
            ? 'No events to display yet.'
            : 'No events match this filter.'}
        </Text>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.eventId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
  <RefreshControl
    refreshing={refreshing}
    onRefresh={() => {
      setRefreshing(true);
      loadHistory();
    }}
    tintColor={COLORS.primary}
    colors={[COLORS.primary]}
  />
}
          renderItem={({ item }) => {
            const badgeStyle =
              item.status === 'present'
                ? styles.presentBadge
                : item.status === 'late'
                  ? styles.absentBadge
                  : styles.upcomingBadge;

            return (
              <View style={styles.card}>
                <View style={styles.eventIcon}>
                  <Text style={styles.eventIconText}>▦</Text>
                </View>

                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{item.eventTitle}</Text>
                  <Text style={styles.eventDate}>
                    {item.eventDate
                      ? new Date(item.eventDate).toLocaleString()
                      : 'Date not set'}
                  </Text>
                  <View style={[styles.badge, badgeStyle]}>
                    <Text style={styles.badgeText}>
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF9',
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 18,
    lineHeight: 19,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E3ECE8',
  },
  summaryNumber: {
    color: '#188653',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  absentText: {
    color: '#D64545',
  },
  upcomingText: {
    color: '#2879C7',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexGrow: 1,
    textAlign: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    color: COLORS.textSecondary,
    borderColor: '#DCE6E2',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  activeFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E2ECE8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E6F6F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIconText: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: '700',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 9,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presentBadge: {
    backgroundColor: '#DDF6E8',
  },
  absentBadge: {
    backgroundColor: '#FCE5E5',
  },
  upcomingBadge: {
    backgroundColor: '#E3F0FF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#253746',
  },
  center: {
    alignItems: 'center',
    marginTop: 35,
    gap: 10,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 21,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    marginTop: 24,
  },
  searchInput: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#DCE6E2',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: COLORS.textPrimary,
  marginBottom: 16,
},
});
