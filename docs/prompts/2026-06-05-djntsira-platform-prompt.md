# DJ Ntsira Platform — Implementation Prompt

**Date:** 2026-06-05  
**Status:** Phase 0 complete — foundation scaffolded  
**Plan:** [docs/plans/2026-06-05-djntsira-platform-build.md](../plans/2026-06-05-djntsira-platform-build.md)

## Goal

Build a production-ready bilingual (isiXhosa primary, English fallback) web platform for DJ Ntsira: music store with iKhokha payments, booking engine with clash detection, and English-only admin CRM — hosted on Netlify with Supabase backend.

## Context

### Exists (after Phase 0)

- Vite + React scaffold with all dependencies installed
- Tailwind v3 design tokens (dark theme, gold accent)
- Full folder tree per [initial.prompt.md](./initial.prompt.md)
- Supabase migrations `001_initial_schema.sql` + `002_prd_extensions.sql`
- Shared libs: `supabase`, `schemas`, `pricing`, `distance`, `booking-status`, `phone`, `constants`, `format`, `ikhokha`, `export`
- Route skeleton with page stubs for all 13 public + 8 admin routes
- i18n config + placeholder locale files
- Hook stubs with documented query keys and column selections
- `docs/plans/agent-contracts.md` for parallel agents
- Brand images in `public/images/`

### Missing (Phase 1 agents)

- UI primitives, layouts, full page implementations
- Auth flow, protected routes
- Payment webhook + edge functions
- Admin CRM, marketing, exports
- pg_cron jobs (migration 003)

## Scope

| In scope | Out of scope |
|----------|--------------|
| All modules in PRD + Platform Spec | Native mobile apps |
| 6 parallel agent build (Phase 1) | End-to-end testing (Phase 2) |
| PRD business rules over prompt deltas | Production key provisioning |

## Document precedence

1. **PRD** (`docs/DJNtsira_PRD_v1.docx`) — business logic
2. **Platform Spec** (`docs/DJNtsira_Platform_Spec.docx`) — modules/routes
3. **initial.prompt.md** — scaffold and file layout

## Implementation instructions

### Phase 1 — launch 6 agents (see agent-contracts.md)

1. **Agent 1** — UI shell, layouts, i18n, AuthContext, Login
2. **Agent 2** — Music commerce, payments, secure download
3. **Agent 3** — Booking form, calendar, clash/buffer logic
4. **Agent 4** — Dashboard, MusicManager, Settings
5. **Agent 5** — BookingsList, Calendar, Customers, Marketing
6. **Agent 6** — Edge functions, cron migrations, webhook

### Phase 2 — integration lead

- Wire providers, resolve contract mismatches
- `npm run build` green
- i18n key parity script
- README finalization
- Acceptance checklist from plan

## Acceptance (Phase 0)

- [x] `npm install` succeeds
- [x] All routes stubbed in `App.jsx`
- [x] Migrations 001 + 002 present
- [x] Shared libs export PRD pure functions
- [x] `agent-contracts.md` ready for parallel agents
- [x] `netlify.toml`, `.env.example`, README skeleton

## Links

- Master scaffold: [initial.prompt.md](./initial.prompt.md)
- Build plan: [2026-06-05-djntsira-platform-build.md](../plans/2026-06-05-djntsira-platform-build.md)
- Agent contracts: [agent-contracts.md](../plans/agent-contracts.md)
