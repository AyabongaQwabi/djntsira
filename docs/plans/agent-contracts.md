# Agent Contracts — DJ Ntsira Platform

**Version:** Phase 0 foundation (2026-06-05)  
**Purpose:** Shared contracts for 6 parallel Phase 1 agents. Do not change signatures without integration lead approval.

---

## Route paths (frozen)

### Public (isiXhosa default via i18n)

| Path | Page component | Owner |
|------|----------------|-------|
| `/` | `src/pages/public/Home.jsx` | Agent 1 (+ preview strip: Agent 2) |
| `/music` | `src/pages/public/Music.jsx` | Agent 2 |
| `/music/:id` | `src/pages/public/TrackDetail.jsx` | Agent 2 |
| `/book` | `src/pages/public/Book.jsx` | Agent 3 |
| `/booking-confirmed` | `src/pages/public/BookingConfirmed.jsx` | Agent 3 |
| `/payment/success` | `src/pages/public/PaymentSuccess.jsx` | Agent 2 |
| `/payment/cancel` | `src/pages/public/PaymentCancel.jsx` | Agent 2 |
| `/download/:token` | `src/pages/public/SecureDownload.jsx` | Agent 2 |

### Admin (English hardcoded — no `t()`)

| Path | Page component | Owner |
|------|----------------|-------|
| `/admin/login` | `src/pages/admin/Login.jsx` | Agent 1 |
| `/admin` | `src/pages/admin/Dashboard.jsx` | Agent 4 |
| `/admin/music` | `src/pages/admin/MusicManager.jsx` | Agent 4 |
| `/admin/bookings` | `src/pages/admin/BookingsList.jsx` | Agent 5 |
| `/admin/calendar` | `src/pages/admin/BookingCalendar.jsx` | Agent 5 |
| `/admin/customers` | `src/pages/admin/Customers.jsx` | Agent 5 |
| `/admin/marketing` | `src/pages/admin/Marketing.jsx` | Agent 5 |
| `/admin/settings` | `src/pages/admin/Settings.jsx` | Agent 4 |

### Layout / auth wrappers

| Export | Path | Owner |
|--------|------|-------|
| `PublicLayout` | `src/components/layout/PublicLayout.jsx` | Agent 1 |
| `AdminLayout` | `src/components/layout/AdminLayout.jsx` | Agent 1 |
| `ProtectedRoute` | `src/components/shared/ProtectedRoute.jsx` | Agent 1 |
| `AuthProvider` / `useAuth` | `src/context/AuthContext.jsx` | Agent 1 |

---

## Database tables & columns

### `customers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `full_name` | text | required |
| `cell_number` | text | SA format |
| `email` | text | unique (lower), upsert key |
| `type` | text | `buyer` \| `booker` \| `both` — auto-computed |
| `marketing_opted_out` | boolean | default false (002) |
| `created_at` | timestamptz | |

### `tracks`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | |
| `category` | text | `full_song` \| `stem` |
| `price` | numeric(10,2) | |
| `discount_type` | text | `percent` \| `flat` \| null |
| `discount_value` | numeric(10,2) | |
| `discount_expires_at` | timestamptz | |
| `preview_duration` | integer | 5–30, default 30 |
| `file_url` | text | Storage path (private) |
| `cover_url` | text | required to publish (PRD) |
| `published` | boolean | |
| `created_at` | timestamptz | archive if purchases exist |

### `bundles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | |
| `price` | numeric(10,2) | |
| `discount_type` | text | |
| `discount_value` | numeric(10,2) | |
| `discount_expires_at` | timestamptz | |
| `track_ids` | uuid[] | auto-unpublish if track removed |
| `published` | boolean | |
| `created_at` | timestamptz | |

### `purchases`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `customer_id` | uuid | FK |
| `track_id` | uuid | XOR with bundle_id |
| `bundle_id` | uuid | XOR with track_id |
| `amount_paid` | numeric(10,2) | |
| `payment_ref` | text | iKhokha reference |
| `status` | text | `pending` \| `paid` (002) |
| `paid_at` | timestamptz | webhook sets this |
| `download_token` | text | unique |
| `download_expires_at` | timestamptz | default +7 days |
| `downloaded_at` | timestamptz | |
| `created_at` | timestamptz | |

### `availability`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `date` | date | |
| `start_time` | time | 1hr granularity |
| `end_time` | time | |
| `is_blocked` | boolean | |
| `created_at` | timestamptz | opt-in only |

### `bookings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `customer_id` | uuid | FK |
| `event_type` | text | |
| `venue_name` | text | |
| `venue_city` | text | |
| `crowd_size` | text | `under_50` \| `50_200` \| `200_500` \| `500_plus` |
| `event_date` | date | |
| `start_time` | time | |
| `end_time` | time | |
| `is_night` | boolean | |
| `hours_booked` | numeric(4,1) | whole hours 1–12 in UI |
| `hourly_rate` | numeric(10,2) | snapshot at booking |
| `transport_fee` | numeric(10,2) | admin can override |
| `deposit_amount` | numeric(10,2) | ceil round-up |
| `total_amount` | numeric(10,2) | |
| `status` | text | see state machine below |
| `hospitality_acknowledged` | boolean | gates submit |
| `notes` | text | |
| `payment_ref` | text | |
| `created_at` | timestamptz | |

**Status state machine** (`src/lib/booking-status.js`):

```
pending → deposit_requested | confirmed | cancelled
deposit_requested → deposit_paid | cancelled
deposit_paid → confirmed | cancelled
confirmed → completed | cancelled
completed → (terminal)
cancelled → (terminal)
```

**Clash-blocking statuses:** `pending`, `deposit_requested`, `deposit_paid`, `confirmed`

### `settings` (singleton id=1)

| Column | Type | Default |
|--------|------|---------|
| `day_rate` | numeric | 1500 |
| `night_rate` | numeric | 2000 |
| `night_start_hour` | integer | 20 |
| `transport_threshold_km` | integer | 20 |
| `transport_base_fee` | numeric | 200 |
| `base_city` | text | Queenstown |
| `base_lat` / `base_lng` | numeric | -31.8969 / 26.8669 |
| `deposit_percent` | integer | 50 (10–100 valid) |
| `travel_buffer_hours` | integer | 2 |
| `download_expiry_days` | integer | 7 |
| `hospitality_text_xh` / `hospitality_text_en` | text | |
| `updated_at` | timestamptz | |

### `email_logs` (002)

| Column | Type |
|--------|------|
| `id` | uuid |
| `trigger_name` | text |
| `recipient` | text |
| `status` | `sent` \| `failed` |
| `error_message` | text |
| `payload_ref` | text |
| `created_at` | timestamptz |

### `sent_campaigns` (002)

| Column | Type |
|--------|------|
| `id` | uuid |
| `subject` | text |
| `body` | text |
| `recipient_count` | integer |
| `sent_at` | timestamptz |

---

## Hook signatures

### `useAuth()` — Agent 1

```js
{
  user: User | null,
  session: Session | null,
  loading: boolean,
  signIn: (email: string, password: string) => Promise<void>,
  signOut: () => Promise<void>,
}
```

### `useTracks(filters?)` — Agent 2/4

```js
// filters: { publishedOnly?: boolean, category?: 'full_song'|'stem' }
// queryKey: ['tracks', filters]
// returns: Track[]
```

### `useTrack(id)` — Agent 2

```js
// queryKey: ['track', id]
// returns: Track
```

### `useBundles(publishedOnly?)` — Agent 2/4

```js
// queryKey: ['bundles', { publishedOnly }]
// returns: Bundle[]
```

### `useBookings(filters?)` — Agent 3/5

```js
// filters: { status?, dateFrom?, dateTo? }
// queryKey: ['bookings', filters]
// returns: Booking[]
```

### `useBookingsByDate(date)` — Agent 3

```js
// queryKey: ['bookings', 'date', date]
// returns: Booking[] (clash-blocking statuses only)
```

### `useCreateBooking()` — Agent 3

```js
// mutationFn: (payload: BookingInsert) => Promise<Booking>
// onSuccess: invalidate ['bookings']
```

### `useUpdateBookingStatus()` — Agent 5

```js
// mutationFn: ({ id, status }) => Promise<Booking>
// must call canTransition(from, to) before update
```

### `useAvailability(month?)` — Agent 3/5

```js
// month: 'YYYY-MM' optional
// queryKey: ['availability', month]
// returns: AvailabilitySlot[]
```

### `useCustomers(filters?)` — Agent 5

```js
// filters: { type?: 'buyer'|'booker'|'both', search?: string }
// queryKey: ['customers', filters]
// returns: Customer[]
```

### `useSettings()` — Agent 3/4

```js
// queryKey: ['settings']
// returns: Settings (singleton)
```

### `useUpdateSettings()` — Agent 4

```js
// mutationFn: (partial: SettingsUpdate) => Promise<Settings>
// validate with settingsSchema before save
```

---

## Shared lib exports (do not duplicate)

| Module | Key exports | Owner extends |
|--------|-------------|---------------|
| `lib/supabase.js` | `supabase` | — |
| `lib/schemas.js` | Zod schemas | all agents |
| `lib/pricing.js` | `calcDiscountedPrice`, `calcDeposit`, `calcBookingTotal` | Agent 2, 3 |
| `lib/distance.js` | `getDistanceKm`, `calcTransportFee` | Agent 3, 5 |
| `lib/booking-status.js` | `canTransition`, `timesOverlap`, `travelBufferViolated` | Agent 3, 5 |
| `lib/phone.js` | `toWhatsAppIntl`, `buildWhatsAppUrl`, `isValidSAPhone` | Agent 1, 5 |
| `lib/format.js` | `formatCurrency`, `formatDate`, `formatTime` | all |
| `lib/constants.js` | `EVENT_TYPES`, `CLASH_ERROR_XH`, etc. | all |
| `lib/ikhokha.js` | `buildIkhokhaPaymentUrl`, `buildPaymentUrls` | Agent 2 |
| `lib/export.js` | `exportToXlsx` | Agent 5 |

---

## Edge functions (Agent 6)

| Function | Path | Trigger |
|----------|------|---------|
| `get-preview-url` | `supabase/functions/get-preview-url/` | Public preview tap |
| `send-booking-notification` | `supabase/functions/send-booking-notification/` | New booking |
| `send-purchase-receipt` | `supabase/functions/send-purchase-receipt/` | Payment confirmed |
| `send-marketing-email` | `supabase/functions/send-marketing-email/` | Admin send |
| `send-booking-reminder` | `supabase/functions/send-booking-reminder/` | pg_cron daily |
| `ikhokha-webhook` | `supabase/functions/ikhokha-webhook/` | iKhokha POST |

All email functions **must** write to `email_logs`.

---

## File ownership (no cross-agent edits)

| Agent | Exclusive paths |
|-------|-----------------|
| 1 | `src/components/ui/*`, `layout/*`, `shared/*` (except stubs), `i18n/*`, `public/locales/*`, `context/AuthContext.jsx`, `pages/admin/Login.jsx` |
| 2 | `pages/public/Music.jsx`, `TrackDetail.jsx`, `Payment*.jsx`, `SecureDownload.jsx`, `components/music/*` |
| 3 | `pages/public/Book.jsx`, `BookingConfirmed.jsx`, `components/booking/*` |
| 4 | `pages/admin/Dashboard.jsx`, `MusicManager.jsx`, `Settings.jsx` |
| 5 | `pages/admin/BookingsList.jsx`, `BookingCalendar.jsx`, `Customers.jsx`, `Marketing.jsx`, `components/admin/*` |
| 6 | `supabase/functions/*`, `supabase/migrations/003_*`, `004_*` |

**Shared (integration lead only):** `App.jsx`, `main.jsx`, `hooks/*` mutation implementations, `package.json`

---

## Query key conventions

- `['tracks', filters]`, `['track', id]`
- `['bundles', { publishedOnly }]`, `['bundle', id]`
- `['bookings', filters]`, `['bookings', 'date', date]`
- `['availability', month]`
- `['customers', filters]`
- `['settings']`
- `['purchases', filters]` — Agent 2/5 may add

---

## i18n rules

- **Public pages:** all user-facing text via `t()` — isiXhosa default
- **Admin pages:** hardcoded English strings only
- **Clash errors:** use `CLASH_ERROR_XH` / `CLASH_ERROR_EN` from constants

---

## Payment rules (Agent 2 + 6)

1. Create purchase with `status: 'pending'`
2. Redirect to iKhokha — **do not** set `paid` on redirect
3. Webhook (`ikhokha-webhook`) idempotently sets `status: 'paid'`, `paid_at`
4. Admin "Mark as Paid" for redirect failures (Agent 5)
5. Re-validate discount with `validatePurchasePrice()` at pay click

---

## Ready for parallel agents

Phase 0 provides:

- ✅ All routes wired in `App.jsx`
- ✅ Hook stubs with column selections
- ✅ PRD pure functions in `src/lib/`
- ✅ Migrations 001 + 002
- ✅ i18n skeleton
- ✅ Brand assets in `public/images/`

**Launch all 6 agents after Phase 0 merge.**
