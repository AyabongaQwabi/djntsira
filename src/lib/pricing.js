import { MIN_DISCOUNT_PRICE } from './constants'

/**
 * Calculate discounted price with R1.00 floor (PRD §10.2).
 * @param {number} basePrice
 * @param {'percent'|'flat'|null} discountType
 * @param {number|null} discountValue
 * @param {string|Date|null} expiresAt
 * @param {Date} [atTime=new Date()]
 */
export const calcDiscountedPrice = (
  basePrice,
  discountType,
  discountValue,
  expiresAt,
  atTime = new Date()
) => {
  const base = Number(basePrice)
  if (Number.isNaN(base) || base <= 0) return MIN_DISCOUNT_PRICE

  if (!discountType || discountValue == null) return base

  if (expiresAt) {
    const expiry = new Date(expiresAt)
    if (expiry < atTime) return base
  }

  let discounted = base
  const value = Number(discountValue)

  if (discountType === 'percent') {
    discounted = base * (1 - value / 100)
  } else if (discountType === 'flat') {
    discounted = base - value
  }

  return Math.max(MIN_DISCOUNT_PRICE, Math.round(discounted * 100) / 100)
}

/**
 * Re-validate purchase price at payment click (mid-flow discount expiry).
 */
export const validatePurchasePrice = (item, atTime = new Date()) => {
  return calcDiscountedPrice(
    item.price,
    item.discount_type,
    item.discount_value,
    item.discount_expires_at,
    atTime
  )
}

/** Whether a discount is currently active on a track or bundle. */
export const isDiscountActive = (item, atTime = new Date()) => {
  if (!item?.discount_type || item.discount_value == null) return false
  if (item.discount_expires_at) {
    return new Date(item.discount_expires_at) >= atTime
  }
  return true
}

/** Badge label for active discounts (e.g. "20% OFF"). */
export const getDiscountLabel = (item, atTime = new Date()) => {
  if (!isDiscountActive(item, atTime)) return null
  if (item.discount_type === 'percent') {
    return `${Math.round(Number(item.discount_value))}% OFF`
  }
  return `R${Number(item.discount_value).toFixed(0)} OFF`
}

/** Price display helpers for cards and modals. */
export const getItemPricing = (item, atTime = new Date()) => {
  const base = Number(item.price)
  const current = validatePurchasePrice(item, atTime)
  const hasDiscount = isDiscountActive(item, atTime) && current < base
  return { base, current, hasDiscount, label: getDiscountLabel(item, atTime) }
}

/**
 * Calculate booking subtotal from hourly rate and whole hours.
 */
export const calcBookingSubtotal = (hourlyRate, hours) => {
  const rate = Number(hourlyRate)
  const h = Math.floor(Number(hours))
  return Math.round(rate * h * 100) / 100
}

/**
 * Full booking total including transport.
 */
export const calcBookingTotal = (settings, isNight, hours, transportFee = 0) => {
  const hourlyRate = isNight ? settings.night_rate : settings.day_rate
  const subtotal = calcBookingSubtotal(hourlyRate, hours)
  const transport = Number(transportFee) || 0
  return Math.round((subtotal + transport) * 100) / 100
}

/**
 * Deposit rounded UP to nearest rand (PRD).
 */
export const calcDeposit = (total, depositPercent) => {
  const raw = (Number(total) * Number(depositPercent)) / 100
  return Math.ceil(raw)
}

/**
 * Balance due on event day.
 */
export const calcBalance = (total, deposit) => {
  return Math.round((Number(total) - Number(deposit)) * 100) / 100
}
