-- Allow anon SELECT/UPDATE for payment success polling and secure download flow.
-- Purchase IDs and download tokens are unguessable UUIDs/tokens.

drop policy if exists "Public read purchases for payment flow" on purchases;
drop policy if exists "Public mark purchase downloaded" on purchases;

create policy "Public read purchases for payment flow"
  on purchases
  for select
  to anon, authenticated
  using (status in ('pending', 'paid'));

create policy "Public mark purchase downloaded"
  on purchases
  for update
  to anon, authenticated
  using (status = 'paid' and download_token is not null)
  with check (status = 'paid');
