import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const BUNDLE_COLUMNS =
  'id,name,price,discount_type,discount_value,discount_expires_at,track_ids,published,created_at'

/** Fetch published bundles */
export const useBundles = (publishedOnly = true) => {
  return useQuery({
    queryKey: ['bundles', { publishedOnly }],
    queryFn: async () => {
      let query = supabase.from('bundles').select(BUNDLE_COLUMNS)
      if (publishedOnly) query = query.eq('published', true)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Fetch single bundle by ID */
export const useBundle = (id) => {
  return useQuery({
    queryKey: ['bundle', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundles')
        .select(BUNDLE_COLUMNS)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}
