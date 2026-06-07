import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getCheckout, isCheckoutPaid } from '../_shared/yoco.ts'

type ConfirmType = 'purchase' | 'booking_deposit'

const sendPurchaseReceipt = async (purchaseId: string) => {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) return

  const response = await fetch(`${url}/functions/v1/send-purchase-receipt`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purchase_id: purchaseId }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('send-purchase-receipt invoke failed:', text)
  }
}

const sendBookingDepositConfirmation = async (bookingId: string) => {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) return

  const response = await fetch(
    `${url}/functions/v1/send-booking-notification`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'deposit_paid',
        booking_id: bookingId,
      }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    console.error('send-booking-notification (deposit_paid) failed:', text)
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
    const type = body?.type as ConfirmType | undefined
    const purchaseId = body?.purchase_id as string | undefined
    const bookingId = body?.booking_id as string | undefined

    if (type !== 'purchase' && type !== 'booking_deposit') {
      return jsonResponse({ error: 'type must be purchase or booking_deposit' }, 400)
    }

    if (type === 'purchase') {
      if (!purchaseId) {
        return jsonResponse({ error: 'purchase_id is required' }, 400)
      }

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('id, status, payment_ref')
        .eq('id', purchaseId)
        .maybeSingle()

      if (purchaseError) {
        return jsonResponse({ error: purchaseError.message }, 500)
      }

      if (!purchase) {
        return jsonResponse({ error: 'Purchase not found' }, 404)
      }

      if (purchase.status === 'paid') {
        return jsonResponse({ ok: true, status: 'paid', idempotent: true })
      }

      if (!purchase.payment_ref) {
        return jsonResponse({ ok: true, status: 'pending', reason: 'no checkout id' })
      }

      const checkout = await getCheckout(purchase.payment_ref)

      if (!isCheckoutPaid(checkout)) {
        return jsonResponse({
          ok: true,
          status: 'pending',
          checkoutStatus: checkout.status,
        })
      }

      const paymentRef = checkout.paymentId ?? checkout.id

      const { data: updated, error: updateError } = await supabase
        .from('purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_ref: paymentRef,
        })
        .eq('id', purchase.id)
        .eq('status', 'pending')
        .select('id, status')
        .maybeSingle()

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 500)
      }

      if (updated) {
        await sendPurchaseReceipt(purchase.id)
        return jsonResponse({ ok: true, status: 'paid', purchase_id: purchase.id })
      }

      const { data: current } = await supabase
        .from('purchases')
        .select('status')
        .eq('id', purchase.id)
        .maybeSingle()

      return jsonResponse({
        ok: true,
        status: current?.status === 'paid' ? 'paid' : 'pending',
        idempotent: current?.status === 'paid',
      })
    }

    if (!bookingId) {
      return jsonResponse({ error: 'booking_id is required' }, 400)
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, payment_ref')
      .eq('id', bookingId)
      .maybeSingle()

    if (bookingError) {
      return jsonResponse({ error: bookingError.message }, 500)
    }

    if (!booking) {
      return jsonResponse({ error: 'Booking not found' }, 404)
    }

    if (booking.status === 'deposit_paid') {
      return jsonResponse({ ok: true, status: 'deposit_paid', idempotent: true })
    }

    if (!booking.payment_ref) {
      return jsonResponse({ ok: true, status: 'deposit_requested', reason: 'no checkout id' })
    }

    const checkout = await getCheckout(booking.payment_ref)

    if (!isCheckoutPaid(checkout)) {
      return jsonResponse({
        ok: true,
        status: 'deposit_requested',
        checkoutStatus: checkout.status,
      })
    }

    const paymentRef = checkout.paymentId ?? checkout.id

    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'deposit_paid',
        payment_ref: paymentRef,
      })
      .eq('id', booking.id)
      .in('status', ['pending', 'deposit_requested'])
      .select('id, status')
      .maybeSingle()

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500)
    }

    if (updated) {
      await sendBookingDepositConfirmation(booking.id)
      return jsonResponse({
        ok: true,
        status: 'deposit_paid',
        booking_id: booking.id,
      })
    }

    const { data: current } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', booking.id)
      .maybeSingle()

    return jsonResponse({
      ok: true,
      status: current?.status ?? booking.status,
      idempotent: current?.status === 'deposit_paid',
    })
  } catch (error) {
    console.error('confirm-yoco-payment error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
