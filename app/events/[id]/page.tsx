import { createClient } from "@/lib/supabase/server";
import EventDetailClient from "./EventDetailClient";
import type { Tables } from "@/lib/supabase/database.types";
import { ParticipantWithPoints } from "./EventDetailClient";

async function fetchEventData(eventId: string) {
  const supabase = await createClient();

  const [eventResponse, registrationsResponse] = await Promise.all([
    supabase.from("Event").select("*").eq("id", eventId).single(),
    supabase
      .from("Registration")
      .select("userId, points")
      .eq("eventId", eventId)
      .order("points", { ascending: false, nullsFirst: false }),
  ]);

  const event = eventResponse.error
    ? null
    : (eventResponse.data as Tables<"Event">);

  const registrations = registrationsResponse.error ? [] : registrationsResponse.data ?? [];
  const userIds = registrations.map((r) => r.userId);

  // Public projection only: no phone or registration numbers reach the client.
  const { data: profiles } = userIds.length
    ? await supabase
        .from("PublicUserProfile")
        .select("id, name, department, year, currentRating")
        .in("id", userIds)
    : { data: [] as Tables<"PublicUserProfile">[] };

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const participants: ParticipantWithPoints[] = registrations.flatMap((r) => {
    const profile = byId.get(r.userId);
    return profile ? [{ ...profile, points: r.points }] : [];
  });

  return { event, participants };
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id: eventId } = await params;
  const { event, participants } = await fetchEventData(eventId);

  return (
    <EventDetailClient
      initialEvent={event}
      initialParticipants={participants}
      eventId={eventId}
    />
  );
}
