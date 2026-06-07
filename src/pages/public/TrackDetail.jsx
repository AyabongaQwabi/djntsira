import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useTrack } from '../../hooks/useTracks'
import { TRACK_CATEGORIES } from '../../lib/constants'
import { formatCurrency } from '../../lib/format'
import { getItemPricing } from '../../lib/pricing'
import CoverImage from '../../components/music/CoverImage'
import PreviewPlayer from '../../components/music/PreviewPlayer'
import BuyModal from '../../components/music/BuyModal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const TrackDetail = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const [buyOpen, setBuyOpen] = useState(false)
  const { data: track, isLoading, error } = useTrack(id)

  const lang = i18n.language?.startsWith('en') ? 'en' : 'xh'

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Spinner size="lg" label={t('common.loading')} />
      </main>
    )
  }

  if (error || !track) {
    return (
      <main className="min-h-screen p-4">
        <Link
          to="/music"
          className="mb-6 inline-flex min-h-touch items-center gap-2 text-accent"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('music.back', { defaultValue: 'Buyela emva' })}
        </Link>
        <p className="text-[var(--color-error)]" role="alert">
          {t('music.not_found', { defaultValue: 'Le ngoma ayifumaneki.' })}
        </p>
      </main>
    )
  }

  const pricing = getItemPricing(track)
  const categoryLabel = TRACK_CATEGORIES[track.category]?.[lang] || track.category

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <Link
        to="/music"
        className="mb-6 inline-flex min-h-touch items-center gap-2 text-accent hover:underline"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        {t('music.back', { defaultValue: 'Buyela emva' })}
      </Link>

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <CoverImage src={track.cover_url} alt={track.title} size="lg" />

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-4xl text-[var(--color-text)]">{track.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="gold">{categoryLabel}</Badge>
              {pricing.label ? <Badge variant="amber">{pricing.label}</Badge> : null}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-accent">
              {formatCurrency(pricing.current)}
            </span>
            {pricing.hasDiscount ? (
              <span className="text-lg text-muted line-through">
                {formatCurrency(pricing.base)}
              </span>
            ) : null}
          </div>

          <PreviewPlayer track={track} />

          <Button type="button" size="lg" fullWidth onClick={() => setBuyOpen(true)}>
            {t('music.buy')}
          </Button>
        </div>
      </div>

      <BuyModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        item={track}
        itemType="track"
      />
    </main>
  )
}

export default TrackDetail
