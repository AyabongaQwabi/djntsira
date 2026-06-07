import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { isServiceRoleRequest } from '../_shared/auth.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { logEmail } from '../_shared/email-log.ts'
import { appUrl, formatDateEn } from '../_shared/format.ts'

const TRIGGER = 'send-purchase-receipt'

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
    const body = await req.json().catch(() => ({}))
    const purchaseId = body?.purchase_id as string | undefined

    if (!purchaseId) {
      return jsonResponse({ error: 'purchase_id is required' }, 400)
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(
        'id,status,download_token,download_expires_at,track:tracks(title),bundle:bundles(name),customer:customers(full_name,email)',
      )
      .eq('id', purchaseId)
      .maybeSingle()

    if (purchaseError) {
      return jsonResponse({ error: purchaseError.message }, 500)
    }

    if (!purchase) {
      return jsonResponse({ error: 'Purchase not found' }, 404)
    }

    if (purchase.status !== 'paid') {
      return jsonResponse({ error: 'Purchase is not paid' }, 400)
    }

    const customer = Array.isArray(purchase.customer)
      ? purchase.customer[0]
      : purchase.customer

    if (!customer?.email) {
      return jsonResponse({ error: 'Customer email not found' }, 400)
    }

    const track = Array.isArray(purchase.track)
      ? purchase.track[0]
      : purchase.track
    const bundle = Array.isArray(purchase.bundle)
      ? purchase.bundle[0]
      : purchase.bundle

    const itemName = track?.title ?? bundle?.name ?? 'your purchase'
    const downloadUrl = `${appUrl()}/download/${purchase.download_token}`
    const expiryDate = purchase.download_expires_at
      ? formatDateEn(purchase.download_expires_at)
      : '7 days from purchase'

    const subject = 'Your download is ready — DJ Ntsira'
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
        <h2 style="color: #C9A84C;">Thank you for your purchase!</h2>
        <p>Hi ${customer.full_name},</p>
        <p>Your download for <strong>${itemName}</strong> is ready.</p>
        <p style="margin: 24px 0;">
          <a href="${downloadUrl}" style="background: #C9A84C; color: #1A1A1A; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Download now
          </a>
        </p>
        <p><strong>Download link:</strong> <a href="${downloadUrl}">${downloadUrl}</a></p>
        <p style="color: #666;">This link expires on ${expiryDate}. Save your files before then.</p>
        <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 24px 0;" />
        <p>Follow DJ Ntsira:</p>
        <p>
          <a href="https://www.instagram.com/">Instagram</a> ·
          <a href="https://www.facebook.com/">Facebook</a> ·
          <a href="https://wa.me/27603116777">WhatsApp</a>
        </p>
        <p style="color: #888; font-size: 14px;">DJ Ntsira · Gqom from Komani</p>
      </div>
    `

    const result = await sendEmail({
      to: customer.email,
      subject,
      html,
    })

    await logEmail(supabase, {
      triggerName: TRIGGER,
      recipient: customer.email,
      status: result.ok ? 'sent' : 'failed',
      errorMessage: result.error ?? null,
      payloadRef: purchaseId,
    })

    if (!result.ok) {
      return jsonResponse({ error: result.error ?? 'Failed to send email' }, 502)
    }

    return jsonResponse({ ok: true, email_id: result.id })
  } catch (error) {
    console.error('send-purchase-receipt error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
