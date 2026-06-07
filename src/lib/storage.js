import { supabase } from './supabase'

/** Path stored on track.file_url — strip accidental bucket prefix before storage API calls. */
export const normalizeTrackStoragePath = (fileUrl) => {
  if (!fileUrl) return ''
  return fileUrl.replace(/^tracks\//, '')
}

/** Public URL for a cover stored in the `covers` bucket (or pass through full http URLs). */
export const getCoverPublicUrl = (coverUrl) => {
  if (!coverUrl) return null
  if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
    return coverUrl
  }
  const path = coverUrl.replace(/^\//, '')
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
}
