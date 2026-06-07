import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import PreviewWaveform from './PreviewWaveform'
import {
  getActivePreviewTrackId,
  playPreview,
  stopPreview,
} from './previewManager'

const PreviewPlayer = ({ track }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(null)

  const trackId = track?.id
  const duration = track?.preview_duration || 30

  useEffect(() => {
    const syncPlaying = () => {
      setPlaying(getActivePreviewTrackId() === trackId)
    }
    const interval = setInterval(syncPlaying, 200)
    return () => clearInterval(interval)
  }, [trackId])

  useEffect(() => () => stopPreview(), [])

  const handleToggle = useCallback(async () => {
    if (!trackId) return

    if (getActivePreviewTrackId() === trackId) {
      stopPreview()
      setPlaying(false)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'get-preview-url',
        { body: { track_id: trackId } }
      )

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      const url = data?.signed_url
      if (!url) throw new Error('Preview unavailable')

      playPreview({
        trackId,
        url,
        durationSeconds: duration,
        onStart: () => setPlaying(true),
        onEnd: () => setPlaying(false),
        onError: () => {
          setError(t('music.preview_error', { defaultValue: 'Preview ayifumaneki' }))
          setPlaying(false)
        },
      })
    } catch (err) {
      setError(
        err?.message ||
          t('music.preview_error', { defaultValue: 'Preview ayifumaneki' })
      )
      setPlaying(false)
    } finally {
      setLoading(false)
    }
  }, [trackId, duration, t])

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={loading}
        onClick={handleToggle}
        className="gap-2"
        aria-pressed={playing}
      >
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        <PreviewWaveform playing={playing} />
        <span>{t('music.preview')}</span>
      </Button>
      {error ? (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default PreviewPlayer
