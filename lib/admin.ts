// lib/admin.ts — server-only helpers for the admin event reports.
// Every query runs with the admin's own session, so the database's RLS
// (is_admin()) is the real gate; requireAdmin() just gives a clean 404.
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import type { TeamMember } from '@/lib/event-display';

/** Pages through a PostgREST query past the default 1000-row cap. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < size) return out;
  }
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/');
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (isAdmin !== true) notFound();
  return { supabase, user: auth.user };
}

export type ReportRow = {
  registrationId: string;
  userId: string;
  name: string;
  registrationNumber: string;
  email: string | null;
  mobile: string | null;
  department: string;
  year: number | null;
  registeredAt: string;
  attended: boolean | null;
  points: number | null;
  paymentStatus: Tables<'Registration'>['paymentStatus'];
  /** Team events only: the team this member leads. */
  team: { name: string; size: number; members: TeamMember[] } | null;
};

export type EventReport = {
  event: Tables<'Event'>;
  rows: ReportRow[];
  /** False when the email function isn't installed yet (migration not applied). */
  emailsAvailable: boolean;
};

export async function loadEventReport(eventId: string): Promise<EventReport | null> {
  const { supabase } = await requireAdmin();

  const [{ data: event }, regs, emailsRes, teamsRes] = await Promise.all([
    supabase.from('Event').select('*').eq('id', eventId).maybeSingle(),
    fetchAll((from, to) =>
      supabase
        .from('Registration')
        .select('id, userId, registeredAt, attended, points, paymentStatus')
        .eq('eventId', eventId)
        .order('registeredAt', { ascending: true })
        .order('id')
        .range(from, to)
    ),
    supabase.rpc('admin_event_registrant_emails', { p_event_id: eventId }),
    // Missing table (migration not applied) just means no team data.
    fetchAll((from, to) =>
      supabase
        .from('RegistrationTeam')
        .select('registrationId, teamName, teamSize, members')
        .eq('eventId', eventId)
        .order('registrationId')
        .range(from, to)
    ).catch(() => []),
  ]);
  if (!event) return null;

  const ids = regs.map((r) => r.userId);
  const profiles = new Map<string, Pick<Tables<'UserProfile'>, 'id' | 'name' | 'registrationNumber' | 'department' | 'year' | 'contactNumber'>>();

  // Chunk the IN() list so very large events stay under URL limits.
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await supabase
      .from('UserProfile')
      .select('id, name, registrationNumber, department, year, contactNumber')
      .in('id', ids.slice(i, i + 150));
    if (error) throw error;
    for (const p of data ?? []) profiles.set(p.id, p);
  }

  const emails = new Map<string, string>();
  for (const e of (emailsRes.data as { userId: string; email: string }[] | null) ?? []) emails.set(e.userId, e.email);

  const teams = new Map(teamsRes.map((t) => [t.registrationId, t]));

  const rows: ReportRow[] = regs.map((r) => {
    const p = profiles.get(r.userId);
    const t = teams.get(r.id);
    return {
      registrationId: r.id,
      userId: r.userId,
      name: p?.name ?? 'Unknown member',
      registrationNumber: p?.registrationNumber ?? '',
      email: emails.get(r.userId) ?? null,
      mobile: p?.contactNumber ?? null,
      department: p?.department ?? '',
      year: p?.year ?? null,
      registeredAt: r.registeredAt,
      attended: r.attended,
      points: r.points,
      paymentStatus: r.paymentStatus,
      team: t ? { name: t.teamName, size: t.teamSize, members: (t.members as TeamMember[]) ?? [] } : null,
    };
  });

  return { event, rows, emailsAvailable: !emailsRes.error };
}

export type EventSummary = Tables<'Event'> & {
  registered: number;
  attended: number;
  paid: number;
};

export async function loadEventSummaries(): Promise<EventSummary[]> {
  const { supabase } = await requireAdmin();
  const [{ data: events, error }, regs] = await Promise.all([
    supabase.from('Event').select('*').order('startTime', { ascending: false }),
    fetchAll((from, to) => supabase.from('Registration').select('eventId, attended, paymentStatus').order('id').range(from, to)),
  ]);
  if (error) throw error;

  const tally = new Map<string, { registered: number; attended: number; paid: number }>();
  for (const r of regs) {
    const t = tally.get(r.eventId) ?? { registered: 0, attended: 0, paid: 0 };
    t.registered += 1;
    if (r.attended) t.attended += 1;
    if (r.paymentStatus === 'completed') t.paid += 1;
    tally.set(r.eventId, t);
  }
  return (events ?? []).map((e) => ({ ...e, ...(tally.get(e.id) ?? { registered: 0, attended: 0, paid: 0 }) }));
}
