import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { isAuthenticatedRequest } from '../_shared/auth.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { logEmail } from '../_shared/email-log.ts'
import { appUrl } from '../_shared/format.ts'

const TRIGGER = 'send-marketing-email'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!(await isAuthenticatedRequest(req))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()

  try {
    const body = await req.json().catch(() => ({}))
    const subject = body?.subject as string | undefined
    const emailBody = body?.body as string | undefined
    const recipientIds = body?.recipient_ids as string[] | undefined

    if (!subject?.trim() || !emailBody?.trim()) {
      return jsonResponse({ error: 'subject and body are required' }, 400)
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return jsonResponse({ error: 'recipient_ids must be a non-empty array' }, 400)
    }

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id,full_name,email,marketing_opted_out')
      .in('id', recipientIds)

    if (customersError) {
      return jsonResponse({ error: customersError.message }, 500)
    }

    const eligible = (customers ?? []).filter(
      (customer) => !customer.marketing_opted_out && customer.email,
    )

    let sentCount = 0
    let failedCount = 0

    for (const customer of eligible) {
      const unsubscribeUrl =
        `${appUrl()}/unsubscribe?email=${encodeURIComponent(customer.email)}`

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
          <p>Hi ${customer.full_name},</p>
          <div>${emailBody.replace(/\n/g, '<br />')}</div>
          <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 24px 0;" />
          <p style="color: #888; font-size: 13px;">
            You received this because you are a DJ Ntsira customer.
            <a href="${unsubscribeUrl}">Unsubscribe</a> from marketing emails.
          </p>
        </div>
      `

      const result = await sendEmail({
        to: customer.email,
        subject,
        html,
        text: `${emailBody}\n\nUnsubscribe: ${unsubscribeUrl}`,
      })

      await logEmail(supabase, {
        triggerName: TRIGGER,
        recipient: customer.email,
        status: result.ok ? 'sent' : 'failed',
        errorMessage: result.error ?? null,
        payloadRef: customer.id,
      })

      if (result.ok) {
        sentCount += 1
      } else {
        failedCount += 1
      }
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('sent_campaigns')
      .insert({
        subject,
        body: emailBody,
        recipient_count: sentCount,
      })
      .select('id')
      .single()

    if (campaignError) {
      return jsonResponse({ error: campaignError.message }, 500)
    }

    return jsonResponse({
      ok: true,
      campaign_id: campaign.id,
      requested: recipientIds.length,
      eligible: eligible.length,
      sent: sentCount,
      failed: failedCount,
      skipped_opted_out: (customers ?? []).length - eligible.length,
    })
  } catch (error) {
    console.error('send-marketing-email error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
