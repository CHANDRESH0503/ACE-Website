import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/api-auth';
import RegistrationForm, { type RegistrationState } from './RegistrationForm';
import type { TeamMember } from '@/lib/event-display';

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: 'Register · ACE SASTRA' };

export default async function RegisterPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: event }, { data: auth }, { count }] = await Promise.all([
    supabase.from('Event').select('*').eq('id', id).maybeSingle(),
    supabase.auth.getUser(),
    supabase.from('Registration').select('id', { count: 'exact', head: true }).eq('eventId', id),
  ]);
  if (!event) notFound();

  const user = auth.user;
  let state: RegistrationState = { kind: 'signed-out' };

  if (user) {
    const [{ data: profile }, { data: registration }] = await Promise.all([
      supabase
        .from('UserProfile')
        .select('id, name, registrationNumber, department, year, contactNumber')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('Registration')
        .select('id, registeredAt, paymentStatus')
        .eq('eventId', id)
        .eq('userId', user.id)
        .maybeSingle(),
    ]);

    // Own team only: RegistrationTeam RLS allows the lead and admins.
    const { data: team } = registration
      ? await supabase
          .from('RegistrationTeam')
          .select('teamName, teamSize, members')
          .eq('registrationId', registration.id)
          .maybeSingle()
      : { data: null };

    state = profile
      ? {
          kind: 'member',
          email: user.email ?? '',
          profile,
          registration: registration ?? null,
          team: team ? { name: team.teamName, size: team.teamSize, members: (team.members as TeamMember[]) ?? [] } : null,
        }
      : { kind: 'no-profile', email: user.email ?? '' };
  }

  return <RegistrationForm event={event} taken={count ?? 0} state={state} />;
}
