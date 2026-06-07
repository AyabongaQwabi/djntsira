-- pg_cron jobs: daily booking reminders + pending purchase cleanup

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Remove existing jobs when re-applying migration
do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobname from cron.job
    where jobname in ('daily-booking-reminders', 'cleanup-pending-purchases')
  loop
    perform cron.unschedule(existing_job.jobname);
  end loop;
exception
  when undefined_table then
    null;
end $$;

-- Delete abandoned pending purchases older than 24 hours
create or replace function public.cleanup_pending_purchases()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from purchases
  where status = 'pending'
    and created_at < now() - interval '24 hours';
end;
$$;

revoke all on function public.cleanup_pending_purchases() from public;
grant execute on function public.cleanup_pending_purchases() to postgres;

select cron.schedule(
  'cleanup-pending-purchases',
  '0 * * * *',
  $$select public.cleanup_pending_purchases();$$
);

-- Invoke send-booking-reminder edge function at 06:00 UTC (08:00 SAST)
-- Requires vault secrets: project_url, service_role_key
-- Example (run once in SQL editor after deploy):
--   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
--   select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
create or replace function public.invoke_send_booking_reminder()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  project_url text;
  service_key text;
begin
  select decrypted_secret
  into project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret
  into service_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if project_url is null or service_key is null then
    raise warning 'daily-booking-reminders skipped: configure vault secrets project_url and service_role_key';
    return;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/send-booking-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.invoke_send_booking_reminder() from public;
grant execute on function public.invoke_send_booking_reminder() to postgres;

select cron.schedule(
  'daily-booking-reminders',
  '0 6 * * *',
  $$select public.invoke_send_booking_reminder();$$
);
