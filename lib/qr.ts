export type QRPayload = {
  v: 1;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

export function buildQRPayload(event: {
  eventId: string;
  title: string;
  start?: string;
  end?: string;
}): string {
  const payload: QRPayload = {
    v: 1,
    event: event.eventId.trim(),
  };

  if (event.title) {
    payload.title = event.title;
  }

  if (event.start) {
    payload.start = event.start;
  }

  if (event.end) {
    payload.end = event.end;
  }

  return JSON.stringify(payload);
}

export type ParseQRResult =
  | { ok: true; payload: QRPayload }
  | { ok: false; message: string };

export function parseQRPayload(raw: string): ParseQRResult {
  const value = raw.trim();

  if (!value) {
    return {
      ok: false,
      message: 'Invalid QR code.',
    };
  }

  let parsed: any;

  try {
    parsed = JSON.parse(value);
  } catch {
    return {
      ok: true,
      payload: {
        v: 1,
        event: value,
      },
    };
  }

  if (
    parsed &&
    parsed.v === 1 &&
    typeof parsed.event === 'string' &&
    parsed.event.trim()
  ) {
    return {
      ok: true,
      payload: {
        ...parsed,
        event: parsed.event.trim(),
      } as QRPayload,
    };
  }

  return {
    ok: false,
    message: 'Not an attendance QR code.',
  };
}