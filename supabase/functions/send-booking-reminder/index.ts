import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { isServiceRoleRequest } from '../_shared/auth.ts'
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

const TRIGGER = 'send-booking-reminder'

const tomorrowInSast = () => {
  const now = new Date()
  const sast = new Date(
    now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }),
  )
  sast.setDate(sast.getDate() + 1)
  const year = sast.getFullYear()
  const month = String(sast.getMonth() + 1).padStart(2, '0')
  const day = String(sast.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!isServiceRoleRequest(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()

  try {
    const targetDate = tomorrowInSast()

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        'id,event_type,venue_name,venue_city,crowd_size,event_date,start_time,end_time,hours_booked,total_amount,deposit_amount,customer:customers(full_name,cell_number,email)',
      )
      .eq('status', 'confirmed')
      .eq('event_date', targetDate)

    if (bookingsError) {
      return jsonResponse({ error: bookingsError.message }, 500)
    }

    if (!bookings?.length) {
      return jsonResponse({ ok: true, reminders_sent: 0, event_date: targetDate })
    }

    const recipient = djEmail()
    const adminUrl = `${appUrl()}/admin/bookings`
    let sentCount = 0

    for (const booking of bookings) {
      const customer = Array.isArray(booking.customer)
        ? booking.customer[0]
        : booking.customer

      const subject =
        `Isikhumbuzi — ${booking.event_type} e-${booking.venue_city} ngomso`

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
          <h2 style="color: #C9A84C;">Isikhumbuzi Sombhukiso</h2>
          <p>Unombhukiso oqinisekisiweyo ngomso:</p>
          <p><strong>Uhlobo:</strong> ${booking.event_type}</p>
          <p><strong>Umhla:</strong> ${formatDateXh(booking.event_date)}</p>
          <p><strong>Ixesha:</strong> ${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}</p>
          <p><strong>Indawo:</strong> ${booking.venue_name}, ${booking.venue_city}</p>
          <p><strong>Abantu:</strong> ${crowdSizeLabelXh(booking.crowd_size)}</p>
          <p><strong>Imali iyonke:</strong> ${formatCurrency(booking.total_amount)}</p>
          <p><strong>Idiphozithi:</strong> ${formatCurrency(booking.deposit_amount)}</p>
          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 24px 0;" />
          <p><strong>Umthengi:</strong> ${customer?.full_name ?? '—'}</p>
          <p><strong>Imeyile:</strong> ${customer?.email ?? '—'}</p>
          <p><strong>Fowuni:</strong> ${customer?.cell_number ?? '—'}</p>
          <p style="margin-top: 24px;"><a href="${adminUrl}">Jonga i-admin</a></p>
        </div>
      `

      const result = await sendEmail({ to: recipient, subject, html })

      await logEmail(supabase, {
        triggerName: TRIGGER,
        recipient,
        status: result.ok ? 'sent' : 'failed',
        errorMessage: result.error ?? null,
        payloadRef: booking.id,
      })

      if (result.ok) sentCount += 1
    }

    return jsonResponse({
      ok: true,
      event_date: targetDate,
      bookings_found: bookings.length,
      reminders_sent: sentCount,
    })
  } catch (error) {
    console.error('send-booking-reminder error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
