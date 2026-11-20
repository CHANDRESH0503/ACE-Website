-- =============================================================================
-- Event registration report (2026-11-20)
--
-- The built-in registration form (/events/[id]/register) writes straight to
-- "Registration" through the existing RLS policy and guard trigger, and keeps
-- the member's mobile number on "UserProfile". The admin report
-- (/admin/events/[id]) reads both through the existing admin policies.
--
-- The one thing the API cannot reach is the registrant's email, which lives
-- in auth.users. This function returns it for one event, to admins only.
--
-- Idempotent; runs in one transaction.
-- =============================================================================

begin;

create or replace function public.admin_event_registrant_emails(p_event_id uuid)
returns table ("userId" uuid, email text)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  return query
    select r."userId", u.email::text
      from public."Registration" r
      join auth.users u on u.id = r."userId"
     where r."eventId" = p_event_id;
end;
$$;

revoke execute on function public.admin_event_registrant_emails(uuid) from public, anon;
grant execute on function public.admin_event_registrant_emails(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
