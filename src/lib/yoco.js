import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { validatePurchasePrice } from './pricing'
import { usePurchase } from '../hooks/useTracks'
import { useBookingPayment } from '../hooks/useBookings'

/** Redirect browser to Yoco hosted checkout (full navigation required). */
export const redirectToPayment = (url) => {
  window.location.assign(url)
}

/** Build return/cancel/failure URLs for purchase or booking payment */
export const buildPaymentUrls = (entityId, type = 'purchase') => {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const ref = type === 'purchase' ? entityId : `${type}_${entityId}`
  return {
    returnUrl: `${appUrl}/payment/success?ref=${ref}`,
    cancelUrl: `${appUrl}/payment/cancel?ref=${ref}`,
    failureUrl: `${appUrl}/payment/failure?ref=${ref}`,
  }
}

/** Parse payment success ref into purchase UUID or booking UUID. */
export const parsePaymentRef = (ref) => {
  if (!ref) return { kind: null, id: null }

  if (ref.startsWith('booking_')) {
    return { kind: 'booking', id: ref.slice('booking_'.length) }
  }

  return { kind: 'purchase', id: ref }
}

/** Normalize email for upsert key (PRD: lower-case unique). */
export const normalizeCustomerEmail = (email) => email.trim().toLowerCase()

/** Create a Yoco checkout session via Supabase edge function. */
export const createYocoCheckout = async ({ type, purchaseId, bookingId, description }) => {
  const { data, error } = await supabase.functions.invoke('create-yoco-checkout', {
    body: {
      type,
      purchase_id: purchaseId,
      booking_id: bookingId,
      description,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/** Verify checkout with Yoco API and mark purchase/booking paid when completed. */
export const confirmYocoPayment = async ({ type, purchaseId, bookingId }) => {
  const { data, error } = await supabase.functions.invoke('confirm-yoco-payment', {
    body: {
      type,
      purchase_id: purchaseId,
      booking_id: bookingId,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Upsert customer by email for music checkout (via SECURITY DEFINER RPC).
 * Merges type to `both` when an existing booker buys music.
 */
export const upsertBuyerCustomer = async ({ full_name, cell_number, email }) => {
  const normalizedEmail = normalizeCustomerEmail(email)

  const { data: customerId, error } = await supabase.rpc('upsert_checkout_customer', {
    p_full_name: full_name.trim(),
    p_cell_number: cell_number.trim(),
    p_email: normalizedEmail,
    p_type: 'buyer',
  })

  if (error) throw error
  if (!customerId) throw new Error('Could not create customer')

  return { id: customerId }
}

/** Create a pending purchase — confirmed via Yoco checkout status API. */
export const createPendingPurchase = async ({
  customerId,
  trackId,
  bundleId,
  amountPaid,
}) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      customer_id: customerId,
      track_id: trackId || null,
      bundle_id: bundleId || null,
      amount_paid: amountPaid,
      status: 'pending',
      payment_ref: null,
    })
    .select('id, download_token, status')
    .single()

  if (error) throw error
  return data
}

/**
 * Full checkout: re-validate price, upsert customer, create pending purchase,
 * create Yoco checkout server-side, redirect to redirectUrl.
 */
export const startMusicCheckout = async ({
  item,
  trackId,
  bundleId,
  customer,
}) => {
  const amount = validatePurchasePrice(item)
  const buyer = await upsertBuyerCustomer(customer)
  const purchase = await createPendingPurchase({
    customerId: buyer.id,
    trackId,
    bundleId,
    amountPaid: amount,
  })

  const itemLabel = item?.title || item?.name || 'music'
  const { redirectUrl } = await createYocoCheckout({
    type: 'purchase',
    purchaseId: purchase.id,
    description: `DJ Ntsira — ${itemLabel}`,
  })

  return { purchase, amount, paymentUrl: redirectUrl }
}

/**
 * Poll Yoco checkout status on the success page (no webhooks).
 * Calls confirm-yoco-payment while pending, then reads DB state.
 */
export const usePaymentWithConfirmation = (ref) => {
  const queryClient = useQueryClient()
  const { kind, id } = parsePaymentRef(ref)

  const purchaseQuery = usePurchase(kind === 'purchase' ? id : null)
  const bookingQuery = useBookingPayment(kind === 'booking' ? id : null)
  const query = kind === 'booking' ? bookingQuery : purchaseQuery

  const isPending = kind === 'booking'
    ? query.data?.status === 'deposit_requested'
    : query.data?.status === 'pending'

  useEffect(() => {
    if (!id || !kind || !isPending) return

    const runConfirm = async () => {
      try {
        await confirmYocoPayment({
          type: kind === 'booking' ? 'booking_deposit' : 'purchase',
          purchaseId: kind === 'purchase' ? id : undefined,
          bookingId: kind === 'booking' ? id : undefined,
        })

        if (kind === 'purchase') {
          await queryClient.invalidateQueries({ queryKey: ['purchase', id] })
        } else {
          await queryClient.invalidateQueries({ queryKey: ['booking', 'payment', id] })
        }
      } catch (err) {
        console.error('confirm-yoco-payment failed:', err)
      }
    }

    runConfirm()
    const interval = setInterval(runConfirm, 3000)
    return () => clearInterval(interval)
  }, [id, kind, isPending, queryClient])

  return { kind, id, ...query }
}
