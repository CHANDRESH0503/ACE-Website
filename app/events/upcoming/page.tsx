import { createClient } from '@/lib/supabase/server';
import type { Tables, Enums } from '@/lib/supabase/database.types';
import { fetchTeamMemberships } from '@/lib/team-membership';
import UpcomingEventsClientView, { type MyRegistrations } from './UpcomingEventsClientView';

type SupabaseEvent = Tables<'Event'> & {
  type: Enums<'EventType'>;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function fetchUpcomingEvents(supabase: Supabase) {
  const { data, error } = await supabase
    .from('Event')
    .select('*')
    .eq('status', 'OPEN')
    .order('startTime', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
  return data as SupabaseEvent[];
}

/** The signed-in member's place on each open event: their own registration or a team that lists them. */
async function fetchMyRegistrations(supabase: Supabase, eventIds: string[]): Promise<MyRegistrations> {
  if (eventIds.length === 0) return {};
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return {};

  const [{ data: own }, memberships] = await Promise.all([
    supabase.from('Registration').select('eventId').eq('userId', user.id).in('eventId', eventIds),
    fetchTeamMemberships(supabase, user.id),
  ]);

  const mine: MyRegistrations = {};
  for (const m of memberships) {
    if (eventIds.includes(m.eventId)) mine[m.eventId] = { kind: 'team', teamName: m.teamName, leadName: m.leadName };
  }
  for (const r of own ?? []) mine[r.eventId] = { kind: 'self' };
  return mine;
}

export default async function UpcomingEventsPage() {
  const supabase = await createClient();
  const events = await fetchUpcomingEvents(supabase);
  const mine = await fetchMyRegistrations(supabase, events.map((e) => e.id));

  return <UpcomingEventsClientView events={events} mine={mine} />;
}
