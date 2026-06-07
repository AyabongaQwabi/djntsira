const YOCO_API_BASE = 'https://payments.yoco.com/api'

export type YocoLineItem = {
  displayName: string
  quantity: number
  pricingDetails: { price: number }
  description?: string | null
}

export type CreateCheckoutRequest = {
  amount: number
  currency: 'ZAR'
  cancelUrl?: string
  successUrl?: string
  failureUrl?: string
  metadata?: Record<string, unknown>
  lineItems?: YocoLineItem[]
  clientReferenceId?: string
  externalId?: string
}

export type YocoCheckout = {
  id: string
  status: 'created' | 'started' | 'processing' | 'completed' | string
  amount: number
  currency: string
  redirectUrl: string
  paymentId?: string | null
  metadata?: Record<string, unknown> | null
}

export const yocoConfig = () => {
  const secretKey = Deno.env.get('YOCO_SECRET_KEY')?.trim()

  if (!secretKey) {
    throw new Error(
      'Yoco is not configured. Set YOCO_SECRET_KEY as a Supabase secret (sk_test_... or sk_live_...).',
    )
  }

  return { secretKey }
}

export const amountToCents = (amount: number | string) =>
  Math.round(Number(amount) * 100)

const yocoHeaders = (secretKey: string, idempotencyKey?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  return headers
}

export const createCheckout = async (
  request: CreateCheckoutRequest,
  idempotencyKey?: string,
): Promise<YocoCheckout> => {
  const { secretKey } = yocoConfig()

  const response = await fetch(`${YOCO_API_BASE}/checkouts`, {
    method: 'POST',
    headers: yocoHeaders(secretKey, idempotencyKey),
    body: JSON.stringify(request),
  })

  const data = await response.json().catch(() => ({})) as YocoCheckout & {
    message?: string
  }

  if (!response.ok) {
    throw new Error(
      data.message ?? `Yoco checkout creation failed (${response.status})`,
    )
  }

  if (!data.redirectUrl) {
    throw new Error('Yoco did not return a redirectUrl')
  }

  return data
}

export const getCheckout = async (checkoutId: string): Promise<YocoCheckout> => {
  const { secretKey } = yocoConfig()

  const response = await fetch(`${YOCO_API_BASE}/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: yocoHeaders(secretKey),
  })

  const data = await response.json().catch(() => ({})) as YocoCheckout & {
    message?: string
  }

  if (!response.ok) {
    throw new Error(
      data.message ?? `Yoco checkout lookup failed (${response.status})`,
    )
  }

  return data
}

/** Checkout is paid when Yoco marks it completed (see Checkout API status enum). */
export const isCheckoutPaid = (checkout: YocoCheckout) =>
  checkout.status === 'completed' || Boolean(checkout.paymentId)

export const bookingDepositReference = (bookingId: string) =>
  `booking_deposit_${bookingId}`

export const parseBookingDepositReference = (reference: string) => {
  const prefix = 'booking_deposit_'
  if (!reference.startsWith(prefix)) return null
  const bookingId = reference.slice(prefix.length)
  return bookingId || null
}
