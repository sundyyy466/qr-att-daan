
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';

type EventItem = {
  id: string;
  event_code?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  venue?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status?: string | null;
};

type StatusFilter = 'all' | 'open' | 'closed';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function AdminEvents() {
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [qrEvent, setQrEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setEvents((data ?? []) as EventItem[]);
    } catch (err) {
      console.error('Admin events error:', err);
      setError('Unable to load events. Check the Supabase permissions and Terminal.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        [event.title, event.name, event.event_code, event.venue]
          .some((value) => (value ?? '').toLowerCase().includes(query));

      const status = (event.status ?? 'open').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  const setEventStatus = async (
    event: EventItem,
    nextStatus: 'open' | 'closed'
  ) => {
    if (!event.id || busyEventId) return;

    setBusyEventId(event.id);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: nextStatus })
        .eq('id', event.id);

      if (updateError) throw updateError;

      setEvents((items) =>
        items.map((item) =>
          item.id === event.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      console.error('Update event status error:', err);
      setError('Unable to update event status. Check Supabase permissions.');
    } finally {
      setBusyEventId(null);
    }
  };

  const beginEdit = (event: EventItem) => {
    setEditingEvent(event);
    setEditTitle(event.title ?? event.name ?? '');
    setEditStart(event.start_time ?? '');
    setEditEnd(event.end_time ?? '');
  };

  const saveEdit = async () => {
    if (!editingEvent) return;

    if (!editTitle.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }

    setSavingEdit(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: editTitle.trim(),
          start_time: editStart.trim() || null,
          end_time: editEnd.trim() || null,
        })
        .eq('id', editingEvent.id);

      if (updateError) throw updateError;

      setEditingEvent(null);
      await loadEvents();
      Alert.alert('Success', 'Event updated.');
    } catch (err) {
      console.error('Edit event error:', err);
      setError('Unable to edit event. Your database may use different column names.');
    } finally {
      setSavingEdit(false);
    }
  };

  


const deleteEvent = async (event: EventItem) => {

  setBusyEventId(event.id);
  setError('');

  try {
    const { data, error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id)
      .select('id');

    if (deleteError) {
      throw deleteError;
    }

    if (!data || data.length === 0) {
      throw new Error(
        'No event was deleted. Check the signed-in account and database permissions.'
      );
    }

    setEvents((current) =>
      current.filter((item) => item.id !== event.id)
    );

  } catch (err: unknown) {
    console.error('Delete event error:', err);

    const message =
      err instanceof Error ? err.message : 'Unknown error';

    window.alert(`Delete failed: ${message}`);
  } finally {
    setBusyEventId(null);
  }
};




  const renderEvent = ({ item }: { item: EventItem }) => {
    const isOpen = (item.status ?? 'open').toLowerCase() === 'open';
    const isBusy = busyEventId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.eventIcon}>
            <Text style={styles.eventIconText}>▦</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>
              {item.title || item.name || 'Untitled event'}
            </Text>
            <Text style={styles.detail}>
              Event Code: {item.event_code || 'No code'}
            </Text>
            <Text style={styles.detail}>Starts: {formatDate(item.start_time)}</Text>
            <Text style={styles.detail}>Ends: {formatDate(item.end_time)}</Text>
            {!!item.venue && <Text style={styles.detail}>Venue: {item.venue}</Text>}
          </View>
          <View style={[styles.statusPill, isOpen ? styles.openPill : styles.closedPill]}>
            <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
              {isOpen ? '● Open' : '● Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.qrButton]}
            onPress={() => setQrEvent(item)}
          >
            <Text style={styles.qrButtonText}>View QR</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => beginEdit(item)}
          >
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>

<Pressable
  style={[
    styles.actionButton,
    { zIndex: 999, elevation: 20 },
  ]}
onPress={() => setEventToDelete(item)}
  disabled={false}
>
  <Text style={styles.deleteText}>Delete</Text>
</Pressable>


          <Pressable
            style={[styles.actionButton, isOpen ? styles.closeButton : styles.openButton]}
            onPress={() => setEventStatus(item, isOpen ? 'closed' : 'open')}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.toggleText}>
                {isOpen ? 'Close' : 'Open'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Manage Events</Text>
          <Text style={styles.subtitle}>View and manage QR-ATT events.</Text>
        </View>
        <Text style={styles.count}>{filteredEvents.length} events</Text>
      </View>
      

      <TextInput
        style={styles.searchInput}
        placeholder="Search event name, code, or venue..."
        placeholderTextColor="#888888"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {(['all', 'open', 'closed'] as StatusFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterButton,
              statusFilter === filter && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter === 'all'
                ? 'All Status'
                : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadEvents}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary || '#16A6C7'} />
          <Text style={styles.muted}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={
            filteredEvents.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadEvents();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.muted}>
                {events.length === 0
                  ? 'No events were returned from the database.'
                  : 'Try changing your search or status filter.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!qrEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setQrEvent(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Event QR Code</Text>
            <Text style={styles.detail}>
              {qrEvent?.title || qrEvent?.name || 'Event'}
            </Text>
            {qrEvent?.event_code ? (
              <View style={styles.qrWrap}>
                <QRCode value={qrEvent.event_code} size={210} />
              </View>
            ) : (
              <Text style={styles.errorText}>This event has no event code.</Text>
            )}
            <Text style={styles.detail}>
              Code: {qrEvent?.event_code || 'Unavailable'}
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => setQrEvent(null)}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editingEvent}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingEvent(null)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.editModalScroll}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Event</Text>

              <Text style={styles.label}>Event title</Text>
              <TextInput
                style={styles.formInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Event title"
                placeholderTextColor="#888888"
              />

              <Text style={styles.label}>Start time (ISO date/time)</Text>
              <TextInput
                style={styles.formInput}
                value={editStart}
                onChangeText={setEditStart}
                placeholder="2026-10-20T08:00:00+08:00"
                placeholderTextColor="#888888"
                autoCapitalize="none"
              />

              <Text style={styles.label}>End time (ISO date/time)</Text>
              <TextInput
                style={styles.formInput}
                value={editEnd}
                onChangeText={setEditEnd}
                placeholder="2026-10-20T17:00:00+08:00"
                placeholderTextColor="#888888"
                autoCapitalize="none"
              />

              <Pressable
                style={styles.primaryButton}
                onPress={saveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditingEvent(null)}
                disabled={savingEdit}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
{eventToDelete && (
  <View style={styles.deleteOverlay}>
    <View style={styles.deleteModal}>
      <Text style={styles.deleteTitle}>Delete Event?</Text>

      <Text style={styles.deleteMessage}>
        Are you sure you want to delete "
        {eventToDelete.title ?? eventToDelete.name ?? 'this event'}"?
        This action cannot be undone.
      </Text>

      <View style={styles.deleteActions}>
        <Pressable
          style={styles.cancelDeleteButton}
          onPress={() => setEventToDelete(null)}
        >
          <Text style={styles.cancelDeleteText}>No, Cancel</Text>
        </Pressable>

        <Pressable
          style={styles.confirmDeleteButton}
          onPress={async () => {
            const selectedEvent = eventToDelete;
            setEventToDelete(null);
            await deleteEvent(selectedEvent);
          }}
        >
          <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
        </Pressable>
      </View>
    </View>
  </View>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  deleteModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 10,
  },
  deleteTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#172B4D',
    marginBottom: 12,
  },
  deleteMessage: {
    fontSize: 15,
    color: '#526078',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelDeleteButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E9EEF5',
  },
  cancelDeleteText: {
    color: '#344054',
    fontWeight: '600',
  },
  confirmDeleteButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#D92D20',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 23, fontWeight: '800', color: '#152238' },
  subtitle: { color: '#718096', fontSize: 12, marginTop: 4 },
  count: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE3ED',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#152238',
    marginBottom: 10,
  },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#E8EDF5',
  },
  activeFilter: { backgroundColor: '#16A6C7' },
  filterText: { color: '#526174', fontWeight: '600', fontSize: 12 },
  activeFilterText: { color: '#FFFFFF' },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7F0',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eventIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E7F5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIconText: { color: '#16A6C7', fontSize: 24, fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventTitle: { color: '#152238', fontWeight: '800', fontSize: 16, marginBottom: 7 },
  detail: { color: '#718096', fontSize: 11, marginBottom: 4 },
  statusPill: { borderRadius: 16, paddingHorizontal: 9, paddingVertical: 6 },
  openPill: { backgroundColor: '#DCFCE7' },
  closedPill: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: '700' },
  openText: { color: '#15803D' },
  closedText: { color: '#B91C1C' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  actionButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DCE3ED',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#334155', fontWeight: '700', fontSize: 12 },
  qrButton: { backgroundColor: '#E8F1FF', borderColor: '#D5E4FF' },
  qrButtonText: { color: '#2458B8', fontSize: 12, fontWeight: '700' },
  deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  closeButton: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  openButton: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  toggleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#718096', fontSize: 12, textAlign: 'center', marginTop: 8 },
  emptyTitle: { color: '#152238', fontSize: 17, fontWeight: '800' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 12 },
  retryText: { color: '#1D4ED8', fontWeight: '800', marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    alignItems: 'stretch',
  },
  modalTitle: {
    color: '#152238',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  qrWrap: { alignItems: 'center', padding: 16 },
  primaryButton: {
    backgroundColor: '#16A6C7',
    borderRadius: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 4,
  },
  editModalScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  label: { color: '#334155', fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 5 },
  formInput: {
    borderWidth: 1,
    borderColor: '#DCE3ED',
    borderRadius: 10,
    padding: 11,
    color: '#152238',
    backgroundColor: '#FFFFFF',
  },
});
