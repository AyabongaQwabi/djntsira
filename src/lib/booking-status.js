/** Allowed booking status transitions (PRD state machine). */
export const BOOKING_TRANSITIONS = {
  pending: ['deposit_requested', 'confirmed', 'cancelled'],
  deposit_requested: ['deposit_paid', 'cancelled'],
  deposit_paid: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

/** Statuses that block calendar slots in clash detection. */
export const CLASH_BLOCKING_STATUSES = [
  'pending',
  'deposit_requested',
  'deposit_paid',
  'confirmed',
]

/**
 * Check if a status transition is allowed.
 * @param {string} from
 * @param {string} to
 */
export const canTransition = (from, to) => {
  if (from === to) return true
  const allowed = BOOKING_TRANSITIONS[from]
  return Array.isArray(allowed) && allowed.includes(to)
}

/**
 * Check if two time ranges overlap on the same date.
 * @param {{ start_time: string, end_time: string }} a
 * @param {{ start_time: string, end_time: string }} b
 */
export const timesOverlap = (a, b) => {
  return a.start_time < b.end_time && a.end_time > b.start_time
}

/**
 * Parse time string to minutes since midnight for buffer calculations.
 */
const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Check travel buffer violation when bookings are in different cities same day.
 * @param {Array} existingBookings - bookings on same date
 * @param {{ start_time: string, end_time: string, venue_city: string }} newBooking
 * @param {number} bufferHrs - default 2
 */
export const travelBufferViolated = (
  existingBookings,
  newBooking,
  bufferHrs = 2
) => {
  const bufferMins = bufferHrs * 60
  const newStart = toMinutes(newBooking.start_time)
  const newEnd = toMinutes(newBooking.end_time)

  for (const booking of existingBookings) {
    if (
      !CLASH_BLOCKING_STATUSES.includes(booking.status) ||
      booking.venue_city === newBooking.venue_city
    ) {
      continue
    }

    const existingStart = toMinutes(booking.start_time)
    const existingEnd = toMinutes(booking.end_time)

    const gapBefore = newStart - existingEnd
    const gapAfter = existingStart - newEnd

    if (
      (gapBefore >= 0 && gapBefore < bufferMins) ||
      (gapAfter >= 0 && gapAfter < bufferMins) ||
      timesOverlap(booking, newBooking)
    ) {
      return true
    }
  }

  return false
}
