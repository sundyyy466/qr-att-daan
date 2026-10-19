import { supabase } from '@/lib/supabase';


export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
  venue?: string;
  description?: string;
};

export type CloudEvent = {
  status: string | null;
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
};


export async function createEvent(
  event: Event
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('events')
    .upsert(
      {
        event_code: event.eventId,
        title: event.title,
        start_time: event.start || null,
        end_time: event.end || null,
        venue: event.venue?.trim() || null,
        description: event.description?.trim() || null,
        created_by: user?.id ?? null,
      },
      { onConflict: 'event_code' }
    );

  return { error: error?.message ?? null };
}

export async function getEventByCode(
  code: string
): Promise<CloudEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CloudEvent;
}

export async function getTeacherEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time, venue, description, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load events error:', error);
    return [];
  }

  return data ?? [];
}


export async function getUpcomingStudentEvent() {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .select('id, title, start_time, end_time, status')
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Load upcoming event error:', error);
    return null;
  }

  const event = data?.[0] ?? null;

  if (!event) {
    return null;
  }

  if (event.end_time && new Date(event.end_time).getTime() < Date.now()) {
    return null;
  }

  return event;
}


export async function updateEvent(
  eventId: string,
  event: Event
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('events')
    .update({
      title: event.title,
      start_time: event.start || null,
      end_time: event.end || null,
      venue: event.venue?.trim() || null,
      description: event.description?.trim() || null,
    })
    .eq('id', eventId)
    .select('id');

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: 'Event was not updated. Check the event ID and Supabase permissions.',
    };
  }

  return { error: null };
}

export async function closeEvent(
  eventId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'closed' })
    .eq('id', eventId);

  return { error: error?.message ?? null };
}



export async function updateEventStatus(
  eventId: string,
  status: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .select('id');

  if (error) {
    console.error('Update event status failed:', error.message);
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: 'No event was updated. Check your Supabase permissions (RLS) and event ID.',
    };
  }

  return { error: null };
}

export async function deleteEvent(
  eventId: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .select('id');

  if (error) {
    console.error('Delete event failed:', error.message);
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: 'No event was deleted. Check your Supabase permissions (RLS) and event ID.',
    };
  }

  return { error: null };
}


