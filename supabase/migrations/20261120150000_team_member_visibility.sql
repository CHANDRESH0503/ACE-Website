-- =============================================================================
-- Team member visibility (2026-11-20)
--
-- A team registration writes one "Registration" row (the lead) and one
-- "RegistrationTeam" row listing the other members by name and register
-- number. Teammates had no way to see that they were registered.
--
--   * team_memberships(p_user_id, p_event_id) returns the team registrations
--     whose member list carries that user's register number. It matches by
--     register number at read time, so a teammate who creates their ACE
--     profile after the team registered is picked up automatically.
--     Only event, team and lead are returned; teammates' register numbers
--     never leave the table. Member names are returned only to the member
--     themselves and to admins.
--   * is_team_member(p_event_id, p_user_id) is the boolean form, used by RLS.
--   * Feedback: listed teammates may give feedback, as the lead can.
--   * A GIN index makes the member lookup an index scan.
--
-- Idempotent; runs in one transaction. Requires 20261120130000.
-- =============================================================================

begin;

create index if not exists idx_registrationteam_members
  on public."RegistrationTeam" using gin (members jsonb_path_ops);

-- -----------------------------------------------------------------------------
-- 1. team_memberships(): teams a member is listed on (not as lead).
-- -----------------------------------------------------------------------------
create or replace function public.team_memberships(
  p_user_id  uuid,
  p_event_id uuid default null
)
returns table (
  "eventId"        uuid,
  "registrationId" uuid,
  "teamName"       text,
  "teamSize"       smallint,
  "leadId"         uuid,
  "leadName"       text,
  "memberNames"    text[],
  "registeredAt"   timestamptz,
  "paymentStatus"  text
)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  rn        text;
  see_names boolean := (select auth.uid()) = p_user_id or public.is_admin();
begin
  select upper(regexp_replace(coalesce(p."registrationNumber", ''), '\s', '', 'g'))
    into rn
    from public."UserProfile" p
   where p.id = p_user_id;

  if rn is null or rn = '' then
    return;
  end if;

  return query
    select t."eventId",
           t."registrationId",
           t."teamName",
           t."teamSize",
           r."userId",
           lp.name,
           case when see_names
                then array(select e ->> 'name' from jsonb_array_elements(t.members) e)
                else null end,
           r."registeredAt",
           r."paymentStatus"::text
      from public."RegistrationTeam" t
      join public."Registration" r on r.id = t."registrationId"
      left join public."UserProfile" lp on lp.id = r."userId"
     where t.members @> jsonb_build_array(jsonb_build_object('registrationNumber', rn))
       and r."userId" <> p_user_id
       and (p_event_id is null or t."eventId" = p_event_id);
end;
$$;

revoke execute on function public.team_memberships(uuid, uuid) from public;
grant execute on function public.team_memberships(uuid, uuid) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. is_team_member(): is this user listed on a team for this event?
-- -----------------------------------------------------------------------------
create or replace function public.is_team_member(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1
      from public."RegistrationTeam" t
      join public."UserProfile" p on p.id = p_user_id
     where t."eventId" = p_event_id
       and coalesce(p."registrationNumber", '') <> ''
       and t.members @> jsonb_build_array(jsonb_build_object(
             'registrationNumber', upper(regexp_replace(p."registrationNumber", '\s', '', 'g'))))
  );
$$;

revoke execute on function public.is_team_member(uuid, uuid) from public, anon;
grant execute on function public.is_team_member(uuid, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Feedback: registered members and their listed teammates.
-- -----------------------------------------------------------------------------
drop policy if exists "Users can submit their own feedback" on public."Feedback";
create policy "Users can submit their own feedback" on public."Feedback"
  for insert to authenticated
  with check (
    "userId" = (select auth.uid())
    and (
      exists (
        select 1 from public."Registration" r
         where r."eventId" = "Feedback"."eventId"
           and r."userId" = (select auth.uid())
      )
      or public.is_team_member("Feedback"."eventId", (select auth.uid()))
    )
  );

notify pgrst, 'reload schema';

commit;
