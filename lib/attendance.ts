import { supabase } from '@/lib/supabase';
import { parseQRPayload } from './qr';
import { getEventByCode } from './events';

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  attendeeCount: number;

attendees: {
  studentId: string;
  studentName: string;
  scannedAt: string;
  status: 'present' | 'late';
}[];
};


export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
    };
  }

  
  const payload = parsed.payload;

  const foundEvent = await getEventByCode(payload.event);

  if (!foundEvent) {
    return {
      success: false,
      message: 'Invalid QR code. Event not found.',
    };
  }

  if (foundEvent.status?.toLowerCase() === 'closed') {
    return {
      success: false,
      message: 'This event is closed. Attendance is not allowed.',
      eventTitle: foundEvent.title,
    };
  }

  const now = Date.now();
  const start = payload.start ? new Date(payload.start).getTime() : null;
  const end = payload.end ? new Date(payload.end).getTime() : null;

  if (start !== null && now < start) {
    return {
      success: false,
      message: 'Event has not started yet.',
      eventTitle: foundEvent.title,
    };
  }

  if (end !== null && now > end) {
    return {
      success: false,
      message: 'Event has already ended.',
      eventTitle: foundEvent.title,
    };
  }

  const event = foundEvent;




const gracePeriodMs = 10 * 60 * 1000;

const attendanceStatus =
  start !== null && now > start + gracePeriodMs
    ? 'late'
    : 'present';

const { error: attendanceError } = await supabase
  .from('attendance')
  .insert({
    student_id: studentId,
    event_id: event.id,
    status: attendanceStatus,
  });


  if (attendanceError) {
    if (attendanceError.code === '23505') {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: event.title,
      };
    }

    console.error('Attendance insert error:', attendanceError);

    return {
      success: false,
      message: 'Could not record attendance.',
      eventTitle: event.title,
    };
  }

  return {
    success: true,
    message: 'Attendance recorded!',
    eventTitle: event.title,
  };
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  if (!studentId || studentId === 'unknown') {
    return [];
  }

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      student_id,
      event_id,
      scanned_at,
      events (
        title
      )
    `)
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error) {
    console.error('Attendance history error:', error);
    throw error;
  }

  return (data ?? []).map((record: any) => ({
    id: record.id,
    eventId: record.event_id,
    eventTitle: record.events?.title ?? 'Unknown Event',
    scannedAt: record.scanned_at,
  }));
}


export async function getTeacherEventAttendance(
  teacherId: string
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time, venue')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) {
    console.error('Teacher events error:', eventError);
    throw eventError ?? new Error('Could not load events.');
  }

  if (events.length === 0) return [];

  const eventIds = events.map((event) => event.id);

const { data: attendance, error: attendanceError } = await supabase
  .from('attendance')
  .select('student_id, scanned_at, event_id, status')
  .in('event_id', eventIds)
  .order('scanned_at', { ascending: false });

  if (attendanceError) {
    console.error('Teacher attendance error:', attendanceError);
    throw attendanceError;
  }

  const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, full_name, email, role')
  .eq('role', 'student');

   console.log('Student profiles fetched:', profiles?.length);
   console.log('Student profiles error:', profilesError);
   console.log('Attendance student IDs:', (attendance ?? []).map(
    (record) => record.student_id
));
if (profilesError) {
  console.error('Student profiles error:', profilesError);
  throw profilesError;
}

const allStudents = profiles ?? [];

  return events.map((event) => {
    const rows = (attendance ?? []).filter(
      (record) => record.event_id === event.id
    );

    return {
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time,
      venue: event.venue,
      attendeeCount: rows.length,
      attendees: rows.map((record) => {
        const profile = allStudents.find(
  (item) => item.id === record.student_id
);

        return {
          studentId: record.student_id,
          scannedAt: record.scanned_at,
          
status:
  event.start_time &&
  new Date(record.scanned_at).getTime() >
    new Date(event.start_time).getTime() + 10 * 60 * 1000
    ? 'late'
    : 'present',

          studentName:
            profile?.full_name?.trim() ||
            profile?.email ||
            'Unknown Student',
        };
      }),
    };
  });
}


export async function getTeacherEventSummary(
  teacherId: string
): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) {
    console.error('Teacher event summary error:', eventError);
    return [];
  }

  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data: attRows, error: attError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);

  if (attError || !attRows) {
    console.error('Teacher attendance count error:', attError);
    return [];
  }

  const counts: Record<string, number> = {};

  attRows.forEach((row) => {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  });

  return events.map((event) => ({
    eventId: event.id,
    eventCode: event.event_code,
    title: event.title,
    attendeeCount: counts[event.id] ?? 0,
  }));
}

export type StudentEventStatus = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: 'present' | 'late' | 'upcoming';
};

export async function getStudentEventStatuses(
  studentId: string
): Promise<StudentEventStatus[]> {
  if (!studentId) return [];

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, start_time, end_time')
    .order('start_time', { ascending: false });

  if (eventsError) {
    throw eventsError;
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_id')
    .eq('student_id', studentId);

  if (attendanceError) {
    throw attendanceError;
  }

  const attendedEventIds = new Set(
    (attendance ?? []).map((record) => record.event_id)
  );

  const now = Date.now();

  return (events ?? []).map((event) => {
    const endTime = event.end_time
      ? new Date(event.end_time).getTime()
      : null;

    let status: StudentEventStatus['status'] = 'upcoming';

if (attendedEventIds.has(event.id)) {
  status = 'present';
} else if (
  endTime !== null &&
  Number.isFinite(endTime) &&
  endTime < now
) {
  status = 'late';
}

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.start_time ?? '',
      status,
    };
  });
}
