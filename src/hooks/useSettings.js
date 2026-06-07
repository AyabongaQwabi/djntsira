import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { settingsSchema } from '../lib/schemas'

const SETTINGS_COLUMNS =
  'id,day_rate,night_rate,night_start_hour,transport_threshold_km,transport_base_fee,base_city,base_lat,base_lng,deposit_percent,travel_buffer_hours,download_expiry_days,hospitality_text_xh,hospitality_text_en,updated_at'

/** Fetch singleton settings row */
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select(SETTINGS_COLUMNS)
        .eq('id', 1)
        .single()
      if (error) throw error
      return data
    },
  })
}

/**
 * Update settings with PRD validation (min rates, deposit 10–100%, night_start 0–23).
 * @param {Partial<import('../lib/schemas').settingsSchema>} partial
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (partial) => {
      const { data: current, error: fetchError } = await supabase
        .from('settings')
        .select(SETTINGS_COLUMNS)
        .eq('id', 1)
        .single()
      if (fetchError) throw fetchError

      const merged = { ...current, ...partial }
      const parsed = settingsSchema.safeParse(merged)
      if (!parsed.success) {
        const message = parsed.error.issues.map((e) => e.message).join('; ')
        throw new Error(message)
      }

      const { data, error } = await supabase
        .from('settings')
        .update({
          ...parsed.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
        .select(SETTINGS_COLUMNS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
