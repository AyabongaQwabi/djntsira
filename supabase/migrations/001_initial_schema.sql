-- CUSTOMERS
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  cell_number text not null,
  email text not null,
  type text check (type in ('buyer','booker','both')) default 'buyer',
  created_at timestamptz default now()
);

-- TRACKS
create table tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('full_song','stem')) not null,
  price numeric(10,2) not null,
  discount_type text check (discount_type in ('percent','flat')) default null,
  discount_value numeric(10,2) default null,
  discount_expires_at timestamptz default null,
  preview_duration integer check (preview_duration between 5 and 30) default 30,
  file_url text not null,
  cover_url text,
  published boolean default false,
  created_at timestamptz default now()
);

-- BUNDLES
create table bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  discount_type text check (discount_type in ('percent','flat')) default null,
  discount_value numeric(10,2) default null,
  discount_expires_at timestamptz default null,
  track_ids uuid[] not null default '{}',
  published boolean default false,
  created_at timestamptz default now()
);

-- PURCHASES
create table purchases (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  track_id uuid references tracks(id) default null,
  bundle_id uuid references bundles(id) default null,
  amount_paid numeric(10,2) not null,
  payment_ref text,
  download_token text unique default gen_random_uuid()::text,
  download_expires_at timestamptz default (now() + interval '7 days'),
  downloaded_at timestamptz default null,
  created_at timestamptz default now(),
  constraint purchase_has_item check (
    (track_id is not null and bundle_id is null) or
    (bundle_id is not null and track_id is null)
  )
);

-- AVAILABILITY
create table availability (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_blocked boolean default false,
  created_at timestamptz default now()
);

-- BOOKINGS
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  event_type text not null,
  venue_name text not null,
  venue_city text not null,
  crowd_size text check (crowd_size in ('under_50','50_200','200_500','500_plus')) not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  is_night boolean not null default false,
  hours_booked numeric(4,1) not null,
  hourly_rate numeric(10,2) not null,
  transport_fee numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null,
  total_amount numeric(10,2) not null,
  status text check (status in (
    'pending','deposit_requested','deposit_paid','confirmed','completed','cancelled'
  )) default 'pending',
  hospitality_acknowledged boolean not null default false,
  notes text default null,
  payment_ref text default null,
  created_at timestamptz default now()
);

-- SETTINGS (single-row config table)
create table settings (
  id integer primary key default 1 check (id = 1),
  day_rate numeric(10,2) default 1500,
  night_rate numeric(10,2) default 2000,
  night_start_hour integer default 20,
  transport_threshold_km integer default 20,
  transport_base_fee numeric(10,2) default 200,
  base_city text default 'Queenstown',
  base_lat numeric(9,6) default -31.8969,
  base_lng numeric(9,6) default 26.8669,
  deposit_percent integer default 50,
  travel_buffer_hours integer default 2,
  download_expiry_days integer default 7,
  hospitality_text_xh text default 'Izinto ezicelwayo: isistim yesandi, izibane, i-DJ booth, amanzi.',
  hospitality_text_en text default 'Required: full sound system, stage lighting, DJ booth, and basic hospitality.',
  updated_at timestamptz default now()
);
insert into settings default values;

-- PREVENT DOUBLE BOOKING (database-level constraint via trigger)
create or replace function check_booking_clash()
returns trigger as $$
declare
  clashing_count integer;
begin
  select count(*) into clashing_count
  from bookings
  where event_date = NEW.event_date
    and id != NEW.id
    and status not in ('cancelled')
    and (
      (NEW.start_time < end_time and NEW.end_time > start_time)
    );
  if clashing_count > 0 then
    raise exception 'BOOKING_CLASH: Time slot overlaps with an existing booking.';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger prevent_double_booking
before insert or update on bookings
for each row execute function check_booking_clash();

-- ROW LEVEL SECURITY
alter table customers enable row level security;
alter table tracks enable row level security;
alter table bundles enable row level security;
alter table purchases enable row level security;
alter table availability enable row level security;
alter table bookings enable row level security;
alter table settings enable row level security;

-- Public can read published tracks, bundles, availability
create policy "Public read tracks" on tracks for select using (published = true);
create policy "Public read bundles" on bundles for select using (published = true);
create policy "Public read availability" on availability for select using (true);

-- Public can insert customers, purchases, bookings (for checkout flow)
create policy "Public insert customers" on customers for insert with check (true);
create policy "Public insert purchases" on purchases for insert with check (true);
create policy "Public insert bookings" on bookings for insert with check (true);

-- Admin full access (authenticated user = the DJ)
create policy "Admin all tracks" on tracks for all using (auth.role() = 'authenticated');
create policy "Admin all bundles" on bundles for all using (auth.role() = 'authenticated');
create policy "Admin all customers" on customers for all using (auth.role() = 'authenticated');
create policy "Admin all purchases" on purchases for all using (auth.role() = 'authenticated');
create policy "Admin all bookings" on bookings for all using (auth.role() = 'authenticated');
create policy "Admin all availability" on availability for all using (auth.role() = 'authenticated');
create policy "Admin all settings" on settings for all using (auth.role() = 'authenticated');

-- Storage buckets
insert into storage.buckets (id, name, public) values ('tracks', 'tracks', false);
insert into storage.buckets (id, name, public) values ('covers', 'covers', true);

-- Authenticated users can upload to tracks and covers
create policy "Admin upload tracks" on storage.objects for insert
  with check (bucket_id = 'tracks' and auth.role() = 'authenticated');
create policy "Admin upload covers" on storage.objects for insert
  with check (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "Public read covers" on storage.objects for select
  using (bucket_id = 'covers');
