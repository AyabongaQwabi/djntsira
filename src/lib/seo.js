/**
 * Central SEO configuration and helpers.
 *
 * SITE_URL is sourced from VITE_SITE_URL (see .env.example / .env.local) —
 * never hardcode the production domain in code. Falls back to localhost for
 * local dev so canonical/OG URLs are still valid absolute URLs.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'http://localhost:5173'
).replace(/\/$/, '')

export const SITE_NAME = 'DJ Ntsira'
export const DEFAULT_TITLE = 'DJ Ntsira — Gqom DJ, Music & Bookings | Queenstown, Eastern Cape'
export const TITLE_TEMPLATE = '%s | DJ Ntsira'
export const DEFAULT_DESCRIPTION =
  'DJ Ntsira (Lituko Siphe) is a Gqom DJ and producer from Komani (Queenstown), Eastern Cape. Stream and buy original Gqom tracks, stems and bundles, or book DJ Ntsira for weddings, parties, taverns and festivals across the Eastern Cape.'
export const DEFAULT_KEYWORDS =
  'DJ Ntsira, Gqom DJ, Gqom music, Queenstown DJ, Komani DJ, Eastern Cape DJ, book a DJ, Gqom mixes, Gqom producer, Lituko Siphe, DJ booking Eastern Cape, buy Gqom music'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo.png`
export const TWITTER_HANDLE = '@djntsira_sa'
export const LOCALE = 'en_ZA'

/** Build an absolute URL from a site-relative path. */
export const absoluteUrl = (path = '/') => {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Person + MusicGroup entity for DJ Ntsira, reused across pages for entity clarity. */
export const personSchema = () => ({
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: 'DJ Ntsira',
  alternateName: 'Lituko Siphe',
  url: SITE_URL,
  image: absoluteUrl('/images/portrait.webp'),
  jobTitle: 'DJ / Music Producer',
  genre: 'Gqom',
  nationality: 'South African',
  homeLocation: {
    '@type': 'Place',
    name: 'Queenstown (Komani), Eastern Cape, South Africa',
  },
  sameAs: [
    'https://www.instagram.com/djntsira/',
    'https://www.facebook.com/profile.php?id=61556947102512',
    'https://www.tiktok.com/@djntsira_sa',
  ],
})

/** MusicGroup / performing artist entity — useful for MusicRecording byArtist references. */
export const musicGroupSchema = () => ({
  '@type': 'MusicGroup',
  '@id': `${SITE_URL}/#musicgroup`,
  name: 'DJ Ntsira',
  genre: 'Gqom',
  url: SITE_URL,
  image: absoluteUrl('/images/portrait.webp'),
  sameAs: [
    'https://www.instagram.com/djntsira/',
    'https://www.facebook.com/profile.php?id=61556947102512',
    'https://www.tiktok.com/@djntsira_sa',
  ],
})

/** WebSite schema with SearchAction omitted (no on-site search) — used site-wide. */
export const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  publisher: { '@id': `${SITE_URL}/#person` },
  inLanguage: ['en-ZA', 'xh-ZA'],
})

/** Root graph combining Person, MusicGroup and WebSite — injected as baseline in index.html and as fallback on every route. */
export const buildDefaultGraph = () => ({
  '@context': 'https://schema.org',
  '@graph': [personSchema(), musicGroupSchema(), websiteSchema()],
})

/** MusicRecording schema for a single track (used on /music/:id). */
export const trackSchema = (track) => {
  if (!track) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    url: absoluteUrl(`/music/${track.id}`),
    image: track.cover_url || DEFAULT_OG_IMAGE,
    genre: 'Gqom',
    byArtist: { '@id': `${SITE_URL}/#musicgroup` },
    isrcCode: undefined,
    datePublished: track.created_at,
    offers: {
      '@type': 'Offer',
      price: String(track.price ?? ''),
      priceCurrency: 'ZAR',
      availability: track.published
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/music/${track.id}`),
    },
  }
}

/** MusicPlaylist schema for a bundle of tracks (used on /music store listing + bundle cards). */
export const bundleSchema = (bundle, tracks = []) => {
  if (!bundle) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: bundle.name,
    url: absoluteUrl('/music'),
    numTracks: tracks.length || (bundle.track_ids || []).length,
    byArtist: { '@id': `${SITE_URL}/#musicgroup` },
    track: tracks.map((t) => ({
      '@type': 'MusicRecording',
      name: t.title,
      url: absoluteUrl(`/music/${t.id}`),
    })),
    offers: {
      '@type': 'Offer',
      price: String(bundle.price ?? ''),
      priceCurrency: 'ZAR',
      availability: bundle.published
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl('/music'),
    },
  }
}

/** BreadcrumbList schema builder. items: [{ name, path }] */
export const breadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

/** Service schema for the booking page — DJ performance service offered across the Eastern Cape. */
export const bookingServiceSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'DJ booking / live Gqom DJ performance',
  provider: { '@id': `${SITE_URL}/#person` },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Eastern Cape, South Africa',
  },
  url: absoluteUrl('/book'),
  description:
    'Book DJ Ntsira for weddings, birthdays, tavern nights, corporate events and festivals across the Eastern Cape, South Africa.',
})
