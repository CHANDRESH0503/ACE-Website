import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CONFIG, getAbsoluteUrl } from "@/lib/config";
import type { Tables } from "@/lib/supabase/database.types";
import { EVENT_TYPE_NAME, formatTime } from "@/lib/event-display";
import { fetchTeamMemberships, type TeamMembership } from "@/lib/team-membership";
import { cn } from "@/lib/utils";

type UserProfile = Tables<"PublicUserProfile">;
type Event = Tables<"Event">;
type Registration = Tables<"Registration">;
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** One event on a member's record: their own registration, or a team that lists them. */
type RecordEntry = {
  key: string;
  event: Event;
  points: number | null;
  role: "self" | "lead" | "teammate";
  team?: Pick<TeamMembership, "teamName" | "leadId" | "leadName">;
};

const UPCOMING = ["OPEN", "CLOSED"];
const IST = "Asia/Kolkata";

async function fetchUserProfileData(userId: string, supabase: Supabase): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("PublicUserProfile")
    .select("id, name, department, year, currentRating")
    .eq("id", userId)
    .single();
  if (error) {
    if (error.code !== "PGRST116") console.error("Error fetching user profile:", error.message);
    return null;
  }
  return data as UserProfile;
}

async function fetchOwnRegistrations(
  userId: string,
  supabase: Supabase
): Promise<(Registration & { Event: Event })[]> {
  const { data, error } = await supabase
    .from("Registration")
    .select(`*, Event!inner(*)`)
    .eq("userId", userId)
    .in("Event.status", [...UPCOMING, "DONE"]);
  if (error) {
    console.error("Error fetching registrations:", error.message);
    return [];
  }
  return data as (Registration & { Event: Event })[];
}

/** Events where a teammate registered this member by register number. */
async function fetchTeamEntries(userId: string, supabase: Supabase): Promise<RecordEntry[]> {
  const memberships = await fetchTeamMemberships(supabase, userId);
  if (memberships.length === 0) return [];

  const { data: events, error } = await supabase
    .from("Event")
    .select("*")
    .in("id", memberships.map((m) => m.eventId))
    .in("status", [...UPCOMING, "DONE"]);
  if (error) {
    console.error("Error fetching team events:", error.message);
    return [];
  }

  const byId = new Map((events as Event[]).map((e) => [e.id, e]));
  return memberships.flatMap((m) => {
    const event = byId.get(m.eventId);
    return event
      ? [{ key: `team-${m.registrationId}`, event, points: null, role: "teammate" as const, team: m }]
      : [];
  });
}

export async function generateMetadata({
  params: paramsFromProps,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const params = await paramsFromProps;
  const supabase = await createClient();
  const userProfile = await fetchUserProfileData(params.userId, supabase);
  if (!userProfile) {
    return {
      title: "User Not Found - ACE SASTRA",
      description: "The requested user profile could not be found.",
    };
  }

  const title = `${userProfile.name} - ACE SASTRA Member`;
  const description = `View ${userProfile.name}'s profile at ACE SASTRA.`;
  const url = getAbsoluteUrl(`/user/${params.userId}`);

  return {
    title,
    description,
    openGraph: { title, description, url, siteName: CONFIG.site.name, locale: "en_US", type: "profile" },
  };
}

function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function dateParts(iso: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: IST })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value])
  );
  return { day: p.day, month: p.month, weekday: p.weekday, year: p.year };
}

export default async function UserProfilePage({
  params: paramsFromProps,
}: {
  params: Promise<{ userId: string }>;
}) {
  const params = await paramsFromProps;
  const pageUserId = params.userId;
  const supabase = await createClient();

  const [userProfile, ownRegs, teamEntries, auth] = await Promise.all([
    fetchUserProfileData(pageUserId, supabase),
    fetchOwnRegistrations(pageUserId, supabase),
    fetchTeamEntries(pageUserId, supabase),
    supabase.auth.getUser(),
  ]);

  if (!userProfile) notFound();

  const isSelf = auth.data.user?.id === pageUserId;

  const ownEntries: RecordEntry[] = ownRegs.map((r) => ({
    key: r.id,
    event: r.Event,
    points: r.points,
    role: r.Event.participationMode === "TEAM" ? "lead" : "self",
  }));
  // A member is never both lead and teammate for one event (register_for_event refuses it),
  // but keep their own registration if old data says otherwise.
  const ownEventIds = new Set(ownEntries.map((e) => e.event.id));
  const entries = [...ownEntries, ...teamEntries.filter((e) => !ownEventIds.has(e.event.id))];

  const byStart = (a: RecordEntry, b: RecordEntry) =>
    new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime();
  const upcoming = entries.filter((e) => UPCOMING.includes(e.event.status)).sort(byStart);
  const history = entries.filter((e) => e.event.status === "DONE").sort((a, b) => byStart(b, a));
  const totalPoints = history.reduce((sum, e) => sum + (e.points ?? 0), 0);

  const name = userProfile.name || "ACE member";
  // "year" holds either the year of study (1-5) or, for most members, the graduating batch (e.g. 2027).
  const yearLabel =
    userProfile.year == null ? null : userProfile.year > 10 ? `Batch of ${userProfile.year}` : `Year ${userProfile.year}`;
  const meta = [userProfile.department, yearLabel].filter(Boolean);

  const facts: [string, string][] = [
    ["Rating", userProfile.currentRating != null ? String(userProfile.currentRating) : "—"],
    ["Events done", String(history.length)],
    ["Points", String(totalPoints)],
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 sm:pb-36">
      {/* Identity */}
      <header className="grid gap-10 border-b border-border pb-10 pt-10 sm:pt-16 lg:grid-cols-12 lg:items-end lg:gap-8 lg:pb-14">
        <div className="lg:col-span-8">
          <div
            aria-hidden="true"
            className="grid size-16 place-items-center bg-foreground font-display text-2xl text-background sm:size-20 sm:text-3xl"
          >
            {initialsOf(userProfile.name)}
          </div>
          <h1 className="mt-8 max-w-[14ch] text-balance break-words font-display text-[clamp(2.75rem,7.5vw,6.5rem)]">
            {name}
          </h1>
          {meta.length > 0 && (
            <p className="mt-5 text-lg text-muted-foreground">{meta.join(" · ")}</p>
          )}
        </div>

        <div className="lg:col-span-4">
          <dl className="grid grid-cols-3 border-t border-border">
            {facts.map(([k, v], i) => (
              <div key={k} className={cn("border-b border-border py-4 sm:py-5", i < 2 && "pr-4")}>
                <dt className="label text-muted-foreground">{k}</dt>
                <dd className="mt-1 font-mono text-3xl tabular leading-none sm:text-4xl">{v}</dd>
              </div>
            ))}
          </dl>
          {isSelf && (
            <Link
              href="/settings"
              className="group mt-6 inline-flex h-12 w-full items-center justify-between gap-6 border border-foreground/25 px-5 font-semibold transition-colors hover:bg-foreground hover:text-background"
            >
              Edit contact details
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </header>

      <ProfileSection
        id="upcoming"
        title="Upcoming"
        count={upcoming.length}
        intro={isSelf ? "Events you’re registered for, including teams that added you by register number." : undefined}
      >
        {upcoming.length > 0 ? (
          <EventList entries={upcoming} isSelf={isSelf} />
        ) : (
          <Empty
            text={isSelf ? "You aren’t registered for anything coming up." : `${name} isn’t registered for anything coming up.`}
            action={isSelf ? { href: "/events/upcoming", label: "See open events" } : undefined}
          />
        )}
      </ProfileSection>

      <ProfileSection id="history" title="History" count={history.length}>
        {history.length > 0 ? (
          <EventList entries={history} isSelf={isSelf} past />
        ) : (
          <Empty text="No completed events yet." />
        )}
      </ProfileSection>

    </div>
  );
}

function ProfileSection({
  id,
  title,
  count,
  intro,
  children,
}: {
  id: string;
  title: string;
  count: number;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="grid gap-8 border-b border-border py-14 sm:py-20 lg:grid-cols-12 lg:gap-8"
    >
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <h2
            id={`${id}-heading`}
            className="flex items-baseline gap-4 text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:110%]"
          >
            {title}
            <span className="font-mono text-base font-normal tracking-normal tabular text-muted-foreground [font-stretch:100%]">
              {String(count).padStart(2, "0")}
            </span>
          </h2>
          {intro && <p className="mt-4 max-w-[36ch] leading-relaxed text-muted-foreground">{intro}</p>}
        </div>
      </div>
      <div className="lg:col-span-8">{children}</div>
    </section>
  );
}

function EventList({ entries, isSelf, past = false }: { entries: RecordEntry[]; isSelf: boolean; past?: boolean }) {
  return (
    <ul className="border-t border-border">
      {entries.map((entry) => {
        const { event } = entry;
        const d = dateParts(event.startTime);
        const tags = [
          EVENT_TYPE_NAME[event.type] ?? event.type,
          event.status === "CLOSED" ? "Registration closed" : null,
          event.location,
        ].filter(Boolean);

        return (
          <li key={entry.key} className="relative border-b border-border">
            <Link
              // Your own upcoming entries open the registration (seat, team, payment); everything else the event page.
              href={isSelf && !past ? `/events/${event.id}/register` : `/events/${event.id}`}
              className="group grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-start gap-4 py-6 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:gap-6 sm:py-8"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-[-1px] h-px origin-left scale-x-0 bg-primary transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <span className="font-mono tabular">
                <span className={cn("block whitespace-nowrap text-xl leading-none sm:text-3xl", !past && "text-primary")}>
                  {d.day} {d.month}
                </span>
                <span className="mt-2 block whitespace-nowrap text-xs text-muted-foreground">
                  {d.weekday} {d.year}
                  {!past && <span className="hidden sm:inline"> · {formatTime(event.startTime)}</span>}
                </span>
              </span>

              <span className="min-w-0">
                <span className="block text-xl font-semibold leading-tight tracking-[-0.02em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 sm:text-2xl">
                  {event.name}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">{tags.join(" · ")}</span>
                {entry.role === "teammate" && entry.team && (
                  <span className="mt-3 inline-flex flex-wrap items-baseline gap-x-2 border-l border-primary pl-3 text-sm">
                    <span className="font-semibold">Team {entry.team.teamName}</span>
                    {entry.team.leadName && (
                      <span className="text-muted-foreground">
                        · {isSelf ? "added by" : "led by"} {entry.team.leadName}
                      </span>
                    )}
                  </span>
                )}
                {entry.role === "lead" && (
                  <span className="mt-3 inline-flex border-l border-primary pl-3 text-sm font-semibold">Team lead</span>
                )}
              </span>

              <span className="flex flex-col items-end gap-2">
                {past && entry.points != null && (
                  <span className="font-mono text-lg tabular text-primary">+{entry.points}</span>
                )}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 text-muted-foreground transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ text, action }: { text: string; action?: { href: string; label: string } }) {
  return (
    <div className="border-y border-border py-10">
      <p className="text-lg text-muted-foreground">{text}</p>
      {action && (
        <Link
          href={action.href}
          className="group mt-6 inline-flex h-12 items-center justify-between gap-8 bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          {action.label}
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
