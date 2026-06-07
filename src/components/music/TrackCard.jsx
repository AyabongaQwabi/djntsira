import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TRACK_CATEGORIES } from '../../lib/constants'
import { formatCurrency } from '../../lib/format'
import { getItemPricing } from '../../lib/pricing'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import CoverImage from './CoverImage'
import PreviewPlayer from './PreviewPlayer'

const TrackCard = ({ track, onBuy }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'xh'
  const categoryLabel = TRACK_CATEGORIES[track.category]?.[lang] || track.category
  const pricing = getItemPricing(track)
  const coverUrl = track.cover_url
    ? track.cover_url.startsWith('http')
      ? track.cover_url
      : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/covers/${track.cover_url}`
    : null

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <Link to={`/music/${track.id}`} className="block">
        <CoverImage src={coverUrl} alt={track.title} />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link
              to={`/music/${track.id}`}
              className="font-display text-xl text-[var(--color-text)] hover:text-accent"
            >
              {track.title}
            </Link>
            <Badge variant="gold" className="mt-2">
              {categoryLabel}
            </Badge>
          </div>
          {pricing.label ? <Badge variant="amber">{pricing.label}</Badge> : null}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl text-accent">
            {formatCurrency(pricing.current)}
          </span>
          {pricing.hasDiscount ? (
            <span className="text-sm text-muted line-through">
              {formatCurrency(pricing.base)}
            </span>
          ) : null}
        </div>

        <PreviewPlayer track={track} />

        <Button type="button" fullWidth onClick={() => onBuy(track, 'track')}>
          {t('music.buy')}
        </Button>
      </div>
    </article>
  )
}

export default TrackCard
