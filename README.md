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
| `npm run build` | Production build → `dist/` (also generates `public/sitemap.xml`, rewrites `public/robots.txt`, and writes static per-route SEO snapshots into `dist/`) |
| `npm run preview` | Preview production build |
| `npm run generate:sitemap` | Regenerate `public/sitemap.xml` and `public/robots.txt` from `VITE_SITE_URL` + published Supabase tracks |
| `npm run postbuild:seo` | Inject per-route `<head>` snapshots into `dist/` for non-JS crawlers (runs automatically as part of `build`) |
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

## AEO / GEO

Summary of the SEO / AEO (Answer Engine Optimization) / GEO (Generative Engine
Optimization) implementation pass, and — most importantly — the CSR
limitation and its impact on AI crawler visibility.

### What was implemented

**Technical**
- `VITE_SITE_URL` env var (`.env.local` / `.env.example`) — canonical/base
  URL everywhere, never hardcoded. Read via `import.meta.env.VITE_SITE_URL`
  in `src/lib/seo.js`, with a `http://localhost:5173` fallback for dev.
- `public/robots.txt` — explicit `Disallow: /admin`, `/download/`, `/payment/`
  (private/transactional routes), and a deliberate **allow** list for AI
  crawlers (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web,
  anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot
  variants, Bytespider, Meta-ExternalAgent, CCBot) — deliberate, since DJ
  Ntsira wants visibility in AI answers as a self-promotion channel.
  References `Sitemap: <VITE_SITE_URL>/sitemap.xml`.
- `scripts/generate-sitemap.js` — build-time script (runs via `npm run build`
  → `npm run generate:sitemap`) that writes `public/sitemap.xml` from static
  routes (`/`, `/music`, `/book`) plus every published track's `/music/:id`
  page, fetched live from Supabase. Also rewrites the `%VITE_SITE_URL%`
  placeholder left in `public/robots.txt` (Vite only interpolates
  `%VITE_*%` in `index.html`, not other `public/` files).
- `netlify.toml` — added security headers (CSP, HSTS via
  `Strict-Transport-Security`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`), short cache on `robots.txt`/`sitemap.xml`, no-cache
  on `index.html`. The SPA catch-all redirect was moved after the headers
  and kept last so real static files (sitemap, robots, per-route SEO
  snapshots) are served directly instead of always falling through to
  `index.html`.
- `react-helmet-async` added and wired via `HelmetProvider` in `src/main.jsx`;
  `src/components/seo/Seo.jsx` centralizes per-route title/description/
  keywords/canonical/OG/Twitter/JSON-LD, applied on every public and admin
  route.

**Schema (JSON-LD)**
- `src/lib/seo.js` builders: `Person` + `MusicGroup` (DJ Ntsira entity,
  reused via `@id` references for entity clarity), `WebSite`,
  `MusicRecording` (per track), `MusicPlaylist` (bundles), `Service`
  (booking/DJ-hire), `BreadcrumbList` (music listing, track detail, booking).
- The same Person/MusicGroup/WebSite graph is duplicated statically in
  `index.html` as a baseline (see CSR note below).

**On-page**
- Rewrote page titles/descriptions around real search intent: "Gqom DJ",
  "Queenstown"/"Komani", "Eastern Cape", "book a DJ", "buy Gqom music" —
  reflected in `index.html`, `Seo.js` defaults, and each page's `<Seo>` call
  (Home, Music, TrackDetail, Book).
- Transactional/private routes (`/admin/*`, `/payment/*`, `/booking-confirmed`,
  `/download/:token`) are explicitly `noindex, nofollow` via `<Seo noindex />`.

**Programmatic SEO**
- The data model only supports one true templated public content type:
  tracks (`/music/:id`, from Supabase `tracks` table). There is no
  events/gigs/press table — booking is a private request form, not a public
  calendar — so there was no Event/gig-listing programmatic opportunity to
  build without inventing new content the client didn't ask for.
- Implemented: per-track `MusicRecording` JSON-LD + keyword-rich
  title/description template, and the sitemap generator automatically picks
  up every published track. This is the realistic "programmatic SEO" surface
  for this app today.

### CSR / prerendering — the critical limitation

This app is a **pure client-side-rendered Vite + React SPA**. `vite.config.js`
has no SSR, prerender, or static-generation plugin — confirmed by inspection.
`dist/index.html` is a single shell (`<div id="root">` + a module script) and
every route, including `/music/:id`, resolves to that same shell client-side
via `react-router-dom`.

**Impact on AI crawlers specifically:** most AI answer-engine bots (GPTBot,
ClaudeBot, PerplexityBot, and the majority of "fetch and read" AI crawlers)
**do not execute JavaScript**. A bot that requests `/music` or
`/music/<uuid>` directly — the exact pages this site most wants cited (Gqom
tracks, booking) — would, without mitigation, receive only the generic
homepage-level `<head>` baked into the shell, not that page's title,
description, or JSON-LD. Content inside `#root` (track names, prices,
descriptions) is invisible to any crawler that doesn't run JS at all.

**What was actually implemented to mitigate this** (within reasonable scope,
short of adopting a full SSR framework):
1. `index.html` baseline `<head>` was strengthened with accurate site-wide
   title/description/OG/Twitter tags and a Person/MusicGroup/WebSite JSON-LD
   graph, so any bot that never runs JS and never runs the postbuild script
   still gets a correct, keyword-rich baseline for the domain as a whole.
2. `scripts/postbuild-seo.js` — a lightweight static-HTML-snapshot injector
   that runs after `vite build`. For the known static routes (`/music`,
   `/book`), it clones `dist/index.html`, rewrites the title/description/
   canonical/OG/Twitter tags for that route, and writes it to
   `dist/music/index.html` and `dist/book/index.html`. Netlify serves static
   files before falling through to the SPA redirect, so a non-JS crawler
   hitting `/music` now gets `/music`-specific meta tags without a full page
   render.

**What was deliberately NOT implemented, and why:**
- **Per-track static snapshots** (`dist/music/<id>/index.html` for every
  track) were not generated. Track data is dynamic (changes whenever the DJ
  publishes/prices music via the admin panel) and there could eventually be
  hundreds of tracks — a build-time snapshot step would need to run on every
  content change, not just every code deploy, which this repo's Netlify
  build (triggered by git push) doesn't do. Doing this properly needs either
  (a) a Netlify build hook triggered from the admin "publish track" action,
  or (b) migrating the public storefront to an SSR/hybrid framework
  (Next.js, Astro, Remix) or a prerendering tool (`react-snap`,
  `vite-plugin-ssr` / `vike`) that can fetch Supabase data at build/request
  time per route. That is the recommended follow-up if AI-crawler visibility
  of individual tracks becomes a priority — flagging it here rather than
  guessing at a bigger architectural change than requested.
- No full SSR migration was attempted — out of scope for an SEO pass on an
  existing CSR app, and a bigger decision than "implement SEO changes"
  implies.

**Net effect:** Googlebot/Bingbot (which do execute JS) see fully correct,
route-specific meta and JSON-LD via `react-helmet-async` regardless. Non-JS
AI crawlers now see correct meta for `/`, `/music`, and `/book` (covering the
site's main commercial intents — buy music, book a DJ), plus the sitemap and
robots.txt policy. They will **not** see individual track titles/prices
unless those crawlers happen to run JS (some, like Googlebot-driven Gemini
grounding, do) or until per-track prerendering is built as described above.

### Deliberately skipped / out of scope
- Per-track static prerendering (see above).
- `llms.txt` — considered, but skipped: it's an emerging, non-standardized
  convention with inconsistent AI-crawler support, and the site's content
  (music store + booking form) doesn't have the kind of long-form
  documentation/FAQ content llms.txt is meant to summarize. robots.txt +
  sitemap.xml + JSON-LD entity data covers the same intent more reliably
  today.
- FAQPage schema — no FAQ content exists on the site yet; adding fabricated
  FAQ copy just to attach schema would be against schema.org guidelines
  (markup must reflect visible content). Flagging as a future opportunity if
  the client adds a real FAQ section (e.g. booking terms, deposit policy).
