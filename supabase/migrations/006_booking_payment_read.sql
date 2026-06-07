-- Allow anon SELECT on bookings during deposit payment flow (UUID refs are unguessable).

drop policy if exists "Public read bookings for payment flow" on bookings;

create policy "Public read bookings for payment flow"
  on bookings
  for select
  to anon, authenticated
  using (status in ('deposit_requested', 'deposit_paid'));
