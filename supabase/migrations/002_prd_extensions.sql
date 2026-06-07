-- PRD extensions: purchase status, marketing opt-out, email logging, campaign tracking

-- Purchases: pending/paid lifecycle (never mark paid on redirect alone — webhook confirms)
alter table purchases
  add column status text check (status in ('pending', 'paid')) default 'pending',
  add column paid_at timestamptz default null;

create index purchases_status_created_at_idx on purchases (status, created_at);
create index purchases_download_token_idx on purchases (download_token);

-- Customers: marketing opt-out for bulk email compliance
alter table customers
  add column marketing_opted_out boolean not null default false;

create unique index customers_email_unique_idx on customers (lower(email));

-- Email delivery audit trail (PRD mandatory)
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  trigger_name text not null,
  recipient text not null,
  status text check (status in ('sent', 'failed')) not null,
  error_message text default null,
  payload_ref text default null,
  created_at timestamptz default now()
);

create index email_logs_created_at_idx on email_logs (created_at desc);
create index email_logs_status_idx on email_logs (status);

-- Marketing campaign history
create table sent_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  recipient_count integer not null default 0,
  sent_at timestamptz default now()
);

create index sent_campaigns_sent_at_idx on sent_campaigns (sent_at desc);

-- RLS for new tables
alter table email_logs enable row level security;
alter table sent_campaigns enable row level security;

create policy "Admin all email_logs" on email_logs for all using (auth.role() = 'authenticated');
create policy "Admin all sent_campaigns" on sent_campaigns for all using (auth.role() = 'authenticated');

-- Clash trigger: only active blocking statuses; cancelled/completed reopen slots immediately
-- Blocking: pending, deposit_requested, deposit_paid, confirmed
create or replace function check_booking_clash()
returns trigger as $$
declare
  clashing_count integer;
begin
  select count(*) into clashing_count
  from bookings
  where event_date = NEW.event_date
    and id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and status in ('pending', 'deposit_requested', 'deposit_paid', 'confirmed')
    and (NEW.start_time < end_time and NEW.end_time > start_time);

  if clashing_count > 0 then
    raise exception 'BOOKING_CLASH: Time slot overlaps with an existing booking.';
  end if;
  return NEW;
end;
$$ language plpgsql;
