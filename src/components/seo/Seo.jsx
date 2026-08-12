import { Helmet } from 'react-helmet-async'
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  LOCALE,
  absoluteUrl,
} from '../../lib/seo'

/**
 * Per-route <head> manager. Renders title, meta description/keywords,
 * canonical link, Open Graph, Twitter Card, and optional JSON-LD.
 *
 * NOTE: because this is a client-side-rendered SPA, react-helmet-async
 * only updates the DOM after JS executes/hydrates. Crawlers that do not
 * execute JavaScript (many AI bots) will only ever see the baseline tags
 * already present in index.html. See AEO_GEO.md and scripts/postbuild-seo.js
 * for the mitigation (static per-route HTML snapshots injected into dist/).
 */
const Seo = ({
  title,
  fullTitle: fullTitleOverride,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd = null,
  lang,
}) => {
  const canonical = absoluteUrl(path)
  const fullTitle =
    fullTitleOverride ||
    (title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Gqom DJ, Music & Bookings`)
  const jsonLdList = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []

  return (
    <Helmet htmlAttributes={lang ? { lang } : undefined}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={LOCALE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdList.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}

export default Seo
