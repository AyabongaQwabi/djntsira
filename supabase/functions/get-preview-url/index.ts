import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const PREVIEW_TTL_SECONDS = 300 // 5 minutes

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const trackId = body?.track_id as string | undefined

    if (!trackId) {
      return jsonResponse({ error: 'track_id is required' }, 400)
    }

    const supabase = createAdminClient()

    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id,title,file_url,published,preview_duration')
      .eq('id', trackId)
      .maybeSingle()

    if (trackError) {
      return jsonResponse({ error: trackError.message }, 500)
    }

    if (!track || !track.published) {
      return jsonResponse({ error: 'Track not found or not published' }, 404)
    }

    if (!track.file_url) {
      return jsonResponse({ error: 'Track file is not available' }, 404)
    }

    const storagePath = track.file_url.replace(/^tracks\//, '')

    const { data: signed, error: signError } = await supabase.storage
      .from('tracks')
      .createSignedUrl(storagePath, PREVIEW_TTL_SECONDS)

    if (signError || !signed?.signedUrl) {
      return jsonResponse(
        { error: signError?.message ?? 'Failed to create preview URL' },
        500,
      )
    }

    return jsonResponse({
      signed_url: signed.signedUrl,
      expires_in: PREVIEW_TTL_SECONDS,
      preview_duration: track.preview_duration,
      title: track.title,
    })
  } catch (error) {
    console.error('get-preview-url error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
