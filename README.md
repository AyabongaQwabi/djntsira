# DJ Ntsira Platform

Bilingual (isiXhosa / English) music store and booking platform for DJ Ntsira (Lituko Siphe), Gqom DJ based in Queenstown (Komani), Eastern Cape.

## Stack

- React 19 / Vite 8
- Tailwind CSS v3
- React Router v7
- Supabase (Auth, PostgreSQL, Storage, Edge Functions, pg_cron)
- TanStack Query v5
- React Hook Form + Zod
- i18next (public: isiXhosa default; admin: English only)
- Yoco Checkout API, Resend email, Howler.js previews

## Quick start

```bash
npm install
cp .env.example .env   # fill in Supabase + optional keys
npm run dev            # http://localhost:5173
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run check:i18n` | Verify xh/en locale key parity |

## Environment variables

Copy `.env.example` to `.env` for local dev. Set the same `VITE_*` vars in Netlify.

### Client (`.env` / Netlify)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `VITE_APP_URL` | Yes (prod) | Site URL for payment return links, e.g. `https://djntsira.co.za` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Transport distance; EC town fallback works without it |

### Edge functions (Supabase secrets)

Set via Supabase Dashboard → Project Settings → Edge Functions → Secrets, or CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set YOCO_SECRET_KEY=sk_test_xxx
supabase secrets set APP_URL=https://djntsira.co.za
```

| Secret | Required | Notes |
|--------|----------|-------|
| `RESEND_API_KEY` | Yes (email) | Resend transactional + marketing email |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Edge functions, cron invocations, admin writes |
| `YOCO_SECRET_KEY` | Yes | Yoco secret key (`sk_test_...` or `sk_live_...`) — server-side only |
| `APP_URL` | Yes | Public site URL for checkout success/cancel/failure redirects |

## Supabase setup

1. **Create project** at [supabase.com](https://supabase.com)

2. **Run migrations** in order (SQL Editor or `supabase db push`):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_prd_extensions.sql`
   - `supabase/migrations/003_cron_jobs.sql`
   - `supabase/migrations/004_rls_policies.sql`
   - `supabase/migrations/005_purchase_public_read.sql` — anon SELECT for payment polling + download
   - `supabase/migrations/006_booking_payment_read.sql` — anon SELECT for deposit payment polling

3. **Create admin user** via Authentication → Users (email/password). Single DJ admin account.

4. **Storage** — buckets `tracks` (private) and `covers` (public) are created by migration 001.

5. **Deploy edge functions**:

```bash
supabase link --project-ref YOUR_REF
README.md
supabase functions deploy send-booking-notification
supabase functions deploy send-purchase-receipt
supabase functions deploy send-marketing-email
supabase functions deploy send-booking-reminder
supabase functions deploy create-yoco-checkout
supabase functions deploy confirm-yoco-payment
supabase functions deploy get-preview-url
supabase functions deploy get-download-url
```

6. **Yoco credentials** — [Yoco App → Payment Gateway](https://app.yoco.com/sales/payments/payment-gateway). Use `sk_test_...` for development, `sk_live_...` for production ([authentication docs](https://developer.yoco.com/docs/checkout-api/authentication)).

### pg_cron + vault (daily reminders)

Migration `003_cron_jobs.sql` schedules:
- **cleanup-pending-purchases** — hourly, deletes `pending` purchases older than 24h
- **daily-booking-reminders** — 06:00 UTC (08:00 SAST), invokes `send-booking-reminder`

The reminder job needs vault secrets (run once in SQL editor after enabling vault):

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
```

Requires `pg_cron` and `pg_net` extensions (included in migration 003).

## Resend email

1. Create account at [resend.com](https://resend.com)
2. Verify sending domain (or use Resend sandbox for dev)
3. Set `RESEND_API_KEY` as Supabase edge function secret
4. Update `from` address in `supabase/functions/_shared/resend.ts` when domain is live

Email functions log every send to `email_logs` (success/failure). Failed sends surface in Admin → Customers.

## Yoco payments (Checkout API)

Uses the [Yoco Checkout API](https://developer.yoco.com/docs/checkout-api) — no webhooks required:

1. Checkout calls `create-yoco-checkout` edge function (`POST https://payments.yoco.com/api/checkouts` with Bearer auth)
2. Customer is redirected to the returned `redirectUrl` (Yoco hosted page)
3. On return, the success page calls `confirm-yoco-payment`, which verifies status via `GET /api/checkouts/{id}`
4. When status is `completed`, purchase/booking is marked paid and receipt email is sent
5. **Never** marks paid on redirect alone — always verified server-side against Yoco

Use test mode with `sk_test_...` keys and [test card details](https://developer.yoco.com/docs/checkout-api/testing). Admin **Mark as Paid** handles edge cases (Customers tab).

## Deployment (Netlify)

```bash
npm run build
```

`netlify.toml` configures SPA redirects (`/* → /index.html`).

1. Connect repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set all `VITE_*` env vars in Netlify dashboard
5. Optional: custom domain + HTTPS

## Routes (21 total)

### Public (isiXhosa default)

| Path | Page |
|------|------|
| `/` | Home |
| `/music` | Music store |
| `/music/:id` | Track detail |
| `/book` | Booking form |
| `/booking-confirmed` | Booking confirmation |
| `/payment/success` | Payment success (verifies Yoco checkout status) |
| `/payment/cancel` | Payment cancelled |
| `/payment/failure` | Payment failed |
| `/download/:token` | Secure download |

### Admin (English only, protected)

| Path | Page |
|------|------|
| `/admin/login` | Login |
| `/admin` | Dashboard |
| `/admin/music` | Music manager |
| `/admin/bookings` | Bookings list |
| `/admin/calendar` | Availability calendar |
| `/admin/customers` | CRM |
| `/admin/marketing` | Marketing campaigns |
| `/admin/settings` | Settings |

## Project structure

```
src/
  pages/public/     Customer-facing routes
  pages/admin/      Protected admin routes
  components/ui/    Shared UI primitives (barrel: components/ui)
  components/admin/ Admin-specific (booking modals, Mark as Paid, etc.)
  hooks/            TanStack Query hooks
  lib/              Business logic (pricing, distance, schemas, yoco)
  i18n/             i18next config
public/locales/     xh/ + en/ translation files
supabase/
  migrations/       Database schema + RLS + cron
  functions/        Edge functions (preview, email, Yoco checkout)
docs/plans/         agent-contracts.md, build plan
```

## Build phases

1. **Phase 0** — scaffold, migrations, shared libs, route stubs
2. **Phase 1** — 6 parallel agents (UI, commerce, booking, admin, CRM, backend)
3. **Phase 2** — integration, build verification, README (complete)

## Open client items

- Domain purchase and DNS
- Final logo assets
- Yoco secret key (`sk_test_...` / `sk_live_...`) from Payment Gateway
- Native isiXhosa copy review
- Marketing opt-in default policy

## License

Private — DJ Ntsira / client project.
