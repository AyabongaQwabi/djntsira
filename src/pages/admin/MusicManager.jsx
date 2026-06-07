import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Archive,
  AlertTriangle,
  Music2,
  Package,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { trackUploadSchema, bundleSchema } from '../../lib/schemas'
import { useTracks } from '../../hooks/useTracks'
import { useBundles } from '../../hooks/useBundles'
import { formatCurrency } from '../../lib/format'
import { calcDiscountedPrice } from '../../lib/pricing'
import { TRACK_CATEGORIES } from '../../lib/constants'

const TRACK_COLUMNS =
  'id,title,category,price,discount_type,discount_value,discount_expires_at,preview_duration,file_url,cover_url,published,created_at'

const inputClass =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-touch'

const MusicManager = () => {
  const [activeTab, setActiveTab] = useState('tracks')
  const [editingTrack, setEditingTrack] = useState(null)
  const [showTrackForm, setShowTrackForm] = useState(false)
  const [editingBundle, setEditingBundle] = useState(null)
  const [showBundleForm, setShowBundleForm] = useState(false)
  const [banner, setBanner] = useState(null)

  const { data: tracks = [], isLoading: tracksLoading } = useTracks({ publishedOnly: false })
  const { data: bundles = [], isLoading: bundlesLoading } = useBundles(false)
  const queryClient = useQueryClient()

  const purchaseCountsQuery = useQuery({
    queryKey: ['track-purchase-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('track_id')
        .not('track_id', 'is', null)
      if (error) throw error
      const counts = {}
      for (const row of data || []) {
        counts[row.track_id] = (counts[row.track_id] || 0) + 1
      }
      return counts
    },
  })

  const showBanner = useCallback((type, message) => {
    setBanner({ type, message })
    setTimeout(() => setBanner(null), 8000)
  }, [])

  /** Unpublish bundles that include a removed track; returns affected bundle names */
  const unpublishBundlesWithTrack = async (trackId) => {
    const { data: affected, error } = await supabase
      .from('bundles')
      .select('id, name, track_ids, published')
      .contains('track_ids', [trackId])
    if (error) throw error
    if (!affected?.length) return []

    const warnings = []
    for (const bundle of affected) {
      const newTrackIds = bundle.track_ids.filter((id) => id !== trackId)
      const updates = { track_ids: newTrackIds }
      if (bundle.published) {
        updates.published = false
        warnings.push(bundle.name)
      }
      const { error: updateError } = await supabase
        .from('bundles')
        .update(updates)
        .eq('id', bundle.id)
      if (updateError) throw updateError
    }
    queryClient.invalidateQueries({ queryKey: ['bundles'] })
    return warnings
  }

  const uploadFile = async (bucket, file, prefix) => {
    const ext = file.name.split('.').pop()
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type,
    })
    if (error) throw error
    return path
  }

  const saveTrackMutation = useMutation({
    mutationFn: async ({ form, mp3File, coverFile, trackId }) => {
      const payload = {
        title: form.title,
        category: form.category,
        price: Number(form.price),
        preview_duration: Number(form.preview_duration),
        discount_type: form.discount_type || null,
        discount_value: form.discount_value ? Number(form.discount_value) : null,
        discount_expires_at: form.discount_expires_at || null,
        published: form.published,
      }

      const parsed = trackUploadSchema.safeParse(payload)
      if (!parsed.success) {
        throw new Error(parsed.error.issues?.map((i) => i.message).join('; ') || 'Invalid track data')
      }

      if (parsed.data.published && !coverFile && !form.existingCoverUrl) {
        throw new Error('Cover art is required before publishing.')
      }

      let fileUrl = form.existingFileUrl
      let coverUrl = form.existingCoverUrl

      if (mp3File) {
        fileUrl = await uploadFile('tracks', mp3File, 'audio')
      }
      if (coverFile) {
        coverUrl = await uploadFile('covers', coverFile, 'covers')
      }

      if (!fileUrl && !trackId) {
        throw new Error('MP3 file is required for new tracks.')
      }

      const row = {
        ...parsed.data,
        file_url: fileUrl,
        cover_url: coverUrl,
      }

      if (trackId) {
        const { data, error } = await supabase
          .from('tracks')
          .update(row)
          .eq('id', trackId)
          .select(TRACK_COLUMNS)
          .single()
        if (error) throw error
        return data
      }

      const { data, error } = await supabase
        .from('tracks')
        .insert(row)
        .select(TRACK_COLUMNS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] })
      setShowTrackForm(false)
      setEditingTrack(null)
      showBanner('success', 'Track saved successfully.')
    },
    onError: (err) => showBanner('error', err.message),
  })

  const togglePublishMutation = useMutation({
    mutationFn: async ({ trackId, published, coverUrl }) => {
      if (published && !coverUrl) {
        throw new Error('Cover art is required before publishing.')
      }
      const { error } = await supabase
        .from('tracks')
        .update({ published })
        .eq('id', trackId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracks'] }),
    onError: (err) => showBanner('error', err.message),
  })

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId) => {
      const purchaseCount = purchaseCountsQuery.data?.[trackId] || 0

      if (purchaseCount > 0) {
        const { error } = await supabase
          .from('tracks')
          .update({ published: false })
          .eq('id', trackId)
        if (error) throw error
        const warnings = await unpublishBundlesWithTrack(trackId)
        return { archived: true, warnings }
      }

      const warnings = await unpublishBundlesWithTrack(trackId)
      const { error } = await supabase.from('tracks').delete().eq('id', trackId)
      if (error) throw error
      return { archived: false, warnings }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] })
      queryClient.invalidateQueries({ queryKey: ['track-purchase-counts'] })
      if (result.archived) {
        showBanner(
          'warning',
          'Track has purchases — archived (unpublished) instead of deleted.'
        )
      } else {
        showBanner('success', 'Track deleted.')
      }
      if (result.warnings?.length) {
        showBanner(
          'warning',
          `Bundles auto-unpublished (track removed): ${result.warnings.join(', ')}`
        )
      }
    },
    onError: (err) => showBanner('error', err.message),
  })

  const saveBundleMutation = useMutation({
    mutationFn: async ({ form, bundleId }) => {
      const payload = {
        name: form.name,
        price: Number(form.price),
        track_ids: form.track_ids,
        discount_type: form.discount_type || null,
        discount_value: form.discount_value ? Number(form.discount_value) : null,
        discount_expires_at: form.discount_expires_at || null,
        published: form.published,
      }

      const parsed = bundleSchema.safeParse(payload)
      if (!parsed.success) {
        throw new Error(parsed.error.issues?.map((i) => i.message).join('; ') || 'Invalid bundle data')
      }

      if (bundleId) {
        const { data, error } = await supabase
          .from('bundles')
          .update(parsed.data)
          .eq('id', bundleId)
          .select()
          .single()
        if (error) throw error
        return data
      }

      const { data, error } = await supabase
        .from('bundles')
        .insert(parsed.data)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      setShowBundleForm(false)
      setEditingBundle(null)
      showBanner('success', 'Bundle saved successfully.')
    },
    onError: (err) => showBanner('error', err.message),
  })

  const deleteBundleMutation = useMutation({
    mutationFn: async (bundleId) => {
      const { error } = await supabase.from('bundles').delete().eq('id', bundleId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      showBanner('success', 'Bundle deleted.')
    },
    onError: (err) => showBanner('error', err.message),
  })

  const publishedTracks = tracks.filter((t) => t.published)

  return (
    <main className="p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-accent">Music Manager</h1>
          <p className="mt-1 text-sm text-muted">Upload tracks, manage bundles, and control publishing.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'tracks' ? (
            <button
              type="button"
              onClick={() => {
                setEditingTrack(null)
                setShowTrackForm(true)
              }}
              className="flex min-h-touch items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-primary hover:bg-accent-light"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Upload track
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingBundle(null)
                setShowBundleForm(true)
              }}
              className="flex min-h-touch items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-primary hover:bg-accent-light"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create bundle
            </button>
          )}
        </div>
      </header>

      {banner && (
        <div
          role="alert"
          className={`mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            banner.type === 'error'
              ? 'border-error/50 bg-error/10 text-error'
              : banner.type === 'warning'
                ? 'border-warning/50 bg-warning/10 text-warning'
                : 'border-success/50 bg-success/10 text-success'
          }`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {banner.message}
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1">
        <TabButton
          active={activeTab === 'tracks'}
          onClick={() => setActiveTab('tracks')}
          icon={Music2}
          label="Tracks"
        />
        <TabButton
          active={activeTab === 'bundles'}
          onClick={() => setActiveTab('bundles')}
          icon={Package}
          label="Bundles"
        />
      </div>

      {activeTab === 'tracks' && (
        <>
          {showTrackForm && (
            <TrackForm
              track={editingTrack}
              onCancel={() => {
                setShowTrackForm(false)
                setEditingTrack(null)
              }}
              onSave={(form, mp3File, coverFile) =>
                saveTrackMutation.mutate({
                  form,
                  mp3File,
                  coverFile,
                  trackId: editingTrack?.id,
                })
              }
              isSaving={saveTrackMutation.isPending}
            />
          )}

          {tracksLoading ? (
            <LoadingState />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Discount</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        No tracks yet. Upload your first track.
                      </td>
                    </tr>
                  ) : (
                    tracks.map((track) => {
                      const hasPurchases = (purchaseCountsQuery.data?.[track.id] || 0) > 0
                      const effectivePrice = calcDiscountedPrice(
                        track.price,
                        track.discount_type,
                        track.discount_value,
                        track.discount_expires_at
                      )
                      return (
                        <tr key={track.id} className="border-b border-border/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {track.cover_url ? (
                                <img
                                  src={supabase.storage.from('covers').getPublicUrl(track.cover_url).data.publicUrl}
                                  alt=""
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-2 text-muted">
                                  <Music2 className="h-4 w-4" />
                                </div>
                              )}
                              <span>{track.title}</span>
                              {hasPurchases && !track.published && (
                                <span className="rounded bg-muted/20 px-1.5 py-0.5 text-xs text-muted">
                                  Archived
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {TRACK_CATEGORIES[track.category]?.en || track.category}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(effectivePrice)}
                            {effectivePrice < Number(track.price) && (
                              <span className="ml-1 text-xs text-muted line-through">
                                {formatCurrency(track.price)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {track.discount_type
                              ? `${track.discount_type === 'percent' ? track.discount_value + '%' : formatCurrency(track.discount_value)}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <PublishToggle
                              checked={track.published}
                              disabled={!track.cover_url}
                              title={
                                track.cover_url
                                  ? 'Toggle published'
                                  : 'Cover art required before publishing'
                              }
                              onChange={(published) =>
                                togglePublishMutation.mutate({
                                  trackId: track.id,
                                  published,
                                  coverUrl: track.cover_url,
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTrack(track)
                                  setShowTrackForm(true)
                                }}
                                className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-white"
                                aria-label={`Edit ${track.title}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const msg = hasPurchases
                                    ? 'This track has purchases and will be archived (unpublished) instead of deleted. Continue?'
                                    : 'Delete this track? Bundles containing it will be auto-unpublished.'
                                  if (window.confirm(msg)) {
                                    deleteTrackMutation.mutate(track.id)
                                  }
                                }}
                                className="rounded-lg p-2 text-muted hover:bg-error/10 hover:text-error"
                                aria-label={hasPurchases ? `Archive ${track.title}` : `Delete ${track.title}`}
                              >
                                {hasPurchases ? (
                                  <Archive className="h-4 w-4" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'bundles' && (
        <>
          {showBundleForm && (
            <BundleForm
              bundle={editingBundle}
              publishedTracks={publishedTracks}
              allTracks={tracks}
              onCancel={() => {
                setShowBundleForm(false)
                setEditingBundle(null)
              }}
              onSave={(form) =>
                saveBundleMutation.mutate({ form, bundleId: editingBundle?.id })
              }
              isSaving={saveBundleMutation.isPending}
            />
          )}

          {bundlesLoading ? (
            <LoadingState />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Tracks</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bundles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted">
                        No bundles yet.
                      </td>
                    </tr>
                  ) : (
                    bundles.map((bundle) => (
                      <tr key={bundle.id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{bundle.name}</td>
                        <td className="px-4 py-3 text-muted">
                          {bundle.track_ids?.length || 0} track(s)
                        </td>
                        <td className="px-4 py-3">{formatCurrency(bundle.price)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              bundle.published
                                ? 'bg-success/20 text-success'
                                : 'bg-muted/20 text-muted'
                            }`}
                          >
                            {bundle.published ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBundle(bundle)
                                setShowBundleForm(true)
                              }}
                              className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-white"
                              aria-label={`Edit ${bundle.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete bundle "${bundle.name}"?`)) {
                                  deleteBundleMutation.mutate(bundle.id)
                                }
                              }}
                              className="rounded-lg p-2 text-muted hover:bg-error/10 hover:text-error"
                              aria-label={`Delete ${bundle.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  )
}

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-1 min-h-touch items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
      active ? 'bg-accent text-primary' : 'text-muted hover:text-white'
    }`}
  >
    <Icon className="h-4 w-4" aria-hidden />
    {label}
  </button>
)

const PublishToggle = ({ checked, disabled, onChange, title }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    title={title}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
      disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
    } ${checked ? 'bg-success' : 'bg-surface-2'}`}
  >
    <span
      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
        checked ? 'left-[22px]' : 'left-0.5'
      }`}
    />
  </button>
)

const TrackForm = ({ track, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    title: track?.title || '',
    category: track?.category || 'full_song',
    price: track?.price || '',
    preview_duration: track?.preview_duration || 30,
    discount_type: track?.discount_type || '',
    discount_value: track?.discount_value || '',
    discount_expires_at: track?.discount_expires_at
      ? track.discount_expires_at.slice(0, 10)
      : '',
    published: track?.published || false,
    existingFileUrl: track?.file_url || '',
    existingCoverUrl: track?.cover_url || '',
  })
  const [mp3File, setMp3File] = useState(null)
  const [coverFile, setCoverFile] = useState(null)

  const canPublish = Boolean(coverFile || form.existingCoverUrl)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form, mp3File, coverFile)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-border bg-surface p-4 md:p-6"
    >
      <h2 className="mb-4 text-lg font-semibold text-white">
        {track ? 'Edit track' : 'Upload track'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">Title</span>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Category</span>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="full_song">Full Song</option>
            <option value="stem">Stem</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Price (R)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">
            MP3 file {!track && '(required)'}
          </span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            className={inputClass}
            onChange={(e) => setMp3File(e.target.files?.[0] || null)}
            required={!track}
          />
          {form.existingFileUrl && !mp3File && (
            <span className="mt-1 block text-xs text-muted">Current file on record</span>
          )}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">
            Cover art (public bucket){!canPublish && ' — required to publish'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
          {form.existingCoverUrl && !coverFile && (
            <img
              src={supabase.storage.from('covers').getPublicUrl(form.existingCoverUrl).data.publicUrl}
              alt="Current cover"
              className="mt-2 h-16 w-16 rounded object-cover"
            />
          )}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">
            Preview duration: {form.preview_duration}s
          </span>
          <input
            type="range"
            min="5"
            max="30"
            value={form.preview_duration}
            onChange={(e) =>
              setForm({ ...form, preview_duration: Number(e.target.value) })
            }
            className="w-full accent-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Discount type</span>
          <select
            className={inputClass}
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
          >
            <option value="">None</option>
            <option value="percent">Percentage</option>
            <option value="flat">Flat (R)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Discount value</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            disabled={!form.discount_type}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Discount expires</span>
          <input
            type="date"
            className={inputClass}
            value={form.discount_expires_at}
            onChange={(e) => setForm({ ...form, discount_expires_at: e.target.value })}
            disabled={!form.discount_type}
          />
        </label>
        <label className="flex items-center gap-3 sm:col-span-2">
          <PublishToggle
            checked={form.published}
            disabled={!canPublish}
            title={canPublish ? 'Publish track' : 'Upload cover art before publishing'}
            onChange={(published) => setForm({ ...form, published })}
          />
          <span className="text-sm">
            Published
            {!canPublish && (
              <span className="ml-2 text-xs text-warning">(cover required)</span>
            )}
          </span>
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="flex min-h-touch items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-primary hover:bg-accent-light disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save track
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-touch rounded-lg border border-border px-4 py-2 text-muted hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const BundleForm = ({ bundle, publishedTracks, allTracks, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    name: bundle?.name || '',
    price: bundle?.price || '',
    track_ids: bundle?.track_ids || [],
    discount_type: bundle?.discount_type || '',
    discount_value: bundle?.discount_value || '',
    discount_expires_at: bundle?.discount_expires_at
      ? bundle.discount_expires_at.slice(0, 10)
      : '',
    published: bundle?.published || false,
  })
  const [removedWarning, setRemovedWarning] = useState('')

  const trackOptions = publishedTracks.length > 0 ? publishedTracks : allTracks.filter((t) => t.published !== false)

  const toggleTrack = (trackId) => {
    const isSelected = form.track_ids.includes(trackId)
    const newIds = isSelected
      ? form.track_ids.filter((id) => id !== trackId)
      : [...form.track_ids, trackId]

    if (isSelected && bundle?.published && bundle.track_ids.includes(trackId)) {
      setRemovedWarning(
        'Removing a track from a published bundle will auto-unpublish it when saved.'
      )
    }
    setForm({ ...form, track_ids: newIds })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    let published = form.published
    if (
      bundle?.published &&
      form.track_ids.length < bundle.track_ids.length &&
      published
    ) {
      published = false
    }
    onSave({ ...form, published })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-border bg-surface p-4 md:p-6"
    >
      <h2 className="mb-4 text-lg font-semibold text-white">
        {bundle ? 'Edit bundle' : 'Create bundle'}
      </h2>
      {removedWarning && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {removedWarning}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">Bundle name</span>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Price (R)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </label>
        <label className="flex items-center gap-3">
          <PublishToggle
            checked={form.published}
            disabled={form.track_ids.length === 0}
            title="Publish bundle"
            onChange={(published) => setForm({ ...form, published })}
          />
          <span className="text-sm">Published</span>
        </label>
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Select tracks</span>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-surface-2 p-3">
            {trackOptions.length === 0 ? (
              <p className="text-sm text-muted">No published tracks available. Publish tracks first.</p>
            ) : (
              trackOptions.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.track_ids.includes(t.id)}
                    onChange={() => toggleTrack(t.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-sm">{t.title}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Discount type</span>
          <select
            className={inputClass}
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
          >
            <option value="">None</option>
            <option value="percent">Percentage</option>
            <option value="flat">Flat (R)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Discount value</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            disabled={!form.discount_type}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">Discount expires</span>
          <input
            type="date"
            className={inputClass}
            value={form.discount_expires_at}
            onChange={(e) => setForm({ ...form, discount_expires_at: e.target.value })}
            disabled={!form.discount_type}
          />
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSaving || form.track_ids.length === 0}
          className="flex min-h-touch items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-primary hover:bg-accent-light disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save bundle
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-touch rounded-lg border border-border px-4 py-2 text-muted hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const LoadingState = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
  </div>
)

export default MusicManager
