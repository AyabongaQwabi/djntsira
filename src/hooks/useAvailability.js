import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const AVAILABILITY_COLUMNS = 'id,date,start_time,end_time,is_blocked,created_at'

/** Fetch availability slots, optionally filtered by month */
export const useAvailability = (month) => {
  return useQuery({
    queryKey: ['availability', month],
    queryFn: async () => {
      let query = supabase
        .from('availability')
        .select(AVAILABILITY_COLUMNS)
        .eq('is_blocked', false)

      if (month) {
        const [year, m] = month.split('-')
        const start = `${year}-${m}-01`
        const end = new Date(Number(year), Number(m), 0).toISOString().slice(0, 10)
        query = query.gte('date', start).lte('date', end)
      }

      const { data, error } = await query.order('date').order('start_time')
      if (error) throw error
      return data
    },
  })
}

/** Admin: add/remove availability slot — Agent 5 implements */
export const useAvailabilityMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      throw new Error('useAvailabilityMutation not implemented')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}
