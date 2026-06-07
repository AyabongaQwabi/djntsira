import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, AlertCircle } from 'lucide-react'
import { usePurchaseByToken, useTrack } from '../../hooks/useTracks'
import { useBundle } from '../../hooks/useBundles'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const triggerDownload = (url, filename) => {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || 'download.mp3'
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

const SecureDownload = () => {
  const { token } = useParams()
  const { t } = useTranslation()
  const [downloadError, setDownloadError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const {
    data: purchase,
    isLoading: purchaseLoading,
    error: purchaseError,
  } = usePurchaseByToken(token)

  const { data: track } = useTrack(purchase?.track_id)
  const { data: bundle } = useBundle(purchase?.bundle_id)

  const isExpired =
    purchase?.download_expires_at &&
    new Date(purchase.download_expires_at) < new Date()

  const isPaid = purchase?.status === 'paid'

  const markDownloaded = useCallback(async () => {
    if (!token || downloaded) return
    await supabase
      .from('purchases')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('download_token', token)
    setDownloaded(true)
  }, [token, downloaded])

  const downloadFile = useCallback(
    async (filename) => {
      setDownloadError(null)
      setDownloading(true)

      try {
        const { data, error } = await supabase.functions.invoke(
          'get-download-url',
          { body: { download_token: token } },
        )

        if (error) throw error
        if (data?.error) throw new Error(data.error)
        if (!data?.signed_url) throw new Error('Signed URL unavailable')

        triggerDownload(data.signed_url, filename || `${data.title || 'track'}.mp3`)
        await markDownloaded()
      } catch (err) {
        setDownloadError(
          err?.message ||
            t('download.error', {
              defaultValue: 'Ukukhuphela akuphumelelanga. Zama kwakhona.',
            })
        )
      } finally {
        setDownloading(false)
      }
    },
    [markDownloaded, t, token]
  )

  const handleTrackDownload = useCallback(async () => {
    if (!track?.file_url) {
      setDownloadError(
        t('download.no_file', { defaultValue: 'Ifayile ayifumaneki.' })
      )
      return
    }
    const filename = `${track.title || 'track'}.mp3`
    await downloadFile(filename)
  }, [track, downloadFile, t])

  if (purchaseLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Spinner size="lg" label={t('common.loading')} />
      </main>
    )
  }

  if (purchaseError || !purchase) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-error)]" aria-hidden="true" />
        <h1 className="font-display text-2xl text-accent">
          {t('download.invalid', { defaultValue: 'Ilink ayisebenzi' })}
        </h1>
        <p className="mt-2 text-muted">
          {t('download.invalid_body', {
            defaultValue: 'Le link yokukhuphela ayivumelekile okanye iphelelwe lixesha.',
          })}
        </p>
        <Link to="/music" className="mt-6 inline-block">
          <Button>{t('music.back_store', { defaultValue: 'Buyela evenkileni' })}</Button>
        </Link>
      </main>
    )
  }

  if (!isPaid) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-warning)]" aria-hidden="true" />
        <h1 className="font-display text-2xl text-accent">
          {t('download.not_paid', { defaultValue: 'Intlawulo ayiqinisekanga' })}
        </h1>
        <p className="mt-2 text-muted">
          {t('download.not_paid_body', {
            defaultValue: 'Ukukhuphela kuyafumaneka emva kokuba intlawulo iqinisekile.',
          })}
        </p>
      </main>
    )
  }

  if (isExpired) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-warning)]" aria-hidden="true" />
        <h1 className="font-display text-2xl text-accent">
          {t('download.expired', { defaultValue: 'Ilink iphelelwe lixesha' })}
        </h1>
        <p className="mt-2 text-muted">
          {t('download.expired_body', {
            defaultValue: 'Nxibelelana nathi ukuze ufumane i-link entsha.',
          })}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      <Download className="mb-4 h-12 w-12 text-accent" aria-hidden="true" />

      <h1 className="font-display text-2xl text-accent">
        {downloading
          ? t('download.preparing', { defaultValue: 'Silungiselela ukukhuphela...' })
          : downloaded
            ? t('download.started', { defaultValue: 'Ukukhuphela kuqale' })
            : t('download.title', { defaultValue: 'Khuphela umculo wakho' })}
      </h1>

      {purchase.bundle_id && bundle ? (
        <div className="mt-6 w-full space-y-3 text-left">
          <p className="text-sm text-muted">
            {t('download.bundle_hint', {
              defaultValue: 'Khetha ingoma ongathanda ukuyikhuphela:',
            })}
          </p>
          <p className="font-medium">{bundle.name}</p>
          <p className="text-sm text-muted">
            {t('download.bundle_tracks', {
              defaultValue: 'Le phakeji iquka iingoma ezininzi — uxhumane nathi ukuze ufumane zonke.',
            })}
          </p>
        </div>
      ) : null}

      {downloadError ? (
        <p className="mt-4 text-sm text-[var(--color-error)]" role="alert">
          {downloadError}
        </p>
      ) : null}

      {purchase.track_id && track ? (
        <Button
          type="button"
          className="mt-6"
          size="lg"
          fullWidth
          loading={downloading}
          onClick={handleTrackDownload}
        >
          {t('download.retry', { defaultValue: 'Zama ukukhuphela kwakhona' })}
        </Button>
      ) : null}

      <Link to="/music" className="mt-4 inline-block">
        <Button variant="ghost">{t('music.back_store', { defaultValue: 'Buyela evenkileni' })}</Button>
      </Link>
    </main>
  )
}

export default SecureDownload
