import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const CUSTOMER_COLUMNS =
  'id,full_name,cell_number,email,type,marketing_opted_out,created_at'

const PURCHASE_COLUMNS =
  'id,customer_id,track_id,bundle_id,amount_paid,payment_ref,status,paid_at,download_token,created_at'

/**
 * Fetch customers with optional type filter.
 * @param {{ type?: 'buyer'|'booker'|'both', search?: string, tab?: 'buyers'|'bookers' }} [filters]
 */
export const useCustomers = (filters = {}) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      let query = supabase.from('customers').select(CUSTOMER_COLUMNS)

      if (filters.tab === 'buyers') {
        query = query.in('type', ['buyer', 'both'])
      } else if (filters.tab === 'bookers') {
        query = query.in('type', ['booker', 'both'])
      } else if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (filters.search) {
        const term = filters.search.replace(/%/g, '')
        query = query.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,cell_number.ilike.%${term}%`
        )
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Buyers tab with purchase aggregates */
export const useBuyersWithStats = (search = '') => {
  return useQuery({
    queryKey: ['customers', 'buyers-stats', search],
    queryFn: async () => {
      let customerQuery = supabase
        .from('customers')
        .select(CUSTOMER_COLUMNS)
        .in('type', ['buyer', 'both'])

      if (search) {
        const term = search.replace(/%/g, '')
        customerQuery = customerQuery.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,cell_number.ilike.%${term}%`
        )
      }

      const { data: customers, error: custError } = await customerQuery.order(
        'created_at',
        { ascending: false }
      )
      if (custError) throw custError
      if (!customers?.length) return []

      const ids = customers.map((c) => c.id)
      const { data: purchases, error: purchError } = await supabase
        .from('purchases')
        .select(PURCHASE_COLUMNS)
        .in('customer_id', ids)

      if (purchError) throw purchError

      return customers.map((customer) => {
        const custPurchases = (purchases || []).filter(
          (p) => p.customer_id === customer.id
        )
        const paid = custPurchases.filter((p) => p.status === 'paid')
        const totalSpent = paid.reduce((sum, p) => sum + Number(p.amount_paid), 0)
        const lastPurchase = paid.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0]

        return {
          ...customer,
          tracksPurchased: paid.length,
          totalSpent,
          lastPurchaseDate: lastPurchase?.created_at || null,
          pendingPurchases: custPurchases.filter((p) => p.status === 'pending'),
        }
      })
    },
  })
}

/** Bookers tab with booking aggregates */
export const useBookersWithStats = (search = '') => {
  return useQuery({
    queryKey: ['customers', 'bookers-stats', search],
    queryFn: async () => {
      let customerQuery = supabase
        .from('customers')
        .select(CUSTOMER_COLUMNS)
        .in('type', ['booker', 'both'])

      if (search) {
        const term = search.replace(/%/g, '')
        customerQuery = customerQuery.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,cell_number.ilike.%${term}%`
        )
      }

      const { data: customers, error: custError } = await customerQuery.order(
        'created_at',
        { ascending: false }
      )
      if (custError) throw custError
      if (!customers?.length) return []

      const ids = customers.map((c) => c.id)
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('id,customer_id,total_amount,status,event_date,created_at')
        .in('customer_id', ids)
        .neq('status', 'cancelled')

      if (bookError) throw bookError

      return customers.map((customer) => {
        const custBookings = (bookings || []).filter(
          (b) => b.customer_id === customer.id
        )
        const totalSpent = custBookings.reduce(
          (sum, b) => sum + Number(b.total_amount),
          0
        )
        const lastBooking = custBookings.sort(
          (a, b) => new Date(b.event_date) - new Date(a.event_date)
        )[0]

        return {
          ...customer,
          eventsBooked: custBookings.length,
          totalSpent,
          lastBookingDate: lastBooking?.event_date || null,
        }
      })
    },
  })
}

/** Purchases for a customer (Mark as Paid) */
export const useCustomerPurchases = (customerId) => {
  return useQuery({
    queryKey: ['purchases', 'customer', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(PURCHASE_COLUMNS)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

/** Mark purchase as paid (redirect failure recovery) */
export const useMarkPurchasePaid = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (purchaseId) => {
      const { data, error } = await supabase
        .from('purchases')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', purchaseId)
        .select()
        .single()

      if (error) throw error

      const { error: fnError } = await supabase.functions.invoke(
        'send-purchase-receipt',
        { body: { purchase_id: purchaseId } }
      )

      if (fnError) throw fnError

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/** Email logs for admin resend */
export const useEmailLogs = (filters = {}) => {
  return useQuery({
    queryKey: ['email_logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('email_logs')
        .select('id,trigger_name,recipient,status,error_message,payload_ref,created_at')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50)

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.recipient) query = query.eq('recipient', filters.recipient)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

/** Resend failed email via original edge function */
export const useResendEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (log) => {
      const fnMap = {
        'send-purchase-receipt': 'send-purchase-receipt',
        'send-booking-notification': 'send-booking-notification',
        'send-marketing-email': 'send-marketing-email',
      }

      const fnName = fnMap[log.trigger_name]
      if (!fnName) {
        throw new Error(`Cannot resend: unknown trigger ${log.trigger_name}`)
      }

      let body = {}
      if (log.payload_ref) {
        try {
          body = JSON.parse(log.payload_ref)
        } catch {
          body = { payloadRef: log.payload_ref }
        }
      }

      const { error } = await supabase.functions.invoke(fnName, { body })
      if (error) throw error

      return log
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_logs'] })
    },
  })
}

/** Sent marketing campaigns log */
export const useSentCampaigns = () => {
  return useQuery({
    queryKey: ['sent_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sent_campaigns')
        .select('id,subject,body,recipient_count,sent_at')
        .order('sent_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

/**
 * Preview marketing recipient count.
 * @param {{ segment: 'all_bookers'|'date_range', dateFrom?: string, dateTo?: string }} params
 */
export const useMarketingRecipientCount = (params) => {
  return useQuery({
    queryKey: ['marketing-recipients', params],
    enabled:
      Boolean(params?.segment) &&
      (params.segment !== 'date_range' ||
        (Boolean(params.dateFrom) && Boolean(params.dateTo))),
    queryFn: async () => {
      let customerIds = new Set()

      if (params.segment === 'all_bookers') {
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .in('type', ['booker', 'both'])
          .eq('marketing_opted_out', false)

        if (error) throw error
        data?.forEach((c) => customerIds.add(c.id))
      } else if (params.segment === 'date_range' && params.dateFrom && params.dateTo) {
        const { data: bookings, error: bookError } = await supabase
          .from('bookings')
          .select('customer_id')
          .gte('event_date', params.dateFrom)
          .lte('event_date', params.dateTo)
          .neq('status', 'cancelled')

        if (bookError) throw bookError

        const ids = [...new Set(bookings?.map((b) => b.customer_id) || [])]
        if (ids.length) {
          const { data: customers, error: custError } = await supabase
            .from('customers')
            .select('id')
            .in('id', ids)
            .eq('marketing_opted_out', false)

          if (custError) throw custError
          customers?.forEach((c) => customerIds.add(c.id))
        }
      }

      return customerIds.size
    },
  })
}

/** Send marketing campaign */
export const useSendMarketingEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subject, body, segment, dateFrom, dateTo }) => {
      const { data, error } = await supabase.functions.invoke(
        'send-marketing-email',
        {
          body: { subject, body, segment, dateFrom, dateTo },
        }
      )

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent_campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['email_logs'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-recipients'] })
    },
  })
}

/** Upsert customer by email — Agent 2/3 implement */
export const upsertCustomer = async () => {
  throw new Error('upsertCustomer not implemented')
}
