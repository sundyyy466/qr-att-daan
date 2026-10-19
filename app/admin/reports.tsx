
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';

type ReportStats = {
  users: number;
  events: number;
  attendance: number;
};

type Breakdown = {
  label: string;
  count: number;
  color: string;
};

type MonthlyAttendance = {
  month: string;
  present: number;
  absent: number;
};

const PURPLE = '#6D43C3';
const BLUE = '#2875C7';
const GREEN = '#16856B';
const PINK = '#F05D78';
const TEAL = '#27B7B0';

export default function AdminReports() {
  const [stats, setStats] = useState<ReportStats>({
    users: 0,
    events: 0,
    attendance: 0,
  });

  const [roles, setRoles] = useState<Breakdown[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Breakdown[]>([]);
  const [monthly, setMonthly] = useState<MonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('');
  const [period, setPeriod] = useState<'all' | 'year'>('all');

  const loadReports = useCallback(async () => {
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

      // Optional breakdowns. If a column is unavailable,
      // the main report totals can still load.
      const [profilesData, eventsData, attendanceData] =
        await Promise.all([
          supabase.from('profiles').select('role'),
          supabase.from('events').select('status'),
          supabase.from('attendance').select('scanned_at, status'),
        ]);

      if (!profilesData.error && profilesData.data) {
        const counts: Record<string, number> = {};

        profilesData.data.forEach((item: any) => {
          const role = String(item.role ?? 'Other');
          counts[role] = (counts[role] ?? 0) + 1;
        });

        const roleColors: Record<string, string> = {
          student: BLUE,
          teacher: TEAL,
          administrator: PURPLE,
          admin: PURPLE,
        };

        setRoles(
          Object.entries(counts).map(([label, count]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            count,
            color: roleColors[label.toLowerCase()] ?? '#8B9BB4',
          }))
        );
      } else {
        setRoles([]);
      }

      if (!eventsData.error && eventsData.data) {
        const counts: Record<string, number> = {};

        eventsData.data.forEach((item: any) => {
          const status = String(item.status ?? 'Unknown');
          counts[status] = (counts[status] ?? 0) + 1;
        });

        setEventStatuses(
          Object.entries(counts).map(([label, count]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            count,
            color: label.toLowerCase() === 'open' ? GREEN : PINK,
          }))
        );
      } else {
        setEventStatuses([]);
      }

      if (!attendanceData.error && attendanceData.data) {
        const buckets: Record<string, MonthlyAttendance> = {};
        const now = new Date();

        for (let offset = 3; offset >= 0; offset--) {
          const date = new Date(
            now.getFullYear(),
            now.getMonth() - offset,
            1
          );
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          buckets[key] = {
            month: date.toLocaleString('en', { month: 'short' }),
            present: 0,
            absent: 0,
          };
        }

        attendanceData.data.forEach((item: any) => {
          if (!item.scanned_at) return;

          const date = new Date(item.scanned_at);
          if (Number.isNaN(date.getTime())) return;

          const key = `${date.getFullYear()}-${date.getMonth()}`;
          if (!buckets[key]) return;

          const status = String(item.status ?? 'present').toLowerCase();

          if (status === 'absent') {
            buckets[key].absent += 1;
          } else {
            buckets[key].present += 1;
          }
        });

        setMonthly(Object.values(buckets));
      } else {
        setMonthly([]);
      }
    } catch (err) {
      console.error('Admin reports error:', err);
      setError(
        'Unable to load report totals. Check your Supabase permissions.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const maxRole = Math.max(1, ...roles.map((item) => item.count));
  const maxStatus = Math.max(
    1,
    ...eventStatuses.map((item) => item.count)
  );
  const visibleMonthly =
    period === 'year'
      ? monthly
      : monthly.slice(-3);

  const reportCards = [
    {
      label: 'Registered Users',
      value: stats.users,
      color: PURPLE,
      icon: '♙',
    },
    {
      label: 'Total Events',
      value: stats.events,
      color: BLUE,
      icon: '▦',
    },
    {
      label: 'Attendance Records',
      value: stats.attendance,
      color: GREEN,
      icon: '✓',
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadReports();
          }}
        />
      }
    >
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.heading}>Reports</Text>
          <Text style={styles.subtitle}>
            QR-ATT system summaries and attendance records.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh reports"
          style={styles.refreshButton}
          onPress={() => {
            setRefreshing(true);
            loadReports();
          }}
        >
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Attendance period</Text>
        <View style={styles.periodButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: period === 'all' }}
            onPress={() => setPeriod('all')}
            style={[
              styles.periodButton,
              period === 'all' && styles.periodActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === 'all' && styles.periodTextActive,
              ]}
            >
              Recent 3 months
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: period === 'year' }}
            onPress={() => setPeriod('year')}
            style={[
              styles.periodButton,
              period === 'year' && styles.periodActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === 'year' && styles.periodTextActive,
              ]}
            >
              All 4 shown
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={PURPLE}
          style={styles.loader}
        />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Reports unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              loadReports();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            {reportCards.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}: ${item.value}. Open details`}
                onPress={() => setSelectedReport(item.label)}
                style={({ pressed }) => [
                  styles.statCard,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${item.color}18` },
                  ]}
                >
                  <Text style={[styles.statIcon, { color: item.color }]}>
                    {item.icon}
                  </Text>
                </View>

                <View style={styles.statInfo}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={[styles.cardValue, { color: item.color }]}>
                    {item.value}
                  </Text>
                </View>

                <Text style={[styles.arrow, { color: item.color }]}>›</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.chartGrid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open users by role details"
              onPress={() => setSelectedReport('Users by Role')}
              style={({ pressed }) => [
                styles.chartCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.chartHeadingRow}>
                <Text style={styles.chartTitle}>Users by Role</Text>
                <Text style={styles.chartArrow}>›</Text>
              </View>

              {roles.length === 0 ? (
                <Text style={styles.noData}>
                  Role breakdown unavailable. Check the profiles role column.
                </Text>
              ) : (
                <>
                  <View style={styles.totalCircle}>
                    <Text style={styles.circleValue}>{stats.users}</Text>
                    <Text style={styles.circleLabel}>Users</Text>
                  </View>

                  {roles.map((item) => (
                    <View key={item.label} style={styles.breakdownRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownLabel}>
                          {item.label}
                        </Text>
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.trackFill,
                              {
                                backgroundColor: item.color,
                                width: `${(item.count / maxRole) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.breakdownCount}>{item.count}</Text>
                    </View>
                  ))}
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open event status details"
              onPress={() => setSelectedReport('Events Status')}
              style={({ pressed }) => [
                styles.chartCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.chartHeadingRow}>
                <Text style={styles.chartTitle}>Events Status</Text>
                <Text style={styles.chartArrow}>›</Text>
              </View>

              {eventStatuses.length === 0 ? (
                <Text style={styles.noData}>
                  Event status breakdown unavailable. Check the events status
                  column.
                </Text>
              ) : (
                <>
                  <View style={styles.totalCircle}>
                    <Text style={styles.circleValue}>{stats.events}</Text>
                    <Text style={styles.circleLabel}>Events</Text>
                  </View>

                  {eventStatuses.map((item) => (
                    <View key={item.label} style={styles.breakdownRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownLabel}>
                          {item.label}
                        </Text>
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.trackFill,
                              {
                                backgroundColor: item.color,
                                width: `${(item.count / maxStatus) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.breakdownCount}>{item.count}</Text>
                    </View>
                  ))}
                </>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open attendance overview details"
            onPress={() => setSelectedReport('Attendance Overview')}
            style={({ pressed }) => [
              styles.chartCard,
              styles.overviewCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.chartHeadingRow}>
              <Text style={styles.chartTitle}>Attendance Overview</Text>
              <Text style={styles.chartArrow}>›</Text>
            </View>

            {visibleMonthly.length === 0 ? (
              <Text style={styles.noData}>
                Attendance trend unavailable. Confirm the scanned_at and
                status columns in your attendance table.
              </Text>
            ) : (
              <>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: TEAL }]} />
                  <Text style={styles.legendText}>Present</Text>
                  <View style={[styles.legendDot, { backgroundColor: PINK }]} />
                  <Text style={styles.legendText}>Absent</Text>
                </View>

                {visibleMonthly.map((item) => {
                  const max = Math.max(
                    1,
                    ...visibleMonthly.map((entry) =>
                      Math.max(entry.present, entry.absent)
                    )
                  );

                  return (
                    <View key={item.month} style={styles.monthRow}>
                      <Text style={styles.monthLabel}>{item.month}</Text>
                      <View style={styles.monthBars}>
                        <View style={styles.monthTrack}>
                          <View
                            style={[
                              styles.monthFill,
                              {
                                backgroundColor: TEAL,
                                width: `${(item.present / max) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.monthTrack}>
                          <View
                            style={[
                              styles.monthFill,
                              {
                                backgroundColor: PINK,
                                width: `${(item.absent / max) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.monthCount}>
                        {item.present}/{item.absent}
                      </Text>
                    </View>
                  );
                })}

                <Text style={styles.chartFootnote}>
                  Each pair shows present / absent records for that month.
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>ⓘ</Text>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Report Information</Text>
              <Text style={styles.noteText}>
                Summary totals come from your Supabase tables. Role, event
                status, and attendance trends appear only when their required
                columns are available. Confirm your database status values
                before using these charts for official reporting.
              </Text>
            </View>
          </View>
        </>
      )}

      <Modal
        visible={selectedReport !== ''}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReport('')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedReport}</Text>

            {selectedReport === 'Registered Users' ? (
              <Text style={styles.modalText}>
                Total profiles available: {stats.users}.
                {roles.length > 0
                  ? '\n\n' +
                    roles
                      .map((item) => `${item.label}: ${item.count}`)
                      .join('\n')
                  : '\n\nRole details are unavailable.'}
              </Text>
            ) : selectedReport === 'Total Events' ? (
              <Text style={styles.modalText}>
                Total events available: {stats.events}.
                {eventStatuses.length > 0
                  ? '\n\n' +
                    eventStatuses
                      .map((item) => `${item.label}: ${item.count}`)
                      .join('\n')
                  : '\n\nEvent status details are unavailable.'}
              </Text>
            ) : selectedReport === 'Attendance Records' ? (
              <Text style={styles.modalText}>
                Total attendance records available: {stats.attendance}.
                {'\n\n'}These are records, not necessarily unique students.
              </Text>
            ) : selectedReport === 'Users by Role' ? (
              <Text style={styles.modalText}>
                {roles.length
                  ? roles.map((item) => `${item.label}: ${item.count}`).join('\n')
                  : 'No role breakdown is available.'}
              </Text>
            ) : selectedReport === 'Events Status' ? (
              <Text style={styles.modalText}>
                {eventStatuses.length
                  ? eventStatuses
                      .map((item) => `${item.label}: ${item.count}`)
                      .join('\n')
                  : 'No event status breakdown is available.'}
              </Text>
            ) : (
              <Text style={styles.modalText}>
                {monthly.length
                  ? monthly
                      .map(
                        (item) =>
                          `${item.month}: ${item.present} present, ${item.absent} absent`
                      )
                      .join('\n')
                  : 'No monthly attendance breakdown is available.'}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedReport('')}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1FBFA',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  titleArea: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#17165C',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEFED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  refreshText: {
    color: PURPLE,
    fontWeight: '700',
  },
  filterRow: {
    marginBottom: 16,
    gap: 8,
  },
  filterLabel: {
    color: '#59677F',
    fontSize: 12,
    fontWeight: '700',
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7E8E7',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  periodActive: {
    backgroundColor: '#E8DEFF',
    borderColor: '#CBB8FF',
  },
  periodText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  periodTextActive: {
    color: PURPLE,
  },
  loader: {
    marginTop: 36,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E0EEEE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 110,
    shadowColor: '#1C5870',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 26,
    fontWeight: '800',
  },
  statInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: '#52617A',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },
  arrow: {
    fontSize: 27,
    fontWeight: '700',
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  chartCard: {
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E0EEEE',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1C5870',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  chartHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17165C',
  },
  chartArrow: {
    fontSize: 26,
    color: PURPLE,
    fontWeight: '700',
  },
  totalCircle: {
    alignSelf: 'center',
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 9,
    borderColor: '#DCD5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  circleValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17165C',
  },
  circleLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownInfo: {
    flex: 1,
    gap: 5,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#46546D',
  },
  track: {
    height: 5,
    backgroundColor: '#EEF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownCount: {
    minWidth: 22,
    textAlign: 'right',
    color: '#17165C',
    fontWeight: '800',
  },
  overviewCard: {
    marginBottom: 14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  legendText: {
    fontSize: 12,
    color: '#52617A',
    marginRight: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  monthLabel: {
    width: 34,
    color: '#64748B',
    fontSize: 12,
  },
  monthBars: {
    flex: 1,
    gap: 5,
  },
  monthTrack: {
    height: 8,
    backgroundColor: '#F0F4F7',
    borderRadius: 5,
    overflow: 'hidden',
  },
  monthFill: {
    height: '100%',
    borderRadius: 5,
  },
  monthCount: {
    width: 44,
    textAlign: 'right',
    fontSize: 11,
    color: '#52617A',
  },
  chartFootnote: {
    color: '#8792A5',
    fontSize: 11,
    marginTop: 4,
  },
  noData: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    paddingVertical: 12,
  },
  noteCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 17,
    borderRadius: 17,
    backgroundColor: '#E8E3FF',
    marginTop: 2,
  },
  noteIcon: {
    fontSize: 28,
    color: BLUE,
    fontWeight: '800',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#49309A',
    marginBottom: 7,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#51467D',
  },
  pressed: {
    opacity: 0.78,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    padding: 16,
    borderRadius: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B42318',
    marginBottom: 6,
  },
  errorText: {
    color: '#B42318',
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#B42318',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#17165C',
    marginBottom: 14,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#52617A',
  },
  closeButton: {
    marginTop: 22,
    backgroundColor: PURPLE,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
