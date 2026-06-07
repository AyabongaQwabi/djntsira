/**
 * Normalize SA cell number to digits only.
 */
export const stripPhone = (phone) => (phone || '').replace(/\D/g, '')

/**
 * Format for display: 083 123 4567 style (best effort).
 */
export const formatPhoneDisplay = (phone) => {
  const digits = stripPhone(phone)
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  if (digits.length === 11 && digits.startsWith('27')) {
    const local = `0${digits.slice(2)}`
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return phone || ''
}

/**
 * Convert to international format without + prefix (for wa.me links).
 * Handles 0-prefix, 27-prefix, and +27 without double-prefixing.
 */
export const toWhatsAppIntl = (phone) => {
  let digits = stripPhone(phone)

  if (digits.startsWith('27')) {
    return digits
  }

  if (digits.startsWith('0')) {
    return `27${digits.slice(1)}`
  }

  return digits
}

/**
 * Build WhatsApp wa.me URL.
 */
export const buildWhatsAppUrl = (phone, message = '') => {
  const intl = toWhatsAppIntl(phone)
  const base = `https://wa.me/${intl}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

/**
 * Zod-friendly SA phone validation (10 digits starting with 0).
 */
export const isValidSAPhone = (phone) => {
  const digits = stripPhone(phone)
  return /^0\d{9}$/.test(digits)
}
