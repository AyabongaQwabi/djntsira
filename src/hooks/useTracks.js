import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const TRACK_COLUMNS =
  'id,title,category,price,discount_type,discount_value,discount_expires_at,preview_duration,file_url,cover_url,published,created_at'

/**
 * Fetch published tracks for public store.
 * @param {{ publishedOnly?: boolean, category?: string }} [filters]
 */
export const useTracks = (filters = {}) => {
  const { publishedOnly = true, category } = filters

  return useQuery({
    queryKey: ['tracks', filters],
    queryFn: async () => {
      let query = supabase.from('tracks').select(TRACK_COLUMNS)

      if (publishedOnly) query = query.eq('published', true)
      if (category) query = query.eq('category', category)

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/**
 * Fetch single track by ID.
 * @param {string} id
 */
export const useTrack = (id) => {
  return useQuery({
    queryKey: ['track', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select(TRACK_COLUMNS)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

/** Admin: create/update track — Agent 4 implements upload logic */
export const useTrackMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      throw new Error('useTrackMutation not implemented')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracks'] }),
  })
}

const PURCHASE_COLUMNS =
  'id, status, amount_paid, track_id, bundle_id, download_token, download_expires_at, paid_at, downloaded_at, created_at'

/** Poll purchase status on payment success — never marks paid client-side. */
export const usePurchase = (id) => {
  return useQuery({
    queryKey: ['purchase', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(PURCHASE_COLUMNS)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 3000 : false,
  })
}

/** Validate download token for secure download page. */
export const usePurchaseByToken = (token) => {
  return useQuery({
    queryKey: ['purchase', 'token', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(PURCHASE_COLUMNS)
        .eq('download_token', token)
        .single()
      if (error) throw error
      return data
    },
  })
}
