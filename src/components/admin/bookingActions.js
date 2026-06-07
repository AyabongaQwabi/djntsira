import { supabase } from '../../lib/supabase'
import { canTransition } from '../../lib/booking-status'
import { createYocoCheckout } from '../../lib/yoco'

export const fetchBookingsWithCustomers = async (filters = {}) => {
  let query = supabase
    .from('bookings')
    .select(
      'id,customer_id,event_type,venue_name,venue_city,crowd_size,event_date,start_time,end_time,is_night,hours_booked,hourly_rate,transport_fee,deposit_amount,total_amount,status,hospitality_acknowledged,notes,payment_ref,created_at,customers(id,full_name,cell_number,email)'
    )

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('event_date', filters.dateTo)

  const { data, error } = await query.order('event_date', { ascending: true })
  if (error) throw error
  return data
}

export const updateBookingStatus = async ({ id, fromStatus, toStatus }) => {
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(`Cannot transition from ${fromStatus} to ${toStatus}`)
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: toStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateBookingTransport = async ({
  id,
  transportFee,
  totalAmount,
  depositAmount,
}) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      transport_fee: transportFee,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const sendDepositRequest = async (booking, customer) => {
  if (booking.status === 'pending') {
    await updateBookingStatus({
      id: booking.id,
      fromStatus: booking.status,
      toStatus: 'deposit_requested',
    })
  }

  const { redirectUrl } = await createYocoCheckout({
    type: 'booking_deposit',
    bookingId: booking.id,
    description: `Booking deposit — ${booking.event_type} (${booking.venue_city})`,
  })

  const { error } = await supabase.functions.invoke('send-booking-notification', {
    body: {
      type: 'deposit_request',
      booking_id: booking.id,
      payment_url: redirectUrl,
    },
  })

  if (error) throw error

  return redirectUrl
}

export const notifyTransportChange = async (bookingId) => {
  const { error } = await supabase.functions.invoke('send-booking-notification', {
    body: {
      type: 'transport_update',
      booking_id: bookingId,
    },
  })

  if (error) throw error
}

export const addAvailabilitySlot = async ({ date, startTime, endTime }) => {
  const { data, error } = await supabase
    .from('availability')
    .insert({
      date,
      start_time: startTime,
      end_time: endTime,
      is_blocked: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const removeAvailabilitySlot = async (id) => {
  const { error } = await supabase.from('availability').delete().eq('id', id)
  if (error) throw error
}

export const fetchMonthBookings = async (year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id,event_date,start_time,end_time,status,event_type,venue_city,customers(full_name)'
    )
    .gte('event_date', start)
    .lte('event_date', end)
    .in('status', ['pending', 'deposit_requested', 'deposit_paid', 'confirmed', 'completed'])

  if (error) throw error
  return data
}

export const fetchMonthAvailability = async (year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('availability')
    .select('id,date,start_time,end_time,is_blocked')
    .gte('date', start)
    .lte('date', end)
    .eq('is_blocked', false)
    .order('date')
    .order('start_time')

  if (error) throw error
  return data
}
