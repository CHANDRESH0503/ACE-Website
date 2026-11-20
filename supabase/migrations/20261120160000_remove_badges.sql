-- =============================================================================
-- Remove badges (2026-11-20)
--
-- Badges are gone from the site. This drops the tables behind them.
--
--   * DESTRUCTIVE: every badge definition and every awarded badge is deleted.
--     Export "Badge" and "UserBadge" first if you might want them back.
--   * get_dashboard_stats() no longer reports badgeCount.
--   * The "badges" storage bucket (badge icons) is not touched here: Supabase
--     does not allow deleting storage objects from SQL. Empty and delete it in
--     the dashboard (Storage → badges).
--
-- Idempotent; runs in one transaction. Requires 20261115120000.
-- =============================================================================

begin;

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
    'messageCount', (select count(*) from public."ContactMessage")
  );
end;
$function$;

drop table if exists public."UserBadge";
drop table if exists public."Badge";
drop type if exists public."BadgeType";

notify pgrst, 'reload schema';

commit;
