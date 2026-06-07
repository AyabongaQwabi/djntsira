#!/usr/bin/env node
/**
 * Compare isiXhosa (xh) and English (en) locale key parity.
 * Exits 1 if keys are missing in either file.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const xhPath = join(root, 'public/locales/xh/translation.json')
const enPath = join(root, 'public/locales/en/translation.json')

const flattenKeys = (obj, prefix = '') => {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

const xh = JSON.parse(readFileSync(xhPath, 'utf8'))
const en = JSON.parse(readFileSync(enPath, 'utf8'))

const xhKeys = new Set(flattenKeys(xh))
const enKeys = new Set(flattenKeys(en))

const missingInXh = [...enKeys].filter((k) => !xhKeys.has(k)).sort()
const missingInEn = [...xhKeys].filter((k) => !enKeys.has(k)).sort()

if (missingInXh.length === 0 && missingInEn.length === 0) {
  console.log(`✓ i18n key parity OK (${xhKeys.size} keys in xh, ${enKeys.size} in en)`)
  process.exit(0)
}

console.error('i18n key mismatch:')
if (missingInXh.length) {
  console.error(`\nMissing in xh (${missingInXh.length}):`)
  missingInXh.forEach((k) => console.error(`  - ${k}`))
}
if (missingInEn.length) {
  console.error(`\nMissing in en (${missingInEn.length}):`)
  missingInEn.forEach((k) => console.error(`  - ${k}`))
}
process.exit(1)
