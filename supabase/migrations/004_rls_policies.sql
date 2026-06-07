-- Tighten RLS for email_logs and sent_campaigns (PRD audit tables)

alter table email_logs enable row level security;
alter table sent_campaigns enable row level security;

drop policy if exists "Admin all email_logs" on email_logs;
drop policy if exists "Admin all sent_campaigns" on sent_campaigns;

-- Admin dashboard: read-only access to delivery logs
create policy "Admin read email_logs"
  on email_logs
  for select
  to authenticated
  using (auth.role() = 'authenticated');

-- Admin dashboard: read campaign history
create policy "Admin read sent_campaigns"
  on sent_campaigns
  for select
  to authenticated
  using (auth.role() = 'authenticated');

-- No anon/authenticated insert/update/delete policies.
-- Edge functions use the service role key and bypass RLS for writes.
