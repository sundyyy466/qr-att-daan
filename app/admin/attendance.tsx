
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';

type AttendanceRecord = {
  id: string;
  student_id: string;
  event_id: string;
  scanned_at: string;
  status?: string | null;
  studentName: string;
  eventTitle: string;
};

type EventOption = {
  id: string;
  title: string;
};

const TEAL = '#08A9B8';
const DARK_TEAL = '#087E8B';
const PAGE = '#F3FAFA';

export default function AdminAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [eventFilterOpen, setEventFilterOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<AttendanceRecord | null>(null);

  const loadAttendance = useCallback(async () => {
    setError('');

    try {
      const [attendanceResult, eventsResult, profilesResult] =
        await Promise.all([
          supabase
            .from('attendance')
            .select('id, student_id, event_id, scanned_at, status')
            .order('scanned_at', { ascending: false }),

          supabase
            .from('events')
            .select('id, title'),

          supabase
            .from('profiles')
            .select('id, full_name'),
        ]);

      if (attendanceResult.error) throw attendanceResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const eventRows = eventsResult.data ?? [];
      const profileRows = profilesResult.data ?? [];
      const attendanceRows = attendanceResult.data ?? [];

      const eventMap = new Map<string, string>(
        eventRows.map((event) => [
          event.id,
          event.title || 'Untitled event',
        ])
      );

      const profileMap = new Map<string, string>(
        profileRows.map((profile) => [
          profile.id,
          profile.full_name || 'Unnamed student',
        ])
      );

      setEvents(
        eventRows.map((event) => ({
          id: event.id,
          title: event.title || 'Untitled event',
        }))
      );

      setRecords(
        attendanceRows.map((record) => ({
          ...record,
          studentName:
            profileMap.get(record.student_id) || 'Unknown student',
          eventTitle:
            eventMap.get(record.event_id) || 'Unknown event',
        }))
      );
    } catch (err) {
      console.error('Admin attendance error:', err);
      setError(
        'Unable to load attendance. Check Supabase permissions and the profiles/events table columns.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesEvent =
        selectedEventId === 'all' ||
        record.event_id === selectedEventId;

      const matchesSearch =
        !query ||
        record.studentName.toLowerCase().includes(query) ||
        record.eventTitle.toLowerCase().includes(query) ||
        record.student_id.toLowerCase().includes(query);

      return matchesEvent && matchesSearch;
    });
  }, [records, search, selectedEventId]);

  const selectedEventTitle =
    selectedEventId === 'all'
      ? 'All Events'
      : events.find((event) => event.id === selectedEventId)?.title ||
        'Selected Event';

  const renderRecord = ({ item }: { item: AttendanceRecord }) => {
    const isAbsent = item.status?.toLowerCase() === 'absent';
    const statusLabel = isAbsent ? 'Absent' : 'Present';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => setSelectedRecord(item)}
        accessibilityRole="button"
        accessibilityLabel={`View attendance details for ${item.studentName}, ${item.eventTitle}`}
        accessibilityHint="Opens the full attendance record"
      >
        <View style={styles.cardIcon}>
          <Ionicons
            name="calendar-outline"
            size={23}
            color="#3478F6"
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeading}>
            <Text style={styles.recordTitle} numberOfLines={2}>
              {item.studentName}
            </Text>

            <View
              style={[
                styles.badge,
                isAbsent ? styles.absentBadge : styles.presentBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isAbsent
                    ? styles.absentBadgeText
                    : styles.presentBadgeText,
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.eventName} numberOfLines={2}>
            {item.eventTitle}
          </Text>

          <Text style={styles.detail}>
            Student ID: {item.student_id}
          </Text>

          <Text style={styles.detail}>
            Scanned at: {new Date(item.scanned_at).toLocaleString()}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.openHint}>View details</Text>
            <Ionicons
              name="chevron-forward"
              size={17}
              color={DARK_TEAL}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAttendance();
            }}
            colors={[TEAL]}
          />
        }
      >
        <View style={styles.topHeader}>
          <View style={styles.brandIcon}>
            <Ionicons name="grid-outline" size={25} color={TEAL} />
          </View>

          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>QR-ATT</Text>
            <Text style={styles.brandSubtitle}>Administration</Text>
          </View>

          <View style={styles.headerLabel}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={DARK_TEAL}
            />
            <Text style={styles.headerLabelText}>Admin</Text>
          </View>
        </View>

        <View style={styles.pageHeading}>
          <Text style={styles.heading}>Overall Attendance</Text>
          <Text style={styles.subtitle}>
            Search and manage attendance records across QR-ATT events.
          </Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="people-outline" size={29} color="#FFFFFF" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Total Records</Text>
            <Text style={styles.summaryValue}>
              {loading ? '—' : records.length}
            </Text>
          </View>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={39}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.controls}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#7B8794" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search student name or event..."
              placeholderTextColor="#8995A3"
              accessibilityLabel="Search attendance by student name, event, or student ID"
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          <Pressable
            style={styles.eventPicker}
            onPress={() => setEventFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Filter events. Current selection: ${selectedEventTitle}`}
          >
            <Ionicons name="filter-outline" size={18} color={DARK_TEAL} />
            <Text style={styles.eventPickerText} numberOfLines={1}>
              {selectedEventTitle}
            </Text>
            <Ionicons name="chevron-down" size={17} color={DARK_TEAL} />
          </Pressable>
        </View>

        <Text style={styles.resultsText}>
          Showing {filteredRecords.length} of {records.length} records
        </Text>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.stateText}>Loading attendance...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={23}
              color="#B42318"
            />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={loadAttendance}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item.id}
            renderItem={renderRecord}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons
                  name="file-tray-outline"
                  size={38}
                  color="#8A98A8"
                />
                <Text style={styles.emptyTitle}>
                  No attendance records found
                </Text>
                <Text style={styles.empty}>
                  {records.length === 0
                    ? 'Attendance records will appear here after students scan event QR codes.'
                    : 'Try another search or choose All Events.'}
                </Text>
                {search || selectedEventId !== 'all' ? (
                  <Pressable
                    style={styles.resetButton}
                    onPress={() => {
                      setSearch('');
                      setSelectedEventId('all');
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.resetButtonText}>
                      Clear filters
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            }
          />
        )}
      </ScrollView>

      <Modal
        visible={eventFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEventFilterOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEventFilterOpen(false)}
        >
          <Pressable
            style={styles.filterModal}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>Filter by Event</Text>
            <ScrollView style={styles.eventOptions}>
              <Pressable
                style={styles.eventOption}
                onPress={() => {
                  setSelectedEventId('all');
                  setEventFilterOpen(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.eventOptionText}>All Events</Text>
                {selectedEventId === 'all' ? (
                  <Ionicons name="checkmark-circle" size={21} color={TEAL} />
                ) : null}
              </Pressable>

              {events.map((event) => (
                <Pressable
                  key={event.id}
                  style={styles.eventOption}
                  onPress={() => {
                    setSelectedEventId(event.id);
                    setEventFilterOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.eventOptionText}>
                    {event.title}
                  </Text>
                  {selectedEventId === event.id ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={TEAL}
                    />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.closeButton}
              onPress={() => setEventFilterOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={selectedRecord !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={26}
                  color={TEAL}
                />
              </View>
              <View style={styles.detailHeaderText}>
                <Text style={styles.modalTitle}>Attendance Details</Text>
                <Text style={styles.detailSubtitle}>
                  Full attendance record
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedRecord(null)}
                accessibilityRole="button"
                accessibilityLabel="Close attendance details"
                hitSlop={10}
              >
                <Ionicons name="close-circle-outline" size={27} color="#64748B" />
              </Pressable>
            </View>

            {selectedRecord ? (
              <View style={styles.detailRows}>
                <Text style={styles.detailLabel}>Student</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.studentName}
                </Text>

                <Text style={styles.detailLabel}>Event</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.eventTitle}
                </Text>

                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    selectedRecord.status?.toLowerCase() === 'absent'
                      ? styles.absentValue
                      : styles.presentValue,
                  ]}
                >
                  {selectedRecord.status
                    ? selectedRecord.status.charAt(0).toUpperCase() +
                      selectedRecord.status.slice(1)
                    : 'Present'}
                </Text>

                <Text style={styles.detailLabel}>Student ID</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.student_id}
                </Text>

                <Text style={styles.detailLabel}>Event ID</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.event_id}
                </Text>

                <Text style={styles.detailLabel}>Scanned at</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedRecord.scanned_at).toLocaleString()}
                </Text>

                <Text style={styles.detailLabel}>Record ID</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.id}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedRecord(null)}
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    padding: 16,
    paddingBottom: 32,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    gap: 10,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDEFEF',
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163447',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#6B7D8D',
    marginTop: 2,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DFF6F2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerLabelText: {
    color: DARK_TEAL,
    fontSize: 12,
    fontWeight: '700',
  },
  pageHeading: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#172B4D',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#718096',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDEEFF',
    borderRadius: 18,
    padding: 19,
    marginBottom: 18,
    gap: 14,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#86C7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#315B88',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 31,
    fontWeight: '800',
    color: '#173C7A',
    marginTop: 2,
  },
  controls: {
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE5EC',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 45,
    fontSize: 14,
    color: '#263747',
    paddingVertical: 8,
  },
  eventPicker: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE5EC',
  },
  eventPickerText: {
    flex: 1,
    color: '#34495E',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsText: {
    fontSize: 12,
    color: '#748396',
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E9EF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#163447',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.75,
    borderColor: '#91D8D5',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E9F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  recordTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#1B2B4B',
  },
  eventName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#41566B',
  },
  detail: {
    fontSize: 11,
    lineHeight: 16,
    color: '#77869A',
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presentBadge: {
    backgroundColor: '#D9F7E8',
  },
  absentBadge: {
    backgroundColor: '#FDE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  presentBadgeText: {
    color: '#137A4B',
  },
  absentBadgeText: {
    color: '#B42318',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  openHint: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK_TEAL,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 12,
  },
  stateText: {
    color: '#64748B',
    fontSize: 14,
  },
  errorBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
    gap: 10,
  },
  errorText: {
    color: '#B42318',
    textAlign: 'center',
    lineHeight: 21,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#B42318',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 35,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyTitle: {
    color: '#263747',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    lineHeight: 21,
    color: '#718096',
    fontSize: 13,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#DFF6F2',
    borderRadius: 10,
    marginTop: 4,
  },
  resetButtonText: {
    color: DARK_TEAL,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  filterModal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B2B4B',
  },
  eventOptions: {
    marginTop: 12,
  },
  eventOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F5',
    paddingVertical: 10,
  },
  eventOptionText: {
    flex: 1,
    color: '#34495E',
    fontSize: 14,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_TEAL,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  detailModal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 19,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 18,
  },
  detailIcon: {
    width: 47,
    height: 47,
    borderRadius: 13,
    backgroundColor: '#DFF6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderText: {
    flex: 1,
  },
  detailSubtitle: {
    color: '#718096',
    fontSize: 12,
    marginTop: 3,
  },
  detailRows: {
    gap: 6,
  },
  detailLabel: {
    color: '#7A8797',
    fontSize: 12,
    marginTop: 7,
  },
  detailValue: {
    color: '#24364B',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  presentValue: {
    color: '#137A4B',
  },
  absentValue: {
    color: '#B42318',
  },
});
