import { BASE_CITY_ALIASES } from './constants'

/** Approximate distances (km) from Queenstown/Komani for EC town fallback */
export const EC_TOWN_DISTANCES = {
  'East London': 180,
  'Port Elizabeth': 260,
  Gqeberha: 260,
  Mthatha: 220,
  Grahamstown: 120,
  Makhanda: 120,
  "King William's Town": 90,
  Bhisho: 90,
  Butterworth: 150,
  Uitenhage: 250,
  Alice: 100,
  'Fort Beaufort': 80,
}

const normalizeCity = (city) =>
  (city || '').trim().toLowerCase().replace(/\s+/g, ' ')

const isBaseCity = (city) => {
  const normalized = normalizeCity(city)
  return BASE_CITY_ALIASES.some(
    (alias) => normalizeCity(alias) === normalized
  )
}

/**
 * Lookup distance from base city using hardcoded EC table.
 * Returns null if city unknown (caller should apply transport fee per PRD).
 */
export const lookupTownDistance = (city) => {
  if (!city || isBaseCity(city)) return 0

  const normalized = normalizeCity(city)
  for (const [town, km] of Object.entries(EC_TOWN_DISTANCES)) {
    if (normalizeCity(town) === normalized) return km
  }
  return null
}

/**
 * Calculate transport fee based on settings and distance.
 * Applies fee when distance exceeds threshold or city is unknown (non-base).
 */
export const calcTransportFee = (settings, city, distanceKm = null) => {
  if (isBaseCity(city)) return 0

  const threshold = Number(settings.transport_threshold_km) || 20
  const baseFee = Number(settings.transport_base_fee) || 200

  let km = distanceKm
  if (km == null) {
    km = lookupTownDistance(city)
  }

  // Unknown city or beyond threshold → apply transport fee
  if (km === null || km > threshold) {
    return baseFee
  }

  return 0
}

/**
 * Fetch distance via Google Maps Distance Matrix API (optional).
 * Falls back to EC town lookup on failure or missing API key.
 */
export const getDistanceKm = async (destinationCity, settings) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey || !destinationCity || isBaseCity(destinationCity)) {
    return lookupTownDistance(destinationCity) ?? null
  }

  try {
    const origin = `${settings.base_lat},${settings.base_lng}`
    const params = new URLSearchParams({
      origins: origin,
      destinations: destinationCity,
      key: apiKey,
      units: 'metric',
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`
    )
    const data = await res.json()
    const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value

    if (typeof meters === 'number') {
      return Math.round(meters / 1000)
    }
  } catch {
    // fall through to lookup table
  }

  return lookupTownDistance(destinationCity)
}
