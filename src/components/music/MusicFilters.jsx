import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import Input from '../ui/Input'

const TABS = [
  { id: 'all', labelKey: 'music.filter_all', defaultLabel: 'Konke' },
  { id: 'full_song', labelKey: 'music.full_song' },
  { id: 'stem', labelKey: 'music.stem' },
  { id: 'bundles', labelKey: 'music.bundle' },
]

const SORT_OPTIONS = [
  { id: 'newest', labelKey: 'music.sort_newest', defaultLabel: 'Entsha' },
  { id: 'price_asc', labelKey: 'music.sort_price_low', defaultLabel: 'Ixabiso: Phantsi' },
  { id: 'price_desc', labelKey: 'music.sort_price_high', defaultLabel: 'Ixabiso: Phezulu' },
]

const MusicFilters = ({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              'min-h-touch shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-accent text-primary'
                : 'border border-border bg-surface text-muted hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('common.search')}
            className="pl-10"
            aria-label={t('common.search')}
          />
        </div>

        <label className="flex min-w-[180px] flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {t('music.sort_label', { defaultValue: 'Hlela nge' })}
          </span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="min-h-touch rounded-lg border border-border bg-surface px-4 py-3 text-base text-[var(--color-text)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {t(opt.labelKey, { defaultValue: opt.defaultLabel })}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

export default MusicFilters
