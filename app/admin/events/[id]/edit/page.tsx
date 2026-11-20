import { notFound } from 'next/navigation';
import { isUuid } from '@/lib/api-auth';
import { requireAdmin } from '@/lib/admin';
import EventEditor from '../../EventEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data: event }, { count }] = await Promise.all([
    supabase.from('Event').select('*').eq('id', id).maybeSingle(),
    supabase.from('Registration').select('id', { count: 'exact', head: true }).eq('eventId', id),
  ]);
  if (!event) notFound();
  return <EventEditor event={event} registrationCount={count ?? 0} />;
}
