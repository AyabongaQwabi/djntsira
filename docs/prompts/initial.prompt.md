# DJ NTSIRA PLATFORM — CURSOR MASTER BUILD PROMPT

> Paste this entire prompt into Cursor's composer (Agent mode) to scaffold the full platform.

---

## ROLE & MISSION

You are a senior full-stack engineer building a complete, production-ready web platform for **DJ Ntsira (Lituko Siphe)**, a Gqom DJ based in Queenstown (Komani), Eastern Cape, South Africa.

Build this platform exactly as specified below. Do not skip any module. Do not add features not listed. Scaffold the entire project structure first, then implement each module in order.

---

## TECH STACK

| Layer                | Technology                             |
| -------------------- | -------------------------------------- |
| Frontend             | React 18 + Vite                        |
| Styling              | Tailwind CSS v3                        |
| Routing              | React Router v6                        |
| Backend / DB         | Supabase (PostgreSQL + Storage + Auth) |
| State / Server       | TanStack Query v5                      |
| Forms                | React Hook Form + Zod                  |
| Payments             | iKhokha (redirect-based payment page)  |
| Email                | Resend (via Supabase Edge Functions)   |
| Internationalisation | i18next + react-i18next                |
| Audio                | Howler.js (previews)                   |
| Date/Time            | date-fns                               |
| Export               | xlsx (SheetJS)                         |
| Hosting              | Netlify                                |
| Icons                | Lucide React                           |

---

## BRAND & DESIGN SYSTEM

```css
/* globals.css — define these as CSS variables */
--color-primary: #1a1a1a; /* Black */
--color-accent: #c9a84c; /* Gold */
--color-accent-light: #f5e9cc; /* Light gold */
--color-bg: #0d0d0d; /* Near black background */
--color-surface: #1e1e1e; /* Card surface */
--color-surface-2: #2a2a2a; /* Elevated surface */
--color-text: #f5f5f5; /* Primary text */
--color-text-muted: #a0a0a0; /* Muted text */
--color-border: #2e2e2e; /* Subtle border */
--color-success: #22c55e;
--color-error: #ef4444;
--color-warning: #f59e0b;
```

**Design principles:**

- Dark theme throughout (black/dark grey background, gold accents)
- Mobile-first — design every component for 375px viewport first
- Minimum tap target: 48px height on all interactive elements
- Large, bold typography — users may be viewing outdoors on cheap phones
- High contrast — gold on black, white on dark surface
- No cart UI anywhere — every purchase is a direct single-item buy
- Font: `'Inter'` for body, `'Bebas Neue'` for display headings (load from Google Fonts)

---

## PROJECT STRUCTURE

Scaffold this exact folder structure:

```
/
├── public/
│   └── locales/
│       ├── xh/           ← isiXhosa translations (primary)
│       │   └── translation.json
│       └── en/           ← English translations (SEO + fallback)
│           └── translation.json
├── src/
│   ├── components/
│   │   ├── ui/           ← Reusable primitives (Button, Input, Badge, Modal, etc.)
│   │   ├── layout/       ← Navbar, Footer, AdminLayout, PublicLayout
│   │   ├── music/        ← TrackCard, PreviewPlayer, BuyModal, BundleCard
│   │   ├── booking/      ← BookingForm, AvailabilityCalendar, BookingStatusBadge
│   │   ├── admin/        ← StatsCard, DataTable, ExportButton, WhatsAppButton
│   │   └── shared/       ← LanguageSwitcher, LoadingSpinner, ErrorMessage
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.jsx
│   │   │   ├── Music.jsx
│   │   │   ├── TrackDetail.jsx
│   │   │   ├── Book.jsx
│   │   │   └── BookingConfirmed.jsx
│   │   └── admin/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── MusicManager.jsx
│   │       ├── BookingsList.jsx
│   │       ├── BookingCalendar.jsx
│   │       ├── Customers.jsx
│   │       ├── Marketing.jsx
│   │       └── Settings.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useTracks.js
│   │   ├── useBundles.js
│   │   ├── useBookings.js
│   │   ├── useCustomers.js
│   │   ├── useAvailability.js
│   │   └── useSettings.js
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client init
│   │   ├── ikhokha.js        ← iKhokha payment helpers
│   │   ├── distance.js       ← Distance/transport fee calculator
│   │   ├── pricing.js        ← Booking cost calculator
│   │   └── export.js         ← CSV/Excel export helpers
│   ├── i18n/
│   │   └── index.js          ← i18next config
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── send-booking-notification/
│       │   └── index.ts
│       ├── send-purchase-receipt/
│       │   └── index.ts
│       ├── send-marketing-email/
│       │   └── index.ts
│       └── send-booking-reminder/
│           └── index.ts
├── .env.example
├── netlify.toml
├── tailwind.config.js
└── vite.config.js
```

---

## DATABASE SCHEMA

Create this as `supabase/migrations/001_initial_schema.sql`:

```sql
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
```

---

## ENVIRONMENT VARIABLES

Create `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_IKHOKHA_MERCHANT_ID=your-merchant-id
VITE_IKHOKHA_API_KEY=your-api-key
VITE_IKHOKHA_PAYMENT_URL=https://pay.ikhokha.com
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
VITE_APP_URL=https://djntsira.co.za
RESEND_API_KEY=your-resend-key   # server-side only, used in edge functions
```

---

## INTERNATIONALISATION (i18next)

**isiXhosa is the default language.** English is the fallback for SEO meta tags only.

`public/locales/xh/translation.json` — populate with these keys (use placeholder Xhosa, mark TODO for client to fill real translations):

```json
{
  "nav": {
    "music": "Umculo",
    "book": "Bhuqa",
    "admin": "Ulawulo"
  },
  "music": {
    "preview": "Phulaphula",
    "buy": "Thenga",
    "full_song": "Ingoma epheleleyo",
    "stem": "Istem",
    "category": "Uhlobo",
    "price": "Ixabiso",
    "discount": "Isaphulelo",
    "bundle": "Iphakeji"
  },
  "booking": {
    "title": "Bhuqa DJ Ntsira",
    "full_name": "Igama elipheleleyo",
    "cell": "Inombolo yefoni",
    "email": "I-imeyile",
    "event_type": "Uhlobo lwesiganeko",
    "venue": "Indawo",
    "city": "Isixeko",
    "date": "Umhla",
    "start_time": "Ixesha lokuqala",
    "end_time": "Ixesha lokugqiba",
    "crowd_size": "Ubungakanani bemimangaliso",
    "day_booking": "Ukubhuka kwemini",
    "night_booking": "Ukubhuka kobusuku",
    "notes": "Amanqaku",
    "submit": "Thumela",
    "hospitality_ack": "Ndiyavuma ukubonelela ngesistim yesandi, izibane, i-DJ booth kunye namanzi.",
    "deposit_notice": "Idiphozithi engenamhlombo ka-50% iyafuneka ukuqinisekisa ukubhuka.",
    "transport_notice": "Intlawulo yothutho iya kubangelwa ukuba indawo ikude nge-20km+"
  },
  "admin": {
    "dashboard": "Ikhaya",
    "music_manager": "Ulawulo lomculo",
    "bookings": "Ukubhuka",
    "customers": "Abathengi",
    "marketing": "Urhwebo",
    "settings": "Useto",
    "logout": "Phuma"
  },
  "common": {
    "loading": "Kulayishwa...",
    "error": "Kukhona impazamo",
    "save": "Gcina",
    "cancel": "Rhoxisa",
    "delete": "Cima",
    "edit": "Hlela",
    "export": "Khipha",
    "search": "Khangela",
    "whatsapp": "Thumela ku-WhatsApp"
  }
}
```

`public/locales/en/translation.json` — mirror with English values.

**i18n config** (`src/i18n/index.js`):

```js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    defaultNS: "translation",
    lng: "xh", // default to isiXhosa
    backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

---

## ROUTING (App.jsx)

```jsx
// Public routes
<Route path="/" element={<Home />} />
<Route path="/music" element={<Music />} />
<Route path="/music/:id" element={<TrackDetail />} />
<Route path="/book" element={<Book />} />
<Route path="/booking-confirmed" element={<BookingConfirmed />} />
<Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/cancel" element={<PaymentCancel />} />
<Route path="/download/:token" element={<SecureDownload />} />

// Admin routes — wrapped in <ProtectedRoute>
<Route path="/admin/login" element={<Login />} />
<Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route index element={<Dashboard />} />
  <Route path="music" element={<MusicManager />} />
  <Route path="bookings" element={<BookingsList />} />
  <Route path="calendar" element={<BookingCalendar />} />
  <Route path="customers" element={<Customers />} />
  <Route path="marketing" element={<Marketing />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

---

## MODULE SPECIFICATIONS

### MODULE 1 — PUBLIC HOME PAGE (`/`)

Build a visually striking mobile-first landing page:

- **Hero section**: Full-viewport dark background, DJ name in large gold `Bebas Neue` display font, animated gold gradient underline, two CTA buttons: "Thenga Umculo" (Buy Music) and "Bhuka Ngoku" (Book Now)
- **About strip**: Short bio text (placeholder), Instagram grid embed or social links row (Facebook, Instagram, TikTok icons linking to client's profiles)
  - Facebook: https://www.facebook.com/profile.php?id=61556947102512
  - Instagram: https://www.instagram.com/djntsira/
  - TikTok: https://www.tiktok.com/@djntsira_sa
- **Music preview section**: Show first 4 published tracks as cards, "See All" link
- **Booking CTA section**: Bold section with availability teaser and Book button
- **Language switcher**: Top-right corner, `XH | EN` toggle, small and unobtrusive

---

### MODULE 2 — MUSIC STORE (`/music` and `/music/:id`)

**Track Card component** — must include:

- Cover art image (square, lazy loaded)
- Track title
- Category badge (`Ingoma epheleleyo` / `Istem`) in gold
- Original price (with strikethrough if discounted)
- Discounted price (gold, prominent)
- Discount badge if active (e.g. "20% OFF")
- **PREVIEW button** — plays audio preview using Howler.js for the configured duration (5–30s), shows waveform-style pulsing animation while playing, stops other previews when a new one starts
- **THENGA (BUY) button** — gold, full-width on mobile, opens BuyModal

**BuyModal component**:

- Simple bottom sheet on mobile, centered modal on desktop
- Fields: Full Name, Cell/WhatsApp Number, Email (all required, validated with Zod)
- Price summary showing item name and amount
- "Qhubeka Ukuhlawula" (Proceed to Pay) button — submits customer to Supabase, then redirects to iKhokha payment page
- Pass `return_url` pointing to `/payment/success?ref={purchase_id}` and `cancel_url` to `/payment/cancel`

**Music page filters**:

- Filter tabs: All / Full Songs / Stems / Bundles
- Search input (client-side filter by title)
- Sort: Newest / Price Low-High / Price High-Low

**Bundle Card** — similar to Track Card but shows list of included tracks, total value vs bundle price.

---

### MODULE 3 — BOOKING MODULE (`/book`)

**Availability Calendar**:

- Monthly calendar view (mobile-friendly, large touch targets)
- Only dates that the DJ has marked available are selectable (green dot indicator)
- Dates with full slots are greyed out and non-tappable
- When a date is selected, show available time slots for that date

**Booking Form** — rendered after date/time selection:

```
Fields (in order):
1. Full Name *
2. Cell / WhatsApp Number *
3. Email *
4. Event Type * (select: Birthday Party / Corporate Event / Tavern Night /
                  Wedding / Festival / Other)
5. Venue Name *
6. Venue City / Town *
7. Expected Crowd Size * (radio: Under 50 / 50–200 / 200–500 / 500+)
8. Day or Night booking * (radio: Day — R1,500/hr / Night — R2,000/hr)
9. Hours Needed * (number input, min 1)
10. Additional Notes (textarea, optional)
11. Hospitality Requirements — display the hospitality text from settings
    then: [ ] I confirm the above will be provided *
```

**Live cost calculator** — updates in real time as user fills form:

```
Display card showing:
- Hourly Rate: R1,500 or R2,000
- Hours: X
- Subtotal: R X,XXX
- Transport Fee: R200 (if applicable — shown/hidden based on city input)
- TOTAL: R X,XXX
- 50% Deposit Due Now: R X,XXX
- Balance Due on Day: R X,XXX
```

**Anti-double-booking logic** (frontend layer — database also enforces):

- When user selects a date, fetch existing confirmed/pending bookings for that date
- If requested time slot overlaps any existing booking, show error immediately
- If booking is in a different city and there's another booking that day with < 2hr gap, show travel buffer warning and block submission

**On form submit**:

1. Validate all fields with Zod
2. Calculate transport fee: if venue city != "Queenstown" / "Komani" AND distance > 20km → apply transport fee (minimum R200). Use Google Maps Distance Matrix API or a hardcoded lookup table of major Eastern Cape towns as fallback.
3. Insert customer to `customers` table (upsert by email)
4. Insert booking to `bookings` table with status `pending`
5. Trigger `send-booking-notification` edge function (sends isiXhosa email to DJ)
6. Trigger booking confirmation email to customer (English)
7. Redirect to `/booking-confirmed`

---

### MODULE 4 — PAYMENT HANDLING

**iKhokha integration** (`src/lib/ikhokha.js`):

```js
// iKhokha uses a redirect-based payment flow
// Build payment URL with these parameters:
export function buildIkhokhaPaymentUrl({
  amount,
  reference,
  returnUrl,
  cancelUrl,
  customerEmail,
  customerName,
}) {
  const params = new URLSearchParams({
    merchant_id: import.meta.env.VITE_IKHOKHA_MERCHANT_ID,
    amount: Math.round(amount * 100), // iKhokha expects cents
    reference,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    customer_name: customerName,
  });
  return `${import.meta.env.VITE_IKHOKHA_PAYMENT_URL}?${params.toString()}`;
}
// NOTE: Confirm exact iKhokha API parameter names with the merchant docs.
// This is a template — update when merchant credentials are available.
```

**`/payment/success`** page:

- Extract `ref` from URL query param
- Update purchase/booking status in Supabase to paid
- For music purchases: trigger `send-purchase-receipt` edge function (sends download link)
- For bookings: update status to `deposit_paid`, trigger confirmation email
- Show success UI with next steps

**`/download/:token`** route:

- Validate token exists in `purchases` table
- Check `download_expires_at` has not passed
- Generate a Supabase Storage signed URL (short-lived, 60 seconds)
- Trigger the browser download
- Update `downloaded_at` timestamp

---

### MODULE 5 — ADMIN DASHBOARD

All admin pages sit under `/admin/*` and require authentication via `<ProtectedRoute>`.

**Admin Layout** — dark sidebar on desktop, bottom nav on mobile:

- Navigation items: Dashboard, Music, Bookings, Calendar, Customers, Marketing, Settings
- DJ name and avatar placeholder at top of sidebar
- Logout button

**Dashboard (`/admin`)** — stats overview:

- Metric cards: Total Revenue (sum of purchases), Total Bookings, Pending Bookings, Total Customers
- Recent Bookings table (last 5, with status badge and quick WhatsApp button)
- Recent Music Sales table (last 5)

**Music Manager (`/admin/music`)**:

_Track list tab:_

- Table of all tracks (title, category, price, discount, published toggle, edit/delete)
- Published toggle (switch) — updates `published` in real time
- Edit inline or via side panel

_Upload track form:_

- Track title
- Category (Full Song / Stem)
- MP3 file upload → Supabase Storage `tracks` bucket (private)
- Cover art upload → Supabase Storage `covers` bucket (public)
- Price
- Preview duration slider (5–30 seconds)
- Discount section: type (% or flat rand), value, optional expiry date
- Published toggle
- Save button

_Bundle manager tab:_

- Create bundle: name, select tracks (multi-select from published tracks), price, discount
- List existing bundles with edit/delete

**Bookings List (`/admin/bookings`)**:

- Table columns: Date, Customer Name, Event Type, Venue City, Hours, Total Amount, Status, Actions
- Status badge (colour-coded: pending=amber, deposit_paid=blue, confirmed=green, completed=grey, cancelled=red)
- Actions per row: View Details, Update Status (dropdown), Send Deposit Request (generates iKhokha link and emails it), WhatsApp button
- Filter by: status, date range
- Export button → downloads CSV/Excel of filtered results

**Booking Calendar (`/admin/calendar`)**:

- Monthly calendar view
- DJ clicks a date to add an available time slot (start time, end time)
- Existing bookings shown on calendar as coloured blocks
- Available slots shown as green indicators
- Click existing slot to remove/block it

**Customers (`/admin/customers`)**:

Two tabs: Music Buyers | Booking Clients

Each tab shows a searchable, filterable table:

- Music Buyers: Name, Cell, Email, Tracks Purchased, Total Spent, Date, WhatsApp button
- Booking Clients: Name, Cell, Email, Events Booked, Total Spent, Last Booking Date, WhatsApp button

**WhatsApp button** on every row:

```jsx
// Opens WhatsApp with pre-filled message
const handleWhatsApp = (cellNumber) => {
  const cleaned = cellNumber.replace(/\D/g, "");
  const intl = cleaned.startsWith("0") ? "27" + cleaned.slice(1) : cleaned;
  window.open(`https://wa.me/${intl}`, "_blank");
};
```

Export button on each tab → exports visible/filtered data as `.xlsx`

**Marketing (`/admin/marketing`)**:

- Target selector: All Booking Clients / Select by date range
- Subject line input
- Email body (rich text or simple textarea)
- Preview count: "This will send to X customers"
- Send button → calls `send-marketing-email` edge function
- Sent campaigns log table (date, subject, recipient count)

**Settings (`/admin/settings`)**:

- Day rate (R/hr)
- Night rate (R/hr)
- Night booking start hour (default: 20:00)
- Deposit percentage (default: 50%)
- Transport threshold (km, default: 20)
- Transport base fee (R, default: 200)
- Travel buffer between towns (hours, default: 2)
- Download link expiry (days, default: 7)
- Hospitality requirements text (isiXhosa field + English field)
- Save button → updates `settings` table row

---

### MODULE 6 — SUPABASE EDGE FUNCTIONS

Build all 4 edge functions in TypeScript using Resend SDK:

**`send-booking-notification/index.ts`** — triggered after new booking insert:

```
To: djntsira@gmail.com
Language: isiXhosa
Subject: "Ukubhuka Okusha — [Event Type] e-[City]"
Body: Include all booking details (name, date, time, venue, crowd size,
      hours, total amount, deposit amount, customer contact)
      End with: "Iya ku-admin ukuphendula: [admin URL]"
```

**`send-purchase-receipt/index.ts`** — triggered after successful music payment:

```
To: customer email
Language: English
Subject: "Your download is ready — DJ Ntsira"
Body: Thank you message, download link (/download/{token}),
      link expiry notice (7 days)
      Social links at bottom
```

**`send-marketing-email/index.ts`** — triggered from admin marketing page:

```
Accepts: { subject, body, recipient_ids[] }
Loops through customers and sends individual emails via Resend
Log results back to a sent_campaigns table
```

**`send-booking-reminder/index.ts`** — called by a Supabase cron job (pg_cron):

```
Runs daily at 08:00 SAST
Finds confirmed bookings where event_date = tomorrow
Sends reminder to djntsira@gmail.com in isiXhosa with full booking details
```

Set up the cron job in Supabase:

```sql
select cron.schedule(
  'daily-booking-reminders',
  '0 6 * * *',  -- 08:00 SAST = 06:00 UTC
  $$
    select net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-booking-reminder',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'
    )
  $$
);
```

---

## NETLIFY CONFIG

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

---

## TAILWIND CONFIG

`tailwind.config.js`:

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1A1A1A",
        accent: "#C9A84C",
        "accent-light": "#F5E9CC",
        surface: "#1E1E1E",
        "surface-2": "#2A2A2A",
        border: "#2E2E2E",
        muted: "#A0A0A0",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      minHeight: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
```

---

## REUSABLE UI PRIMITIVES

Build these in `src/components/ui/` before anything else:

```
Button       — variants: primary (gold), secondary (outlined), ghost, danger
              sizes: sm, md, lg; always min-height 48px on mobile
Input        — with label, error state, helper text
Select       — styled native select with custom chevron
Textarea     — auto-resize, with label and error
Badge        — variants: gold, green, amber, red, grey, blue
Modal        — accessible, trap focus, close on backdrop click, bottom sheet on mobile
BottomSheet  — slides up from bottom on mobile (used for BuyModal, booking details)
Toggle       — switch component for published/draft
Spinner      — loading state
EmptyState   — illustration + message for empty lists
DataTable    — sortable, filterable table with pagination
ExportButton — triggers xlsx download from any array of objects
WhatsAppBtn  — green WhatsApp icon button with phone number
StatusBadge  — booking status badge (colour-coded per status)
AudioPlayer  — minimal preview player (Howler.js wrapper)
```

---

## BUILD ORDER

Implement in this exact sequence:

1. Project scaffold (Vite + React + Tailwind + dependencies)
2. Supabase client setup and database migration
3. i18n setup (both language files)
4. UI primitives (`/components/ui/`)
5. Auth context + ProtectedRoute + Login page
6. Public layout + Navbar + Footer + LanguageSwitcher
7. Home page
8. Music store (Music page, TrackCard, PreviewPlayer, BuyModal)
9. Payment flow (iKhokha redirect + success/cancel pages + secure download)
10. Booking module (AvailabilityCalendar + BookingForm + cost calculator)
11. Booking confirmed page
12. Admin layout + sidebar
13. Admin Dashboard
14. Music Manager (upload, edit, bundle)
15. Bookings List + status management
16. Booking Calendar (admin availability setter)
17. Customers CRM (buyers + bookers, WhatsApp, export)
18. Marketing email sender
19. Settings page
20. All 4 Supabase Edge Functions
21. Netlify config + build check
22. README with setup instructions

---

## CODE QUALITY RULES

- All components use `const ComponentName = () => {}` arrow function syntax
- All async operations wrapped in try/catch with user-facing error messages
- No hardcoded text strings anywhere — all text goes through `t()` from i18next
- Dates displayed in `dd MMMM yyyy` format (e.g. 15 Julayi 2026)
- Currency displayed as `R X,XXX.XX` using `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`
- Phone numbers stored and processed in South African format (strip leading 0, prefix with 27 for WhatsApp/international use)
- All forms validated client-side with Zod before any Supabase calls
- Loading states on every async action — no bare buttons that can be double-clicked
- Every Supabase query has `.select()` specifying exact columns — no `select('*')` in production
- Mobile breakpoint is `sm` (640px) — default styles are mobile, `sm:` overrides for desktop

---

## PLACEHOLDER CONTENT

Use these as placeholder values until client provides real content:

- **DJ bio**: "DJ Ntsira nguLituko Siphe, ingcali yeGqom evela eKomani, eMpuma Koloni. Umculo wakhe uthetha umntu wonke."
- **Hero tagline**: "ISANDI SEGQOM ELIZA KUWE"
- **Track cover art**: Use a dark gradient placeholder with gold DJ icon
- **Profile photo**: Dark background with gold "DN" initials circle

---

## IMPORTANT SOUTH AFRICA–SPECIFIC NOTES

1. **Phone number format**: SA numbers are 10 digits starting with 0 (e.g. 083 123 4567). Strip the 0 and add 27 for international use (WhatsApp links, Resend, etc.)
2. **Currency**: South African Rand (ZAR, R). Always show 2 decimal places.
3. **iKhokha**: South African payment gateway. It operates on a redirect model. Amounts must be sent in cents (multiply by 100). Confirm exact API parameter names from iKhokha merchant docs when credentials are available — stub out the integration cleanly so it can be swapped easily.
4. **Distance calculation**: Base location is Queenstown (Komani), GPS: `-31.8969, 26.8669`. If Google Maps API key is not yet available, implement a fallback: a hardcoded lookup of major Eastern Cape towns (East London, Port Elizabeth/Gqeberha, Mthatha, Grahamstown/Makhanda, King William's Town/Bhisho, Butterworth) with their approximate distances from Queenstown, and flag all other cities as requiring transport fee.
5. **Timezone**: All times are SAST (UTC+2). Use `Africa/Johannesburg` as the timezone for all date-fns operations and cron scheduling.

---

## FINAL CHECKLIST BEFORE HANDING OVER

- [ ] All 13 routes render without errors
- [ ] Auth flow works (login → protected admin → logout)
- [ ] Track upload → publish → customer preview → buy → payment → download flow tested end-to-end
- [ ] Booking form → anti-double-booking → confirmation email flow tested
- [ ] Admin can export customers as .xlsx
- [ ] WhatsApp button opens correct wa.me URL
- [ ] Language switcher toggles all UI text between isiXhosa and English
- [ ] All forms show validation errors on bad input
- [ ] Site is fully usable on a 375px mobile screen
- [ ] No console errors in production build
- [ ] `netlify.toml` redirects configured correctly for SPA routing
- [ ] `.env.example` documents every required environment variable
- [ ] README includes: local setup, Supabase setup, Resend setup, iKhokha setup, deployment steps
