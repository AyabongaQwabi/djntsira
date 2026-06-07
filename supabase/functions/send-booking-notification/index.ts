import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { logEmail } from '../_shared/email-log.ts'
import {
  appUrl,
  crowdSizeLabelXh,
  djEmail,
  formatCurrency,
  formatDateXh,
  formatTime,
} from '../_shared/format.ts'

const TRIGGER = 'send-booking-notification'

const loadBooking = async (supabase: ReturnType<typeof createAdminClient>, bookingId: string) => {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      'id,event_type,venue_name,venue_city,crowd_size,event_date,start_time,end_time,hours_booked,total_amount,deposit_amount,status,customer:customers(full_name,cell_number,email)',
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) throw new Error(bookingError.message)
  if (!booking) throw new Error('Booking not found')

  const customer = Array.isArray(booking.customer)
    ? booking.customer[0]
    : booking.customer

  return { booking, customer }
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
    const bookingId = body?.booking_id as string | undefined
    const type = body?.type as string | undefined
    const paymentUrl = body?.payment_url as string | undefined

    if (!bookingId) {
      return jsonResponse({ error: 'booking_id is required' }, 400)
    }

    const { booking, customer } = await loadBooking(supabase, bookingId)

    if (type === 'deposit_request') {
      if (!paymentUrl) {
        return jsonResponse({ error: 'payment_url is required for deposit_request' }, 400)
      }

      const recipient = customer?.email
      if (!recipient) {
        return jsonResponse({ error: 'Customer email not found' }, 400)
      }

      const subject = `Idiphozithi yokubhuka — ${booking.event_type} e-${booking.venue_city}`
      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
          <h2 style="color: #C9A84C;">Idiphozithi yokubhuka</h2>
          <p>Sawubona ${customer?.full_name ?? ''},</p>
          <p>Nceda uhlawule idiphozithi yakho yokubhuka u-DJ Ntsira.</p>
          <p><strong>Uhlobo lomnyhadala:</strong> ${booking.event_type}</p>
          <p><strong>Umhla:</strong> ${formatDateXh(booking.event_date)}</p>
          <p><strong>Indawo:</strong> ${booking.venue_name}, ${booking.venue_city}</p>
          <p><strong>Idiphozithi:</strong> ${formatCurrency(booking.deposit_amount)}</p>
          <p style="margin: 24px 0;">
            <a href="${paymentUrl}" style="background:#C9A84C;color:#1A1A1A;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">
              Hlawula idiphozithi
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">Okanye uvule le link: ${paymentUrl}</p>
        </div>
      `

      const result = await sendEmail({ to: recipient, subject, html })

      await logEmail(supabase, {
        triggerName: TRIGGER,
        recipient,
        status: result.ok ? 'sent' : 'failed',
        errorMessage: result.error ?? null,
        payloadRef: bookingId,
      })

      if (!result.ok) {
        return jsonResponse({ error: result.error ?? 'Failed to send email' }, 502)
      }

      return jsonResponse({ ok: true, email_id: result.id })
    }

    if (type === 'deposit_paid') {
      const recipient = customer?.email
      if (!recipient) {
        return jsonResponse({ ok: true, skipped: true, reason: 'no customer email' })
      }

      const subject = `Idiphozithi ifunyenwe — ${booking.event_type} e-${booking.venue_city}`
      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
          <h2 style="color: #C9A84C;">Enkosi — idiphozithi ifunyenwe</h2>
          <p>Sawubona ${customer?.full_name ?? ''},</p>
          <p>Sifumene idiphozithi yakho yokubhuka. Siza kuqhagamshelana nawe ngokukhawuleza ukuze siqinisekise ukubhuka.</p>
          <p><strong>Uhlobo lomnyhadala:</strong> ${booking.event_type}</p>
          <p><strong>Umhla:</strong> ${formatDateXh(booking.event_date)}</p>
          <p><strong>Indawo:</strong> ${booking.venue_name}, ${booking.venue_city}</p>
        </div>
      `

      const result = await sendEmail({ to: recipient, subject, html })

      await logEmail(supabase, {
        triggerName: TRIGGER,
        recipient,
        status: result.ok ? 'sent' : 'failed',
        errorMessage: result.error ?? null,
        payloadRef: bookingId,
      })

      return jsonResponse({ ok: result.ok, email_id: result.id ?? null })
    }

    if (type === 'transport_update') {
      const recipient = djEmail()
      const adminUrl = `${appUrl()}/admin/bookings`
      const subject = `Uhlaziyo lwethransport — ${booking.event_type} e-${booking.venue_city}`
      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
          <h2 style="color: #C9A84C;">Uhlaziyo lwethransport</h2>
          <p>Ithransport fee yokubhuka ilungisiwe.</p>
          <p><strong>Imali iyonke:</strong> ${formatCurrency(booking.total_amount)}</p>
          <p><strong>Idiphozithi:</strong> ${formatCurrency(booking.deposit_amount)}</p>
          <p><a href="${adminUrl}">${adminUrl}</a></p>
        </div>
      `

      const result = await sendEmail({ to: recipient, subject, html })

      await logEmail(supabase, {
        triggerName: TRIGGER,
        recipient,
        status: result.ok ? 'sent' : 'failed',
        errorMessage: result.error ?? null,
        payloadRef: bookingId,
      })

      if (!result.ok) {
        return jsonResponse({ error: result.error ?? 'Failed to send email' }, 502)
      }

      return jsonResponse({ ok: true, email_id: result.id })
    }

    const recipient = djEmail()
    const adminUrl = `${appUrl()}/admin/bookings`
    const subject = `Ukubhuka Okusha — ${booking.event_type} e-${booking.venue_city}`

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
        <h2 style="color: #C9A84C;">Ukubhuka Okutsha</h2>
        <p><strong>Uhlobo lomnyhadala:</strong> ${booking.event_type}</p>
        <p><strong>Umhla:</strong> ${formatDateXh(booking.event_date)}</p>
        <p><strong>Ixesha:</strong> ${formatTime(booking.start_time)} – ${formatTime(booking.end_time)} (${booking.hours_booked} iiyure)</p>
        <p><strong>Indawo:</strong> ${booking.venue_name}, ${booking.venue_city}</p>
        <p><strong>Ubungakanani bomphakathi:</strong> ${crowdSizeLabelXh(booking.crowd_size)}</p>
        <p><strong>Imali iyonke:</strong> ${formatCurrency(booking.total_amount)}</p>
        <p><strong>Idiphozithi:</strong> ${formatCurrency(booking.deposit_amount)}</p>
        <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 24px 0;" />
        <p><strong>Igama lomthengi:</strong> ${customer?.full_name ?? '—'}</p>
        <p><strong>Imeyile:</strong> ${customer?.email ?? '—'}</p>
        <p><strong>Fowuni:</strong> ${customer?.cell_number ?? '—'}</p>
        <p style="margin-top: 24px;">Iya ku-admin ukuphendula: <a href="${adminUrl}">${adminUrl}</a></p>
      </div>
    `

    const result = await sendEmail({ to: recipient, subject, html })

    await logEmail(supabase, {
      triggerName: TRIGGER,
      recipient,
      status: result.ok ? 'sent' : 'failed',
      errorMessage: result.error ?? null,
      payloadRef: bookingId,
    })

    if (!result.ok) {
      return jsonResponse({ error: result.error ?? 'Failed to send email' }, 502)
    }

    return jsonResponse({ ok: true, email_id: result.id })
  } catch (error) {
    console.error('send-booking-notification error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
