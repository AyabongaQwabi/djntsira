import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTracks } from '../../hooks/useTracks'
import { useBundles } from '../../hooks/useBundles'
import { validatePurchasePrice } from '../../lib/pricing'
import MusicFilters from '../../components/music/MusicFilters'
import TrackCard from '../../components/music/TrackCard'
import BundleCard from '../../components/music/BundleCard'
import BuyModal from '../../components/music/BuyModal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

const Music = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [buyItem, setBuyItem] = useState(null)
  const [buyType, setBuyType] = useState('track')

  const { data: tracks = [], isLoading: tracksLoading, error: tracksError } = useTracks({
    publishedOnly: true,
    category: activeTab === 'full_song' || activeTab === 'stem' ? activeTab : undefined,
  })
  const { data: bundles = [], isLoading: bundlesLoading, error: bundlesError } = useBundles(true)

  const trackMap = useMemo(
    () => Object.fromEntries(tracks.map((tr) => [tr.id, tr])),
    [tracks]
  )

  const filteredTracks = useMemo(() => {
    if (activeTab === 'bundles') return []

    const q = search.trim().toLowerCase()
    let list = [...tracks]

    if (q) {
      list = list.filter((tr) => tr.title.toLowerCase().includes(q))
    }

    list.sort((a, b) => {
      if (sort === 'price_asc') {
        return validatePurchasePrice(a) - validatePurchasePrice(b)
      }
      if (sort === 'price_desc') {
        return validatePurchasePrice(b) - validatePurchasePrice(a)
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return list
  }, [tracks, search, sort, activeTab])

  const filteredBundles = useMemo(() => {
    if (activeTab !== 'all' && activeTab !== 'bundles') return []

    const q = search.trim().toLowerCase()
    let list = [...bundles]

    if (q) {
      list = list.filter((b) => b.name.toLowerCase().includes(q))
    }

    list.sort((a, b) => {
      if (sort === 'price_asc') {
        return validatePurchasePrice(a) - validatePurchasePrice(b)
      }
      if (sort === 'price_desc') {
        return validatePurchasePrice(b) - validatePurchasePrice(a)
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return list
  }, [bundles, search, sort, activeTab])

  const isLoading = tracksLoading || bundlesLoading
  const error = tracksError || bundlesError
  const isEmpty =
    !isLoading &&
    !error &&
    filteredTracks.length === 0 &&
    filteredBundles.length === 0

  const handleBuy = (item, type) => {
    setBuyItem(item)
    setBuyType(type)
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-4xl text-accent">
          {t('music.store_title', { defaultValue: 'Ivenkile yoMculo' })}
        </h1>
        <p className="mt-2 text-muted">
          {t('music.store_subtitle', {
            defaultValue: 'Thenga iingoma, ii-stem kunye neephakeji zeGqom.',
          })}
        </p>
      </header>

      <MusicFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" label={t('common.loading')} />
        </div>
      ) : null}

      {error ? (
        <p className="mt-8 text-center text-[var(--color-error)]" role="alert">
          {t('common.error')}
        </p>
      ) : null}

      {isEmpty ? (
        <EmptyState
          className="mt-8"
          title={t('music.empty_title', { defaultValue: 'Akukho mculo okhoyo' })}
          message={t('music.empty_message', {
            defaultValue: 'Zama ukutshintsha usesho okanye ukhangela kwakhona.',
          })}
        />
      ) : null}

      {!isLoading && !error ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTracks.map((track) => (
            <TrackCard key={track.id} track={track} onBuy={handleBuy} />
          ))}
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              includedTracks={(bundle.track_ids || [])
                .map((id) => trackMap[id])
                .filter(Boolean)}
              onBuy={handleBuy}
            />
          ))}
        </div>
      ) : null}

      <BuyModal
        open={Boolean(buyItem)}
        onClose={() => {
          setBuyItem(null)
          setBuyType('track')
        }}
        item={buyItem}
        itemType={buyType}
      />
    </main>
  )
}

export default Music
