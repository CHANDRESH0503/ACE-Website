-- =============================================================================
-- Security hardening (2026-11-15)
--
-- Fixes found in an audit of the live database:
--   * Event / Badge / UserBadge had a FOR ALL policy with USING (true), so
--     anyone, including anonymous visitors, could DELETE every row.
--   * UserProfile let the `anon` role SELECT and DELETE every profile
--     (registration numbers and phone numbers were public).
--   * add_admin_user / remove_admin_user / create_new_user_profile could be
--     called by anyone through /rest/v1/rpc, so any visitor could make
--     themselves an admin.
--   * Payment rows were readable by everyone, and users could insert their own
--     "completed" payments.
--   * Users could insert Registration rows with any points, attended or
--     paymentStatus value, which also changed the leaderboard rating.
--   * Users could update every column of their own profile, including
--     currentRating, registrationNumber and name.
--   * PaymentRefund rows could be inserted by users with any status or amount.
--
-- The whole migration is idempotent and runs in one transaction.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Helper: true when the request is from an end user (anon or authenticated
--    JWT) rather than service_role, postgres or the SQL editor.
-- -----------------------------------------------------------------------------
create or replace function public.is_end_user_request()
returns boolean
language sql
stable
set search_path to ''
as $$
  select coalesce(auth.role(), '') in ('anon', 'authenticated');
$$;

-- -----------------------------------------------------------------------------
-- 1. Table privileges: no TRUNCATE / TRIGGER / REFERENCES for API roles.
--    (TRUNCATE ignores RLS.)
-- -----------------------------------------------------------------------------
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Event / Badge / UserBadge: public read, admin-only writes.
-- -----------------------------------------------------------------------------
drop policy if exists "Event unified access policy" on public."Event";
drop policy if exists "Event read policy" on public."Event";
drop policy if exists "Event admin insert policy" on public."Event";
drop policy if exists "Event admin update policy" on public."Event";
drop policy if exists "Event admin delete policy" on public."Event";
create policy "Event read policy" on public."Event" for select to anon, authenticated using (true);
create policy "Event admin insert policy" on public."Event" for insert to authenticated with check ((select public.is_admin()));
create policy "Event admin update policy" on public."Event" for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Event admin delete policy" on public."Event" for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Badge unified access policy" on public."Badge";
drop policy if exists "Badge read policy" on public."Badge";
drop policy if exists "Badge admin insert policy" on public."Badge";
drop policy if exists "Badge admin update policy" on public."Badge";
drop policy if exists "Badge admin delete policy" on public."Badge";
create policy "Badge read policy" on public."Badge" for select to anon, authenticated using (true);
create policy "Badge admin insert policy" on public."Badge" for insert to authenticated with check ((select public.is_admin()));
create policy "Badge admin update policy" on public."Badge" for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Badge admin delete policy" on public."Badge" for delete to authenticated using ((select public.is_admin()));

drop policy if exists "UserBadge unified access policy" on public."UserBadge";
drop policy if exists "UserBadge read policy" on public."UserBadge";
drop policy if exists "UserBadge admin insert policy" on public."UserBadge";
drop policy if exists "UserBadge admin update policy" on public."UserBadge";
drop policy if exists "UserBadge admin delete policy" on public."UserBadge";
create policy "UserBadge read policy" on public."UserBadge" for select to anon, authenticated using (true);
create policy "UserBadge admin insert policy" on public."UserBadge" for insert to authenticated with check ((select public.is_admin()));
create policy "UserBadge admin update policy" on public."UserBadge" for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "UserBadge admin delete policy" on public."UserBadge" for delete to authenticated using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 3. UserProfile: a user (or an admin) can read the full row. Everyone else
--    reads the PublicUserProfile view, which leaves out the phone number and
--    registration number.
-- -----------------------------------------------------------------------------
drop policy if exists "UserProfile comprehensive access policy" on public."UserProfile";
drop policy if exists "Users can read their own profile optimized" on public."UserProfile";
drop policy if exists "Users can update their own profile optimized" on public."UserProfile";
drop policy if exists "UserProfile read own or admin" on public."UserProfile";
drop policy if exists "UserProfile update own or admin" on public."UserProfile";
drop policy if exists "UserProfile admin insert" on public."UserProfile";
drop policy if exists "UserProfile admin delete" on public."UserProfile";

create policy "UserProfile read own or admin" on public."UserProfile"
  for select to authenticated
  using (((select auth.uid()) = id) or (select public.is_admin()));
create policy "UserProfile update own or admin" on public."UserProfile"
  for update to authenticated
  using (((select auth.uid()) = id) or (select public.is_admin()))
  with check (((select auth.uid()) = id) or (select public.is_admin()));
-- Profiles are created by the auth.users trigger (security definer).
create policy "UserProfile admin insert" on public."UserProfile"
  for insert to authenticated with check ((select public.is_admin()));
create policy "UserProfile admin delete" on public."UserProfile"
  for delete to authenticated using ((select public.is_admin()));

-- Non-admin users may only change their own contactNumber.
create or replace function public.guard_user_profile_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    if new.id is distinct from old.id
       or new.name is distinct from old.name
       or new."registrationNumber" is distinct from old."registrationNumber"
       or new.department is distinct from old.department
       or new.year is distinct from old.year
       or new."currentRating" is distinct from old."currentRating" then
      raise exception 'Only contactNumber can be updated'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_user_profile_update on public."UserProfile";
create trigger guard_user_profile_update
  before update on public."UserProfile"
  for each row execute function public.guard_user_profile_update();

-- Public, non-sensitive view (runs as owner, so it ignores UserProfile RLS by
-- design and exposes only these columns).
create or replace view public."PublicUserProfile"
with (security_invoker = false)
as
select id, name, department, year, "currentRating"
from public."UserProfile";

revoke all on public."PublicUserProfile" from anon, authenticated;
grant select on public."PublicUserProfile" to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Registration: users can insert their own row only. Server-side fields are
--    set by a trigger so they can't be forged.
-- -----------------------------------------------------------------------------
create or replace function public.guard_registration_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  ev record;
  taken integer;
begin
  if public.is_end_user_request() and not public.is_admin() then
    select status, "isFeeRequired", "registrationFee", "maxCapacity"
      into ev
      from public."Event"
     where id = new."eventId"
     for update;  -- serialises capacity checks per event

    if not found then
      raise exception 'Event not found' using errcode = 'P0002';
    end if;

    if ev.status <> 'OPEN' then
      raise exception 'Registration is closed for this event' using errcode = '42501';
    end if;

    if ev."maxCapacity" is not null then
      select count(*) into taken from public."Registration" where "eventId" = new."eventId";
      if taken >= ev."maxCapacity" then
        raise exception 'This event is full' using errcode = '42501';
      end if;
    end if;

    new.points          := null;
    new.attended        := null;
    new."paymentId"     := null;
    new."paymentStatus" := 'pending';
    new."registrationFee" := case when coalesce(ev."isFeeRequired", false)
                                  then ev."registrationFee" else 0 end;
    new."registeredAt"  := now();
  end if;
  return new;
end;
$$;

drop trigger if exists guard_registration_insert on public."Registration";
create trigger guard_registration_insert
  before insert on public."Registration"
  for each row execute function public.guard_registration_insert();

-- Insert: own row only (admin may insert for anyone). Update/delete stay admin-only.
drop policy if exists "Registration insert policy" on public."Registration";
create policy "Registration insert policy" on public."Registration"
  for insert to authenticated
  with check (((select auth.uid()) = "userId") or (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 5. Payment: only the payment's owner and admins can read it. Writes go
--    through the server (service_role) after Razorpay checks the payment.
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read payments" on public."Payment";
drop policy if exists "Users can create their own payments" on public."Payment";

-- -----------------------------------------------------------------------------
-- 6. PaymentRefund: admins manage refunds; users can only view their own.
-- -----------------------------------------------------------------------------
drop policy if exists "Users can request refunds" on public."PaymentRefund";

-- -----------------------------------------------------------------------------
-- 7. Feedback: only users who registered for the event can submit it.
-- -----------------------------------------------------------------------------
drop policy if exists "Users can submit their own feedback" on public."Feedback";
create policy "Users can submit their own feedback" on public."Feedback"
  for insert to authenticated
  with check (
    "userId" = (select auth.uid())
    and exists (
      select 1 from public."Registration" r
       where r."eventId" = "Feedback"."eventId"
         and r."userId" = (select auth.uid())
    )
  );

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'Feedback_comment_length') then
    alter table public."Feedback" add constraint "Feedback_comment_length"
      check (comment is null or char_length(comment) <= 2000);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 8. ContactMessage (public insert): limit sizes to slow down abuse.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ContactMessage_name_length') then
    alter table public."ContactMessage" add constraint "ContactMessage_name_length"
      check (char_length(btrim(name)) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ContactMessage_email_format') then
    alter table public."ContactMessage" add constraint "ContactMessage_email_format"
      check (char_length(email) <= 320 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ContactMessage_message_length') then
    alter table public."ContactMessage" add constraint "ContactMessage_message_length"
      check (char_length(btrim(message)) between 1 and 5000);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 9. Privileged RPCs: callers must be admins (service_role / SQL editor still work).
-- -----------------------------------------------------------------------------
create or replace function public.add_admin_user(user_email text)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  target_user_id uuid;
begin
  if public.is_end_user_request() and not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select id into target_user_id from auth.users where email = user_email;
  if target_user_id is null then
    raise exception 'User with email % not found', user_email;
  end if;

  if not exists (select 1 from public."UserProfile" where id = target_user_id) then
    raise exception 'User % does not have a UserProfile', user_email;
  end if;

  insert into public."userAdmins" ("userId", "isAdmin")
  values (target_user_id, true)
  on conflict ("userId") do update set "isAdmin" = true;

  return true;
end;
$function$;

create or replace function public.remove_admin_user(user_email text)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  target_user_id uuid;
begin
  if public.is_end_user_request() and not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select id into target_user_id from auth.users where email = user_email;
  if target_user_id is null then
    raise exception 'User with email % not found', user_email;
  end if;

  update public."userAdmins" set "isAdmin" = false where "userId" = target_user_id;
  return true;
end;
$function$;

create or replace function public.create_new_user_profile(
  p_user_id uuid, p_name text, p_registration_number text, p_year integer, p_department text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if public.is_end_user_request() and not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  insert into public."UserProfile" ("id", "name", "registrationNumber", "year", "department")
  values (p_user_id, p_name, p_registration_number, p_year, p_department)
  on conflict ("registrationNumber") do nothing;
end;
$function$;

create or replace function public.get_dashboard_stats()
returns json
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if public.is_end_user_request() and not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  return json_build_object(
    'userCount',    (select count(*) from public."UserProfile"),
    'eventCount',   (select count(*) from public."Event"),
    'messageCount', (select count(*) from public."ContactMessage"),
    'badgeCount',   (select count(*) from public."Badge")
  );
end;
$function$;

revoke execute on function public.add_admin_user(text) from public, anon;
revoke execute on function public.remove_admin_user(text) from public, anon;
revoke execute on function public.create_new_user_profile(uuid, text, text, integer, text) from public, anon;
revoke execute on function public.get_dashboard_stats() from public, anon;
grant execute on function public.add_admin_user(text) to authenticated, service_role;
grant execute on function public.remove_admin_user(text) to authenticated, service_role;
grant execute on function public.create_new_user_profile(uuid, text, text, integer, text) to authenticated, service_role;
grant execute on function public.get_dashboard_stats() to authenticated, service_role;

-- Trigger functions should not be callable as RPCs.
revoke execute on function public.validate_email_domain() from public, anon, authenticated;
revoke execute on function public.create_user_profile_on_signup() from public, anon, authenticated;
revoke execute on function public.update_user_current_rating_from_registration() from public, anon, authenticated;
revoke execute on function public.guard_user_profile_update() from public, anon, authenticated;
revoke execute on function public.guard_registration_insert() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
