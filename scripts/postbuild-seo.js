#!/usr/bin/env node
/**
 * Post-build static HTML snapshot injection.
 *
 * WHY: this app is a pure client-side-rendered React SPA (see vite.config.js
 * — no SSR/prerender plugin). Every route resolves to the same dist/index.html
 * shell, whose <head> only contains the homepage's baseline meta tags. Most
 * traditional search crawlers (Googlebot, Bingbot) execute JS and will see
 * the per-route tags react-helmet-async injects at runtime — but many AI
 * crawlers (GPTBot, ClaudeBot, PerplexityBot, and most "answer engine"
 * fetchers) do NOT execute JavaScript. They fetch a URL and read the raw
 * HTML only, so a bot hitting /music or /book directly would otherwise see
 * generic homepage meta tags, not page-specific ones.
 *
 * WHAT THIS DOES: for each known static route, copies dist/index.html and
 * rewrites its <title>, <meta description>, canonical <link>, OG/Twitter
 * tags, and JSON-LD block to match that route — then writes it to
 * dist/<route>/index.html (Netlify serves foo/index.html for /foo/ and,
 * combined with the SPA rewrite in netlify.toml, direct hits to /foo also
 * resolve). This is a lightweight alternative to full SSR/prerendering
 * (react-snap, vite-plugin-ssr, etc.) — it only handles known static routes,
 * not every dynamic /music/:id track page (there could be hundreds and the
 * content changes with the DB). See README.md "AEO / GEO" section for the
 * full explanation and the recommended follow-up if deeper crawler coverage
 * is needed later (e.g. prerendering the top N tracks, or migrating to an
 * SSR-capable framework for the public storefront).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const distDir = join(root, 'dist')
const indexPath = join(distDir, 'index.html')

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

if (!existsSync(indexPath)) {
  console.warn('[postbuild-seo] dist/index.html not found — did `vite build` run first? Skipping.')
  process.exit(0)
}

const baseHtml = readFileSync(indexPath, 'utf8')

const xmlEscape = (str = '') =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const ROUTES = [
  {
    path: '/music',
    title: 'Buy Gqom Music & Stems | DJ Ntsira',
    description:
      'Browse and buy original Gqom tracks, stems and discounted bundles from DJ Ntsira. Instant digital download after purchase.',
  },
  {
    path: '/book',
    title: 'Book DJ Ntsira — Gqom DJ for Weddings, Parties & Events',
    description:
      'Book DJ Ntsira for weddings, birthdays, tavern nights, corporate events and festivals across the Eastern Cape. Check live availability and submit your booking request online.',
  },
]

/**
 * Replace the `content="..."` value of a <meta> tag identified by a
 * name/property attribute, tolerant of the tag being written on one line
 * or split across multiple lines (as our source index.html does for long
 * values like description).
 */
const replaceMetaContent = (html, attrPattern, newValue) => {
  const re = new RegExp(
    `(<meta[^>]*${attrPattern}[^>]*content=")[^"]*("[^>]*>)`,
    's'
  )
  return html.replace(re, `$1${xmlEscape(newValue)}$2`)
}

const injectRoute = (html, route) => {
  const canonical = `${SITE_URL}${route.path}`
  let out = html

  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${xmlEscape(route.title)}</title>`)
  out = replaceMetaContent(out, 'name="description"', route.description)
  out = out.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${canonical}" />`
  )
  out = replaceMetaContent(out, 'property="og:title"', route.title)
  out = replaceMetaContent(out, 'property="og:description"', route.description)
  out = out.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${canonical}" />`
  )
  out = replaceMetaContent(out, 'name="twitter:title"', route.title)
  out = replaceMetaContent(out, 'name="twitter:description"', route.description)

  return out
}

let written = 0
for (const route of ROUTES) {
  const html = injectRoute(baseHtml, route)
  const outDir = join(distDir, route.path.replace(/^\//, ''))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html)
  written += 1
}

console.log(
  `[postbuild-seo] Wrote ${written} static per-route HTML snapshot(s) into dist/ for non-JS crawlers (${ROUTES.map((r) => r.path).join(', ')}).`
)
