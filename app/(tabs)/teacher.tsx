import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import {
  createElement,
  useCallback,
  useState,
  useRef,
  type ChangeEvent,
} from 'react';

import { useFocusEffect } from '@react-navigation/native';
import {
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getUserRole } from '@/lib/profiles';
import { getTeacherEventAttendance } from '@/lib/attendance';
import {
  createEvent,
  getTeacherEvents,
  updateEvent,
  updateEventStatus,
  deleteEvent,
} from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';
function toLocalISO(date: Date) {
  return date.toISOString();
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
    const { user } = useAuth();

const [role, setRole] = useState<
  'student' | 'teacher' | 'admin' | 'administrator' | null
>(null);
  
  const [roleLoading, setRoleLoading] = useState(true);
  const [title, setTitle] = useState('');
  const formScrollRef = useRef<ScrollView>(null);
  const qrCardRef = useRef<View>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState(
  `EVT-${Date.now()}`
);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const qrRef = useRef<View>(null);




const handleDownloadQR = async () => {
  try {
    
if (Platform.OS === 'web') {
  const qr = document.querySelector('svg');

  if (!qr) {
    Alert.alert('QR Code', 'Dili makita ang QR code.');
    return;
  }

  const svgText = new XMLSerializer().serializeToString(qr);
  const blob = new Blob([svgText], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'event-qr.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  Alert.alert(
    'QR Ready to Share',
    'Na-download ang QR code. Ablihi ang Downloads folder ug i-share ang event-qr.svg.'
  );

  return;
}


    if (!qrRef.current) {
      Alert.alert('QR Code', 'Dili makita ang QR code.');
      return;
    }

    const uri = await captureRef(qrRef, {
      format: 'png',
      quality: 1,
    });

    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'I-allow ang gallery permission aron ma-save ang QR.'
      );
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Success', 'Saved Succesfully');
  } catch (error) {
    console.error('QR download error:', error);
    Alert.alert('Error', 'Dili ma-download ang QR.');
  }
};



const handleShareQR = async () => {
  try {
    if (Platform.OS === 'web') {
      const qr = document.querySelector('svg');

      if (!qr) {
        Alert.alert('QR Code', 'Dili makita ang QR code.');
        return;
      }

      const svgText = new XMLSerializer().serializeToString(qr);
      const blob = new Blob([svgText], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const file = new File([blob], 'event-qr.svg', {
        type: 'image/svg+xml',
      });

      
const url = URL.createObjectURL(blob);
const link = document.createElement('a');

link.href = url;
link.download = 'event-qr.svg';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

setTimeout(() => URL.revokeObjectURL(url), 1000);

Alert.alert(
  'QR Ready to Share',
  'Na-download ang QR code. Ablihi ang Downloads folder ug i-share ang event-qr.svg.'
);


      return;
    }

    if (!qrRef.current) {
      Alert.alert('QR Code', 'Dili makita ang QR code.');
      return;
    }

    const uri = await captureRef(qrRef, {
      format: 'png',
      quality: 1,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Event QR Code',
      });
    } else {
      Alert.alert(
        'Share unavailable',
        'Dili available ang sharing niini nga device.'
      );
    }
  } catch (error) {
    console.error('QR share error:', error);
    Alert.alert('Error', 'Dili ma-share ang QR. Sulayi pag-usab.');
  }
};



  const [confirmAction, setConfirmAction] = useState<{
  type: 'close' | 'delete';
  eventId: string;
} | null>(null);
  const [existingEvents, setExistingEvents] = useState<
  {
    id: string;
    event_code: string;
    title: string;
    start_time: string | null;
    end_time: string | null;
    venue: string | null;
    description: string | null;
    status: string | null;
  }[]>([]);

  const [message, setMessage] = useState<string | null>(null);
  const [attendanceEvents, setAttendanceEvents] = useState<
  Awaited<ReturnType<typeof getTeacherEventAttendance>>
>([]);

const [teacherPageRefreshing, setTeacherPageRefreshing] = useState(false);

const refreshTeacherPage = async () => {
  if (teacherPageRefreshing) return;

  setTeacherPageRefreshing(true);

  try {
    const events = await getTeacherEvents();
    const attendanceData = user
      ? await getTeacherEventAttendance(user.id)
      : [];

    setExistingEvents(events);
    setAttendanceEvents(attendanceData);

    if (attendanceData.length > 0) {
      setSelectedAttendanceEventId((currentId) =>
        currentId &&
        attendanceData.some((event) => event.eventId === currentId)
          ? currentId
          : attendanceData[0].eventId
      );
    } else {
      setSelectedAttendanceEventId(null);
    }
  } catch (error) {
    console.error('Failed to refresh teacher page:', error);
    Alert.alert(
      'Refresh failed',
      'Could not reload events. Please try again.'
    );
  } finally {
    setTeacherPageRefreshing(false);
  }
};

const [attendanceSearch, setAttendanceSearch] = useState('');
const [selectedAttendanceEventId, setSelectedAttendanceEventId] =
  useState<string | null>(null);
const [confirmLoading, setConfirmLoading] = useState(false);

  const isAndroid = Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  
useFocusEffect(
  useCallback(() => {
    let active = true;

    async function loadEvents() {
      const events = await getTeacherEvents();
      if (user) {
  const attendanceData = await getTeacherEventAttendance(user.id);

  if (active) {
    setAttendanceEvents(attendanceData);

    if (
      !selectedAttendanceEventId &&
      attendanceData.length > 0
    ) {
      setSelectedAttendanceEventId(attendanceData[0].eventId);
    }
  }
}

      if (active) {
        setExistingEvents(events);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [])
);

    useFocusEffect(
    useCallback(() => {
      let active = true;

     
if (!user) {
  setRole(null);
  setRoleLoading(false);

  return () => {
    active = false;
  };
}

      setRoleLoading(true);

      getUserRole(user.id).then((role) => {
  if (!active) return;

  setRole(role ?? 'student');
  setRoleLoading(false);
});
      return () => {
        active = false;
      };
    }, [user])
  );

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };


const handleCreateEvent = async () => {
  setMessage(null);
  setPayload(null);

  const event = {
    eventId: eventId.trim(),
    title: title.trim(),
    start: toLocalISO(startDate),
    end: toLocalISO(endDate),
    venue: venue.trim(),
    description: description.trim(),
  };

  if (!event.title || !event.eventId || !event.venue) {
    setMessage('Event title, code, and venue are required.');
    return;
  }

  if (
    event.title.length > 150 ||
    event.eventId.length > 50 ||
    event.venue.length > 150 ||
    event.description.length > 1000
  ) {
    setMessage('Please shorten the event details and try again.');
    return;
  }

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    setMessage('Please select a valid start and end date.');
    return;
  }

  if (endDate.getTime() <= startDate.getTime()) {
    setMessage('End time must be after start time.');
    return;
  }

  try {
const { error } = editingEventId
  ? await updateEvent(editingEventId, event)
  : await createEvent(event);
    if (error) {
      setMessage('Could not save the event. Please try again.');
      return;
    }

    const refreshedEvents = await getTeacherEvents();
    setExistingEvents(refreshedEvents);

    setMessage(
      editingEventId
        ? 'Event updated successfully!'
        : 'Event created successfully!'
    );

    setPayload(
  buildQRPayload({
    ...event,
    eventId: event.eventId.trim(),
  })
);
    setTimeout(() => {
  formScrollRef.current?.scrollToEnd({ animated: true });
}, 100);
    setEditingEventId(null);
  } catch (error) {
    console.error('Save event error:', error);
    setMessage('Failed to save the event. Please try again.');
  }
};

    if (roleLoading) {
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockTitle}>Checking your account...</Text>
      </View>
    );
  }

  if (role !== 'teacher') {
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockTitle}>Teachers Only</Text>
        <Text style={styles.lockMessage}>
          This section is available only to teacher accounts.
        </Text>
      </View>
    );
  }
  



const handleCloseEvent = async (eventId: string) => {
  setConfirmAction({ type: 'close', eventId });
};




const handleDeleteEvent = async (eventId: string) => {
  setConfirmAction({ type: 'delete', eventId });
};


return (

    <ScrollView
  ref={formScrollRef}
  style={styles.container}
  contentContainerStyle={styles.content}
  keyboardShouldPersistTaps="handled"
  refreshControl={
    <RefreshControl
      refreshing={teacherPageRefreshing}
      onRefresh={refreshTeacherPage}
      tintColor={COLORS.primary}
      colors={[COLORS.primary]}
    />
  }
>
      <Text style={styles.title}>Create Event QR</Text>
      <Text style={styles.subtitle}>
        Fill in the event details, then scan the generated QR with the Scan tab.
      </Text>

      <Text style={styles.label}>Event Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Founders Day Assembly"
        placeholderTextColor={COLORS.textSecondary}
      />
      
<Text style={styles.label}>Venue</Text>
<TextInput
  style={styles.input}
  value={venue}
  onChangeText={setVenue}
  placeholder="e.g. School Gymnasium"
  placeholderTextColor={COLORS.textSecondary}
/>

<Text style={styles.label}>Description</Text>
<TextInput
  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
  value={description}
  onChangeText={setDescription}
  placeholder="Enter event description"
  placeholderTextColor={COLORS.textSecondary}
  multiline
/>


      <Text style={styles.label}>Event Code</Text>
      <TextInput
        style={styles.input}
        value={eventId}
        onChangeText={setEventId}
        placeholder="e.g. EVT-2026-0002"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Starts</Text>
      <PickerField
        value={formatDateTime(startDate)}
        icon="sunny-outline"
        onPress={() => openPicker('start')}
      />

      <Text style={styles.label}>Ends</Text>
      <PickerField
        value={formatDateTime(endDate)}
        icon="moon-outline"
        onPress={() => openPicker('end')}
      />
      <View style={styles.chipRow}>
        {QUICK_END_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={styles.chip}
            onPress={() => handleQuickEnd(option.ms)}
          >
            <Text style={styles.chipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>Tap a chip to set the end time from start.</Text>

      {message && <Text style={styles.message}>{message}</Text>}

      
<AppButton
  theme="primary"
  title={editingEventId ? 'Update Event' : 'Create Event'}
  icon={editingEventId ? 'save-outline' : 'add-circle-outline'}
  onPress={handleCreateEvent}
/>


      
{editTarget && (
  <View style={styles.pickerContainer}>
    <Text style={styles.label}>
      {editTarget === 'start' ? 'Select Start Date and Time' : 'Select End Date and Time'}
    </Text>

    
{Platform.OS === 'web' ? (
  createElement('input', {
    type: 'datetime-local',
    value: formatDateTimeLocal(
      editTarget === 'start' ? startDate : endDate
    ),
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      if (!value) return;

      const selected = new Date(value);
      if (Number.isNaN(selected.getTime())) return;

      if (editTarget === 'start') {
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
    },
    style: {
      width: '100%',
      padding: 12,
      fontSize: 16,
      border: '1px solid #ccc',
      borderRadius: 8,
      boxSizing: 'border-box',
    },
  })
) : (
  <DateTimePicker
    value={editTarget === 'start' ? startDate : endDate}
    mode={editingPart}
    display="default"
    onChange={onPickerChange}
  />
)}

  </View>
)}

      
{existingEvents.length > 0 && (
  <View style={styles.resultCard}>
    <Text style={styles.resultTitle}>Existing Events</Text>

    {existingEvents.map((event) => (
      <View key={event.id} style={{ width: '100%', marginBottom: 16 }}>
        <Text style={styles.label}>{event.title}</Text>
        
<Text style={styles.payloadText}>
  Event Code: {event.event_code}
</Text>

<Text style={styles.payloadText}>
  Starts: {event.start_time
    ? new Date(event.start_time).toLocaleString()
    : 'Not set'}
</Text>

<Text style={styles.payloadText}>
  Ends: {event.end_time
    ? new Date(event.end_time).toLocaleString()
    : 'Not set'}
</Text>

<Text style={styles.payloadText}>
  Status: {event.status ?? 'Unknown'}
</Text>

        
<View style={styles.eventActionsRow}>
  <Pressable
    style={styles.eventActionButton}
   
onPress={() => {
  setMessage(null);
  setPayload(
    JSON.stringify({
      v: 1,
      event: event.event_code,
      title: event.title,
      start: event.start_time ?? undefined,
      end: event.end_time ?? undefined,
    })
  );

  setTimeout(() => {
    formScrollRef.current?.scrollToEnd({ animated: true });
  }, 100);
}}

  >
    <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
    <Text style={styles.eventActionText}>QR</Text>
  </Pressable>
  
<Pressable
  style={styles.eventActionButton}
 
onPress={() => {
  setMessage(null);
formScrollRef.current?.scrollTo({ y: 0, animated: true });
  setEditingEventId(event.id);
  setTitle(event.title);
  setVenue(event.venue ?? '');
setDescription(event.description ?? '');
  setEventId(event.event_code);
  setStartDate(
    new Date(event.start_time ?? Date.now())
  );
  setEndDate(
    new Date(event.end_time ?? Date.now())
  );
  setMessage('Editing event. Update the details above, then save.');
  setPayload(null);
}}

>
  <Ionicons name="create-outline" size={16} color={COLORS.primary} />
  <Text style={styles.eventActionText}>Edit</Text>
</Pressable>


  <Pressable
    style={styles.eventActionButton}
    onPress={() => handleCloseEvent(event.id)}
  >
    <Ionicons name="lock-closed-outline" size={16} color={COLORS.primary} />
    <Text style={styles.eventActionText}>Close</Text>
  </Pressable>

  <Pressable
    style={[styles.eventActionButton, styles.deleteEventButton]}
    onPress={() => handleDeleteEvent(event.id)}
  >
    <Ionicons name="trash-outline" size={16} color="#C0392B" />
    <Text style={[styles.eventActionText, styles.deleteEventText]}>
      Delete
    </Text>
  </Pressable>
</View>


      </View>
    ))}
  </View>
)}


      {confirmAction && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>
              {confirmAction.type === 'delete' ? 'Delete Event?' : 'Close Event?'}
            </Text>

            <Text style={styles.confirmMessage}>
              {confirmAction.type === 'delete'
                ? 'Are you sure you want to permanently delete this event?'
                : 'Are you sure you want to close this event?'}
            </Text>

            <View style={styles.confirmButtons}>
              <Pressable
                style={styles.confirmCancelButton}
                onPress={() => setConfirmAction(null)}
                disabled={confirmLoading}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmOkayButton}
                disabled={confirmLoading}
                onPress={async () => {
                  setConfirmLoading(true);

                  try {
                    const result =
                      confirmAction.type === 'delete'
                        ? await deleteEvent(confirmAction.eventId)
                        : await updateEventStatus(confirmAction.eventId, 'closed');

                    if (result.error) {
                      setMessage(
                        `Could not ${confirmAction.type} event: ${result.error}`
                      );
                      return;
                    }

                    const refreshedEvents = await getTeacherEvents();
                    setExistingEvents(refreshedEvents);
                    setPayload(null);
                    setMessage(
                      confirmAction.type === 'delete'
                        ? 'Event deleted successfully.'
                        : 'Event closed successfully.'
                    );
                    setConfirmAction(null);
                  } catch (error) {
                    setMessage('Action failed. Please try again.');
                    console.error('Event action failed:', error);
                  } finally {
                    setConfirmLoading(false);
                  }
                }}
              >
                <Text style={styles.confirmOkayText}>
                  {confirmLoading
                    ? 'Please wait...'
                    : confirmAction.type === 'delete'
                      ? 'Delete'
                      : 'Close Event'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      
{payload && (
<View ref={qrCardRef} collapsable={false} style={styles.resultCard}>
      <Text style={styles.resultTitle}>
{existingEvents.find(
  (event) => event.event_code === JSON.parse(payload).event
)?.title ?? 'Event'} QR Code</Text>
    <View
  ref={qrRef}
  collapsable={false}
  style={styles.qrBox}
  {...({ 'data-qr-download': 'true' } as any)}
>
      <QRCode value={payload} size={220} />
    </View>
    <Text style={styles.payloadText}>
      Scan this QR code using the Student Scan tab.
    </Text>

<View
  style={{
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    width: '100%',
  }}
>
  <Pressable
    onPress={() => {
      console.log('Download QR pressed');
      handleDownloadQR();
    }}
    style={{
      flex: 1,
      maxWidth: 140,
      backgroundColor: '#DDF3FF',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color: '#1769AA', fontWeight: '600' }}>
      ↓ Download QR
    </Text>
  </Pressable>

  <Pressable
    onPress={() => {
      console.log('Share QR pressed');
      handleShareQR();
    }}
    style={{
      flex: 1,
      maxWidth: 140,
      backgroundColor: '#DDF3FF',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color: '#1769AA', fontWeight: '600' }}>
      ↗ Share QR
    </Text>
  </Pressable>
</View>

  </View>
)}

      
    </ScrollView>
  );
}


type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pickerField, pressed && styles.pickerFieldPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
    lockContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  lockTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },

  lockMessage: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  pickerField: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerFieldPressed: {
    backgroundColor: COLORS.surface,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  pickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  payloadText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  
eventActionsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 10,
},

eventActionButton: {
  flex: 1,
  minWidth: 0,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 9,
  paddingHorizontal: 4,
  borderRadius: 9,
  backgroundColor: '#94c2be',
  gap: 4,
},

eventActionText: {
  fontSize: 12,
  fontWeight: '600',
  color: COLORS.primary,
},

deleteEventButton: {
  backgroundColor: '#94c2be',
},

deleteEventText: {
  color: '#C0392B',
},

  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(25, 20, 45, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#188127',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#5F5870',
    lineHeight: 22,
    marginBottom: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmCancelButton: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#cae1cd',
  },
  confirmCancelText: {
    color: '#188127',
    fontWeight: '600',
  },
  confirmOkayButton: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#188127',
  },
  confirmOkayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },


});

