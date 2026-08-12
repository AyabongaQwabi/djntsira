#!/usr/bin/env node
/**
 * Build-time sitemap generator.
 *
 * Writes public/sitemap.xml (so it ships as part of `vite build`'s public/
 * copy into dist/) from:
 *  - known static routes (see STATIC_ROUTES below)
 *  - published tracks fetched from Supabase (/music/:id), when Supabase
 *    credentials are available — falls back gracefully if not (e.g. CI
 *    without secrets), logging a warning rather than failing the build.
 *
 * Also rewrites the %VITE_SITE_URL% placeholder in public/robots.txt with
 * the real site URL, since Vite only interpolates %VITE_*% placeholders in
 * index.html, not other files under public/.
 *
 * Site URL is read from VITE_SITE_URL (see .env.local / .env.example) —
 * never hardcode the production domain here.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

/** Minimal .env parser — avoids adding a dotenv dependency for one script. */
const loadEnvFile = (path) => {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = {
  ...loadEnvFile(join(root, '.env')),
  ...loadEnvFile(join(root, '.env.local')),
  ...process.env,
}

const SITE_URL = (env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

/** Static public routes, with SEO priority/changefreq hints. */
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/music', priority: '0.9', changefreq: 'daily' },
  { path: '/book', priority: '0.9', changefreq: 'weekly' },
]

const xmlEscape = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** Fetch published track IDs from Supabase for /music/:id programmatic pages. */
const fetchPublishedTrackRoutes = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[generate-sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — skipping dynamic /music/:id routes.'
    )
    return []
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/tracks?select=id,created_at&published=eq.true&order=created_at.desc`
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (!res.ok) {
      console.warn(`[generate-sitemap] Supabase fetch failed (${res.status}) — skipping dynamic routes.`)
      return []
    }
    const tracks = await res.json()
    return tracks.map((t) => ({
      path: `/music/${t.id}`,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : undefined,
    }))
  } catch (err) {
    console.warn(`[generate-sitemap] Supabase fetch error — skipping dynamic routes: ${err.message}`)
    return []
  }
}

const buildSitemapXml = (routes) => {
  const urls = routes
    .map((r) => {
      const loc = `${SITE_URL}${r.path}`
      const lastmodTag = r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : ''
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmodTag}
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

const writeRobotsTxt = () => {
  const robotsPath = join(root, 'public/robots.txt')
  if (!existsSync(robotsPath)) return
  const contents = readFileSync(robotsPath, 'utf8')
  const replaced = contents.replaceAll('%VITE_SITE_URL%', SITE_URL)
  if (replaced !== contents) {
    writeFileSync(robotsPath, replaced)
    console.log(`[generate-sitemap] Updated public/robots.txt Sitemap: directive → ${SITE_URL}/sitemap.xml`)
  }
}

const main = async () => {
  const dynamicRoutes = await fetchPublishedTrackRoutes()
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes]
  const xml = buildSitemapXml(allRoutes)

  const outPath = join(root, 'public/sitemap.xml')
  writeFileSync(outPath, xml)
  console.log(`[generate-sitemap] Wrote ${allRoutes.length} URLs to public/sitemap.xml (site: ${SITE_URL})`)

  writeRobotsTxt()
}

main()
