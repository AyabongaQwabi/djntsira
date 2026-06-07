import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import { getItemPricing } from '../../lib/pricing'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const BundleCard = ({ bundle, includedTracks = [], onBuy }) => {
  const { t } = useTranslation()
  const pricing = getItemPricing(bundle)
  const tracksValue = includedTracks.reduce((sum, tr) => sum + Number(tr.price || 0), 0)

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-accent/20 via-surface-2 to-surface">
        <Package className="h-16 w-16 text-accent" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-xl text-[var(--color-text)]">{bundle.name}</h3>
            <Badge variant="gold" className="mt-2">
              {t('music.bundle')}
            </Badge>
          </div>
          {pricing.label ? <Badge variant="amber">{pricing.label}</Badge> : null}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl text-accent">
            {formatCurrency(pricing.current)}
          </span>
          {tracksValue > pricing.current ? (
            <span className="text-sm text-muted line-through">
              {formatCurrency(tracksValue)}
            </span>
          ) : pricing.hasDiscount ? (
            <span className="text-sm text-muted line-through">
              {formatCurrency(pricing.base)}
            </span>
          ) : null}
        </div>

        {includedTracks.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted">
            {includedTracks.slice(0, 4).map((tr) => (
              <li key={tr.id} className="truncate">
                • {tr.title}
              </li>
            ))}
            {includedTracks.length > 4 ? (
              <li className="text-accent">
                +{includedTracks.length - 4}{' '}
                {t('music.more_tracks', { defaultValue: 'ezinye' })}
              </li>
            ) : null}
          </ul>
        ) : null}

        <Button type="button" fullWidth onClick={() => onBuy(bundle, 'bundle')}>
          {t('music.buy')}
        </Button>
      </div>
    </article>
  )
}

export default BundleCard
