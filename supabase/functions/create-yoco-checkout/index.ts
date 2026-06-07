import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { appUrl } from '../_shared/format.ts'
import {
  amountToCents,
  bookingDepositReference,
  createCheckout,
} from '../_shared/yoco.ts'

type CheckoutType = 'purchase' | 'booking_deposit'

const buildUrls = (ref: string) => {
  const base = appUrl()
  return {
    successUrl: `${base}/payment/success?ref=${ref}`,
    failureUrl: `${base}/payment/failure?ref=${ref}`,
    cancelUrl: `${base}/payment/cancel?ref=${ref}`,
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabase = createAdminClient()

  try {
    const body = await req.json().catch(() => ({}))
    const type = body?.type as CheckoutType | undefined
    const purchaseId = body?.purchase_id as string | undefined
    const bookingId = body?.booking_id as string | undefined
    const description = typeof body?.description === 'string'
      ? body.description
      : undefined

    if (type !== 'purchase' && type !== 'booking_deposit') {
      return jsonResponse({ error: 'type must be purchase or booking_deposit' }, 400)
    }

    if (type === 'purchase') {
      if (!purchaseId) {
        return jsonResponse({ error: 'purchase_id is required' }, 400)
      }

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('id, status, amount_paid, customer:customers(email, full_name)')
        .eq('id', purchaseId)
        .maybeSingle()

      if (purchaseError) {
        return jsonResponse({ error: purchaseError.message }, 500)
      }

      if (!purchase) {
        return jsonResponse({ error: 'Purchase not found' }, 404)
      }

      if (purchase.status !== 'pending') {
        return jsonResponse({ error: 'Purchase is not pending payment' }, 409)
      }

      const customer = Array.isArray(purchase.customer)
        ? purchase.customer[0]
        : purchase.customer

      const pageUrls = buildUrls(purchase.id)
      const amountCents = amountToCents(purchase.amount_paid)
      const label = description ?? `DJ Ntsira music purchase`

      const checkout = await createCheckout(
        {
          amount: amountCents,
          currency: 'ZAR',
          ...pageUrls,
          clientReferenceId: purchase.id,
          externalId: purchase.id,
          metadata: {
            type: 'purchase',
            purchaseId: purchase.id,
            customerEmail: customer?.email ?? null,
          },
          lineItems: [
            {
              displayName: label,
              quantity: 1,
              pricingDetails: { price: amountCents },
            },
          ],
        },
        purchase.id,
      )

      await supabase
        .from('purchases')
        .update({ payment_ref: checkout.id })
        .eq('id', purchase.id)

      return jsonResponse({
        ok: true,
        redirectUrl: checkout.redirectUrl,
        checkoutId: checkout.id,
      })
    }

    if (!bookingId) {
      return jsonResponse({ error: 'booking_id is required' }, 400)
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        'id, status, deposit_amount, event_type, venue_city, customer:customers(email, full_name)',
      )
      .eq('id', bookingId)
      .maybeSingle()

    if (bookingError) {
      return jsonResponse({ error: bookingError.message }, 500)
    }

    if (!booking) {
      return jsonResponse({ error: 'Booking not found' }, 404)
    }

    if (!['pending', 'deposit_requested'].includes(booking.status)) {
      return jsonResponse({ error: 'Booking is not awaiting deposit payment' }, 409)
    }

    const externalId = bookingDepositReference(booking.id)
    const pageUrls = buildUrls(`booking_${booking.id}`)
    const amountCents = amountToCents(booking.deposit_amount)
    const label = description ??
      `Booking deposit — ${booking.event_type} (${booking.venue_city})`

    const checkout = await createCheckout(
      {
        amount: amountCents,
        currency: 'ZAR',
        ...pageUrls,
        clientReferenceId: externalId,
        externalId,
        metadata: {
          type: 'booking_deposit',
          bookingId: booking.id,
        },
        lineItems: [
          {
            displayName: label,
            quantity: 1,
            pricingDetails: { price: amountCents },
          },
        ],
      },
      externalId,
    )

    await supabase
      .from('bookings')
      .update({
        payment_ref: checkout.id,
        status: booking.status === 'pending' ? 'deposit_requested' : booking.status,
      })
      .eq('id', booking.id)

    return jsonResponse({
      ok: true,
      redirectUrl: checkout.redirectUrl,
      checkoutId: checkout.id,
    })
  } catch (error) {
    console.error('create-yoco-checkout error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
