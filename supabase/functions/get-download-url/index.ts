import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createAdminClient } from '../_shared/supabase-admin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const DOWNLOAD_TTL_SECONDS = 60

const normalizeTrackStoragePath = (fileUrl: string) =>
  fileUrl.replace(/^tracks\//, '')

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const downloadToken = body?.download_token as string | undefined

    if (!downloadToken) {
      return jsonResponse({ error: 'download_token is required' }, 400)
    }

    const supabase = createAdminClient()

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(
        'id,status,download_expires_at,track:tracks(id,title,file_url)',
      )
      .eq('download_token', downloadToken)
      .maybeSingle()

    if (purchaseError) {
      return jsonResponse({ error: purchaseError.message }, 500)
    }

    if (!purchase) {
      return jsonResponse({ error: 'Download link not found' }, 404)
    }

    if (purchase.status !== 'paid') {
      return jsonResponse({ error: 'Purchase is not paid' }, 403)
    }

    if (
      purchase.download_expires_at &&
      new Date(purchase.download_expires_at) < new Date()
    ) {
      return jsonResponse({ error: 'Download link has expired' }, 410)
    }

    const track = Array.isArray(purchase.track)
      ? purchase.track[0]
      : purchase.track

    if (!track?.file_url) {
      return jsonResponse({ error: 'Track file is not available' }, 404)
    }

    const storagePath = normalizeTrackStoragePath(track.file_url)

    const { data: signed, error: signError } = await supabase.storage
      .from('tracks')
      .createSignedUrl(storagePath, DOWNLOAD_TTL_SECONDS, {
        download: `${track.title || 'track'}.mp3`,
      })

    if (signError || !signed?.signedUrl) {
      return jsonResponse(
        { error: signError?.message ?? 'Failed to create download URL' },
        500,
      )
    }

    return jsonResponse({
      signed_url: signed.signedUrl,
      expires_in: DOWNLOAD_TTL_SECONDS,
      title: track.title,
    })
  } catch (error) {
    console.error('get-download-url error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
