-- =============================================================================
-- Team registration (2026-11-20)
--
--   * Event gets "participationMode" (INDIVIDUAL | TEAM) and "teamSizes", the
--     team sizes the admin allows (any of 2, 3, 4).
--   * Team details live in "RegistrationTeam", readable only by the team lead
--     and admins. ("Registration" stays publicly readable for the participant
--     lists and public profiles, so teammates' register numbers must not be
--     stored there.)
--   * register_for_event() is the one way members register: signed-in only,
--     validates the team, rejects anyone already registered for the event (as
--     a lead or as a teammate) and writes both rows in one transaction.
--   * A deferred constraint trigger refuses a team-event registration that
--     arrives without team details, so the old direct insert can't bypass it.
--   * Admins may upload posters to the event-images bucket.
--
-- Idempotent; runs in one transaction. Requires 20261115120000.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Event: participation mode and allowed team sizes.
-- -----------------------------------------------------------------------------
alter table public."Event" add column if not exists "participationMode" text not null default 'INDIVIDUAL';
alter table public."Event" add column if not exists "teamSizes" smallint[];

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'Event_participationMode_check') then
    alter table public."Event" add constraint "Event_participationMode_check"
      check ("participationMode" in ('INDIVIDUAL', 'TEAM'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'Event_teamSizes_check') then
    alter table public."Event" add constraint "Event_teamSizes_check"
      check (
        ("participationMode" = 'INDIVIDUAL' and "teamSizes" is null)
        or ("participationMode" = 'TEAM'
            and "teamSizes" is not null
            and cardinality("teamSizes") between 1 and 3
            and "teamSizes" <@ array[2, 3, 4]::smallint[])
      );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. RegistrationTeam: one row per team registration.
--    members = [{ "name": text, "registrationNumber": text }, ...] (excluding the lead)
-- -----------------------------------------------------------------------------
create table if not exists public."RegistrationTeam" (
  "registrationId" uuid primary key references public."Registration"(id) on delete cascade,
  "eventId"        uuid not null references public."Event"(id) on delete cascade,
  "teamName"       text not null,
  "teamSize"       smallint not null,
  members          jsonb not null,
  "createdAt"      timestamptz not null default now(),
  constraint "RegistrationTeam_teamName_length" check (char_length(btrim("teamName")) between 1 and 60),
  constraint "RegistrationTeam_teamSize_range" check ("teamSize" between 2 and 4),
  constraint "RegistrationTeam_members_shape" check (
    jsonb_typeof(members) = 'array' and jsonb_array_length(members) = "teamSize" - 1
  )
);

create unique index if not exists "RegistrationTeam_event_teamName_key"
  on public."RegistrationTeam" ("eventId", lower(btrim("teamName")));
create index if not exists idx_registrationteam_eventid on public."RegistrationTeam" ("eventId");

alter table public."RegistrationTeam" enable row level security;

revoke all on table public."RegistrationTeam" from anon, authenticated;
grant select, insert, update, delete on table public."RegistrationTeam" to authenticated;
grant all on table public."RegistrationTeam" to service_role;

drop policy if exists "RegistrationTeam read own or admin" on public."RegistrationTeam";
drop policy if exists "RegistrationTeam admin insert" on public."RegistrationTeam";
drop policy if exists "RegistrationTeam admin update" on public."RegistrationTeam";
drop policy if exists "RegistrationTeam admin delete" on public."RegistrationTeam";

create policy "RegistrationTeam read own or admin" on public."RegistrationTeam"
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public."Registration" r
       where r.id = "RegistrationTeam"."registrationId"
         and r."userId" = (select auth.uid())
    )
  );
-- Members write through register_for_event(); admins may correct rows directly.
create policy "RegistrationTeam admin insert" on public."RegistrationTeam"
  for insert to authenticated with check ((select public.is_admin()));
create policy "RegistrationTeam admin update" on public."RegistrationTeam"
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "RegistrationTeam admin delete" on public."RegistrationTeam"
  for delete to authenticated using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 3. register_for_event(): the member-facing registration entry point.
--    Returns the Registration id. Raises 23505 if the caller is already
--    registered, 42501 for rule violations (message is shown to the member).
-- -----------------------------------------------------------------------------
create or replace function public.register_for_event(
  p_event_id  uuid,
  p_team_name text    default null,
  p_team_size integer default null,
  p_members   jsonb   default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  uid      uuid := auth.uid();
  ev       record;
  me       record;
  reg_id   uuid;
  clean    jsonb := '[]'::jsonb;
  m        jsonb;
  nm       text;
  rn       text;
  lead_rn  text;
  seen     text[];
  clash    text;
begin
  if uid is null then
    raise exception 'Sign in with your SASTRA account to register' using errcode = '42501';
  end if;

  -- Lock the event row: serialises registrations (and the clash checks below) per event.
  select id, "participationMode", "teamSizes"
    into ev
    from public."Event"
   where id = p_event_id
     for update;
  if not found then
    raise exception 'Event not found' using errcode = 'P0002';
  end if;

  select id, name, "registrationNumber" into me from public."UserProfile" where id = uid;
  if not found then
    raise exception 'No ACE member profile is linked to this account' using errcode = '42501';
  end if;

  if exists (select 1 from public."Registration" where "eventId" = p_event_id and "userId" = uid) then
    raise exception 'You are already registered for this event' using errcode = '23505';
  end if;

  if ev."participationMode" = 'TEAM' then
    if p_team_size is null or not (p_team_size::smallint = any (ev."teamSizes")) then
      raise exception 'Choose a team size this event allows' using errcode = '42501';
    end if;
    if p_team_name is null or char_length(btrim(p_team_name)) not between 1 and 60 then
      raise exception 'Give your team a name (up to 60 characters)' using errcode = '42501';
    end if;
    if p_members is null or jsonb_typeof(p_members) <> 'array'
       or jsonb_array_length(p_members) <> p_team_size - 1 then
      raise exception 'Add the name and register number of every team member' using errcode = '42501';
    end if;

    lead_rn := upper(regexp_replace(coalesce(me."registrationNumber", ''), '\s', '', 'g'));
    seen := array[lead_rn];

    for m in select value from jsonb_array_elements(p_members) loop
      nm := btrim(coalesce(m ->> 'name', ''));
      rn := upper(regexp_replace(coalesce(m ->> 'registrationNumber', ''), '\s', '', 'g'));
      if char_length(nm) not between 1 and 100 then
        raise exception 'Enter a name for every team member' using errcode = '42501';
      end if;
      if rn !~ '^[A-Z0-9]{5,20}$' then
        raise exception 'Check the register number for %', nm using errcode = '42501';
      end if;
      if rn = any (seen) then
        raise exception 'Register number % appears more than once in your team', rn using errcode = '42501';
      end if;
      seen := seen || rn;
      clean := clean || jsonb_build_object('name', nm, 'registrationNumber', rn);
    end loop;

    -- Nobody may be on two registrations for the same event.
    if exists (
      select 1 from public."RegistrationTeam" t, jsonb_array_elements(t.members) e
       where t."eventId" = p_event_id and e ->> 'registrationNumber' = lead_rn
    ) then
      raise exception 'You are already on a team for this event' using errcode = '42501';
    end if;

    select x into clash
      from unnest(seen[2:]) as x
     where exists (
             select 1
               from public."Registration" r
               join public."UserProfile" p on p.id = r."userId"
              where r."eventId" = p_event_id
                and upper(regexp_replace(p."registrationNumber", '\s', '', 'g')) = x)
        or exists (
             select 1 from public."RegistrationTeam" t, jsonb_array_elements(t.members) e
              where t."eventId" = p_event_id and e ->> 'registrationNumber' = x)
     limit 1;
    if clash is not null then
      raise exception '% is already registered for this event', clash using errcode = '42501';
    end if;

    if exists (
      select 1 from public."RegistrationTeam"
       where "eventId" = p_event_id and lower(btrim("teamName")) = lower(btrim(p_team_name))
    ) then
      raise exception 'Another team already uses the name "%"', btrim(p_team_name) using errcode = '42501';
    end if;
  end if;

  -- guard_registration_insert() still enforces OPEN status, capacity and server-set fields.
  insert into public."Registration" ("eventId", "userId")
  values (p_event_id, uid)
  returning id into reg_id;

  if ev."participationMode" = 'TEAM' then
    insert into public."RegistrationTeam" ("registrationId", "eventId", "teamName", "teamSize", members)
    values (reg_id, p_event_id, btrim(p_team_name), p_team_size, clean);
  end if;

  return reg_id;
end;
$$;

revoke execute on function public.register_for_event(uuid, text, integer, jsonb) from public, anon;
grant execute on function public.register_for_event(uuid, text, integer, jsonb) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. A team-event registration must come with its team row (checked at commit).
-- -----------------------------------------------------------------------------
create or replace function public.require_team_for_team_events()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin()
     and exists (select 1 from public."Event" e where e.id = new."eventId" and e."participationMode" = 'TEAM')
     and not exists (select 1 from public."RegistrationTeam" t where t."registrationId" = new.id) then
    raise exception 'Team events need team details. Register through the event''s form.' using errcode = '42501';
  end if;
  return null;
end;
$$;

drop trigger if exists require_team_for_team_events on public."Registration";
create constraint trigger require_team_for_team_events
  after insert on public."Registration"
  deferrable initially deferred
  for each row execute function public.require_team_for_team_events();

revoke execute on function public.require_team_for_team_events() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Posters: admins can upload, replace and remove files in event-images.
-- -----------------------------------------------------------------------------
drop policy if exists "event-images admin insert" on storage.objects;
drop policy if exists "event-images admin update" on storage.objects;
drop policy if exists "event-images admin delete" on storage.objects;
create policy "event-images admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-images' and (select public.is_admin()));
create policy "event-images admin update" on storage.objects
  for update to authenticated using (bucket_id = 'event-images' and (select public.is_admin()))
  with check (bucket_id = 'event-images' and (select public.is_admin()));
create policy "event-images admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'event-images' and (select public.is_admin()));

notify pgrst, 'reload schema';

commit;
