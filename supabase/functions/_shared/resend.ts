type SendEmailParams = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

type SendEmailResult = {
  ok: boolean
  id?: string
  error?: string
}

export const sendEmail = async (
  params: SendEmailParams,
): Promise<SendEmailResult> => {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  const from = Deno.env.get('RESEND_FROM_EMAIL') ??
    'DJ Ntsira <bookings@djntsira.co.za>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? response.statusText
    return { ok: false, error: String(message) }
  }

  return { ok: true, id: payload?.id }
}
