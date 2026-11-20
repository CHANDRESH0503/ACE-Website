// Shared formatting for event surfaces (register form, admin report).
import type { Tables } from '@/lib/supabase/database.types';

type EventLike = Pick<Tables<'Event'>, 'imgUrl'>;

const IST = 'Asia/Kolkata';

export const EVENT_TYPE_NAME: Record<string, string> = {
  CONTEST: 'Contest',
  WORKSHOP: 'Workshop',
  TALK: 'Talk',
};

export const EVENT_STATUS_NAME: Record<string, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  DONE: 'Completed',
  CANCELLED: 'Cancelled',
};

/** "Fri, 28 Nov 2026" in IST. */
export function formatDay(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: IST })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
}

/** "4:30 pm" in IST. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST });
}

/** "Fri, 28 Nov 2026 · 4:30 pm – 6:00 pm IST" */
export function formatWhen(start: string, end?: string | null): string {
  const s = `${formatDay(start)} · ${formatTime(start)}`;
  if (!end) return `${s} IST`;
  const sameDay = formatDay(start) === formatDay(end);
  return sameDay ? `${s} – ${formatTime(end)} IST` : `${s} – ${formatDay(end)} · ${formatTime(end)} IST`;
}

/** Compact timestamp for tables: "20 Nov, 14:05". */
export function formatStamp(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: IST })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return `${parts.day} ${parts.month}, ${parts.hour}:${parts.minute}`;
}

export function posterUrl(event: EventLike, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | null {
  if (!event.imgUrl) return null;
  if (/^https?:\/\//.test(event.imgUrl)) return event.imgUrl;
  return `${supabaseUrl}/storage/v1/object/public/event-images/${event.imgUrl.replace(/^\/+/, '')}`;
}

export function feeOf(event: Pick<Tables<'Event'>, 'isFeeRequired' | 'registrationFee'>): number {
  const fee = Number(event.registrationFee ?? 0);
  return event.isFeeRequired && fee > 0 ? fee : 0;
}

/** Google Calendar "add event" link. */
export function calendarUrl(event: Pick<Tables<'Event'>, 'name' | 'startTime' | 'endTime' | 'location' | 'description'>): string {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(event.startTime);
  const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name.trim(),
    dates: `${stamp(start)}/${stamp(end)}`,
    location: event.location ?? '',
    details: (event.description ?? '').slice(0, 1500),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export type TeamMember = { name: string; registrationNumber: string };
export const TEAM_SIZE_OPTIONS = [2, 3, 4] as const;

/** Allowed team sizes for an event, sorted; empty for individual events. */
export function teamSizesOf(event: Pick<Tables<'Event'>, 'participationMode' | 'teamSizes'>): number[] {
  if (event.participationMode !== 'TEAM') return [];
  return [...(event.teamSizes ?? [])].sort((a, b) => a - b);
}

/** "Individual", "Teams of 3", "Teams of 2 or 4", "Teams of 2–4". */
export function participationLabel(event: Pick<Tables<'Event'>, 'participationMode' | 'teamSizes'>): string {
  const sizes = teamSizesOf(event);
  if (sizes.length === 0) return 'Individual';
  if (sizes.length === 1) return `Teams of ${sizes[0]}`;
  const contiguous = sizes.every((s, i) => i === 0 || s === sizes[i - 1] + 1);
  return contiguous
    ? `Teams of ${sizes[0]}–${sizes[sizes.length - 1]}`
    : `Teams of ${sizes.slice(0, -1).join(', ')} or ${sizes[sizes.length - 1]}`;
}

/** Normalises a register number the way the database does: no spaces, upper case. */
export const normaliseRegNo = (v: string) => v.replace(/\s/g, '').toUpperCase();
export const REG_NO_RE = /^[A-Z0-9]{5,20}$/;
