# iK Pay API integration — implementation prompt

**Date:** 2026-06-06

## Goal

Replace the stub iKhokha redirect URL builder with the official iK Pay API: server-side signed paylink creation, webhook confirmation, and booking deposit support.

## Context

**Exists:** Pending purchase lifecycle, webhook handler skeleton, payment success polling, admin mark-as-paid, booking deposit admin action.

**Missing:** HMAC signing, `POST api.ikhokha.com/public-api/v1/api/payment`, `paylinkUrl` redirect, `externalTransactionID` webhook mapping, booking deposit webhook branch, deposit request emails.

## Scope

- `supabase/functions/_shared/ikhokha.ts`
- `supabase/functions/create-ikhokha-payment/`
- `supabase/functions/ikhokha-webhook/`
- `supabase/functions/send-booking-notification/`
- `src/lib/ikhokha.js`, booking actions, payment pages
- Migration `006_booking_payment_read.sql`

**Out of scope:** iK Dashboard onboarding, sandbox credential provisioning.

## References

- [iK Pay API overview](https://developer.ikhokha.com/overview)
- [ik-pay-api-examples (Node)](https://github.com/ikhokha/ik-pay-api-examples)
- [How to Power Your Online Payments with iK Pay API](https://www.ikhokha.com/blog/how-to-power-your-online-payments-with-ik-pay-api)

## Implementation steps

1. Add shared HMAC signing + `createPaylink` in `_shared/ikhokha.ts`
2. Deploy `create-ikhokha-payment` edge function (purchase + booking_deposit)
3. Update webhook: `externalTransactionID`, booking deposits, fail-closed on missing status
4. Wire frontend checkout to invoke edge function; remove client-side URL builder
5. Fix deposit request email + `booking_id` body keys
6. Add booking payment polling + `/payment/failure` route
7. Set Supabase secrets: `IKHOKHA_APP_ID`, `IKHOKHA_APP_KEY`, `APP_URL`

## Acceptance

- Music checkout creates pending purchase → redirects to iKhokha `paylinkUrl`
- Webhook marks purchase `paid` and sends receipt email
- Admin deposit request emails customer with paylink; webhook sets `deposit_paid`
- Success page polls until webhook confirms; never marks paid client-side
- Build passes; README documents secrets and deploy steps
