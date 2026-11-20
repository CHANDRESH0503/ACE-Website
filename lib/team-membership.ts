// Teams a member is listed on by register number (not as lead).
// Backed by public.team_memberships() (migration 20261120150000).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export type TeamMembership = Database['public']['Functions']['team_memberships']['Returns'][number];

/**
 * Returns [] when the user is on no team, and also when the migration has not
 * been applied yet (PGRST202), so pages keep working before the rollout.
 */
export async function fetchTeamMemberships(
  // The app's clients are created untyped, so accept any schema.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  eventId?: string
): Promise<TeamMembership[]> {
  const { data, error } = await supabase.rpc('team_memberships', {
    p_user_id: userId,
    ...(eventId ? { p_event_id: eventId } : {}),
  });
  if (error) {
    if (error.code !== 'PGRST202') console.error('team_memberships failed:', error.message);
    return [];
  }
  return (data as TeamMembership[] | null) ?? [];
}
