import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { stripPhone } from '../lib/phone'

const BOOKING_COLUMNS =
  'id,customer_id,event_type,venue_name,venue_city,crowd_size,event_date,start_time,end_time,is_night,hours_booked,hourly_rate,transport_fee,deposit_amount,total_amount,status,hospitality_acknowledged,notes,payment_ref,created_at'

/**
 * Fetch bookings with optional filters.
 * @param {{ status?: string, dateFrom?: string, dateTo?: string }} [filters]
 */
export const useBookings = (filters = {}) => {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      let query = supabase.from('bookings').select(BOOKING_COLUMNS)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('event_date', filters.dateTo)
      const { data, error } = await query.order('event_date', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

/** Bookings for a specific date (clash detection) */
export const useBookingsByDate = (date) => {
  return useQuery({
    queryKey: ['bookings', 'date', date],
    enabled: Boolean(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_COLUMNS)
        .eq('event_date', date)
        .in('status', ['pending', 'deposit_requested', 'deposit_paid', 'confirmed'])
      if (error) throw error
      return data
    },
  })
}

/**
 * Create booking: upsert customer, insert pending booking, notify DJ.
 * @param {object} payload — validated form + pricing fields
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const email = payload.email.trim().toLowerCase()

      const { data: existingCustomer, error: lookupError } = await supabase
        .from('customers')
        .select('id, type')
        .ilike('email', email)
        .maybeSingle()

      if (lookupError) throw lookupError

      let customerId

      if (existingCustomer) {
        const newType =
          existingCustomer.type === 'buyer' || existingCustomer.type === 'both'
            ? 'both'
            : 'booker'

        const { data, error } = await supabase
          .from('customers')
          .update({
            full_name: payload.full_name,
            cell_number: stripPhone(payload.cell_number),
            type: newType,
          })
          .eq('id', existingCustomer.id)
          .select('id')
          .single()

        if (error) throw error
        customerId = data.id
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            full_name: payload.full_name,
            cell_number: stripPhone(payload.cell_number),
            email,
            type: 'booker',
          })
          .select('id')
          .single()

        if (error) throw error
        customerId = data.id
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerId,
          event_type: payload.event_type,
          venue_name: payload.venue_name,
          venue_city: payload.venue_city,
          crowd_size: payload.crowd_size,
          event_date: payload.event_date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          is_night: payload.is_night,
          hours_booked: payload.hours_booked,
          hourly_rate: payload.hourly_rate,
          transport_fee: payload.transport_fee,
          deposit_amount: payload.deposit_amount,
          total_amount: payload.total_amount,
          status: 'pending',
          hospitality_acknowledged: payload.hospitality_acknowledged,
          notes: payload.notes || null,
        })
        .select(BOOKING_COLUMNS)
        .single()

      if (bookingError) throw bookingError

      await supabase.functions.invoke('send-booking-notification', {
        body: { booking_id: booking.id },
      })

      return booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

/** Update booking status — Agent 5 enforces transition matrix */
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      throw new Error('useUpdateBookingStatus not implemented')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export { BOOKING_COLUMNS }

const BOOKING_PAYMENT_COLUMNS =
  'id, status, deposit_amount, event_type, venue_city, payment_ref'

/** Poll booking deposit status on payment success — never marks paid client-side. */
export const useBookingPayment = (bookingId) => {
  return useQuery({
    queryKey: ['booking', 'payment', bookingId],
    enabled: Boolean(bookingId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_PAYMENT_COLUMNS)
        .eq('id', bookingId)
        .single()
      if (error) throw error
      return data
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'deposit_requested' ? 3000 : false,
  })
}
