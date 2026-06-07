# Yoco Checkout API — implementation prompt

**Date:** 2026-06-06

## Goal

Replace iKhokha with Yoco Checkout API for music purchases and booking deposits, without Yoco webhooks.

## Context

**Exists:** Pending purchase/booking lifecycle, payment success pages, admin mark-as-paid, deposit request emails.

**Replaced:** iKhokha HMAC paylink + webhook flow.

## Approach

- `POST /api/checkouts` with Bearer auth ([authentication](https://developer.yoco.com/docs/checkout-api/authentication))
- Redirect to `redirectUrl`
- `GET /api/checkouts/{id}` on success page via `confirm-yoco-payment` (no webhooks)

## Scope

- `supabase/functions/_shared/yoco.ts`
- `create-yoco-checkout`, `confirm-yoco-payment`
- `src/lib/yoco.js`, payment pages, booking actions
- Remove `ikhokha-webhook`, `create-ikhokha-payment`

## Acceptance

- Music checkout redirects to Yoco hosted page
- Success page verifies checkout `status === completed` server-side
- Booking deposits work end-to-end
- `YOCO_SECRET_KEY` never exposed to client
