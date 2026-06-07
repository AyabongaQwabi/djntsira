import { format } from 'date-fns'
import { enZA } from 'date-fns/locale'
import { SA_TIMEZONE } from './constants'

const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Format amount as South African Rand (R X,XXX.XX) */
export const formatCurrency = (amount) => {
  const value = Number(amount)
  if (Number.isNaN(value)) return 'R 0.00'
  return currencyFormatter.format(value)
}

/** Format date as dd MMMM yyyy in SAST context */
export const formatDate = (date, pattern = 'dd MMMM yyyy') => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return format(d, pattern, { locale: enZA })
}

/** Format time as HH:mm */
export const formatTime = (time) => {
  if (!time) return ''
  if (typeof time === 'string' && time.length >= 5) {
    return time.slice(0, 5)
  }
  return format(new Date(time), 'HH:mm')
}

export { SA_TIMEZONE }
