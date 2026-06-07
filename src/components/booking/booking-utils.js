import {
  CLASH_BLOCKING_STATUSES,
  timesOverlap,
  travelBufferViolated,
} from '../../lib/booking-status'

const toMinutes = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number)
  return h * 60 + (m || 0)
}

const fromMinutes = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/** Normalize DB time to HH:MM */
export const normalizeTime = (time) => (time || '').slice(0, 5)

/** Add whole hours to a time string; returns HH:MM:SS */
export const addHoursToTime = (startTime, hours) => {
  const startMins = toMinutes(normalizeTime(startTime))
  return fromMinutes(startMins + hours * 60)
}

/** Whole hours between start and end (exclusive end minute handling) */
export const calcHoursBetween = (startTime, endTime) => {
  const diff = toMinutes(normalizeTime(endTime)) - toMinutes(normalizeTime(startTime))
  return Math.max(1, Math.floor(diff / 60))
}

/** Group availability slots by ISO date string YYYY-MM-DD */
export const groupSlotsByDate = (slots) => {
  const map = new Map()
  for (const slot of slots || []) {
    const key = slot.date
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(slot)
  }
  return map
}

/** Dates that have at least one non-blocked availability window */
export const getAvailableDates = (slots) => {
  const map = groupSlotsByDate(slots?.filter((s) => !s.is_blocked) || [])
  return new Set(map.keys())
}

/**
 * Generate candidate 1-hour start times within availability windows.
 */
export const generateHourlyStarts = (windows, minHours = 1, maxHours = 12) => {
  const starts = new Set()
  for (const window of windows) {
    const winStart = toMinutes(window.start_time)
    const winEnd = toMinutes(window.end_time)
    for (let t = winStart; t + minHours * 60 <= winEnd; t += 60) {
      for (let h = minHours; h <= maxHours; h++) {
        if (t + h * 60 <= winEnd) {
          starts.add(fromMinutes(t).slice(0, 5))
        }
      }
    }
  }
  return [...starts].sort()
}

const blockingBookings = (bookings) =>
  (bookings || []).filter((b) => CLASH_BLOCKING_STATUSES.includes(b.status))

/**
 * Check if a proposed booking overlaps or violates travel buffer.
 */
export const checkBookingConflict = (
  existingBookings,
  { start_time, end_time, venue_city },
  bufferHrs = 2
) => {
  const active = blockingBookings(existingBookings)
  const proposal = { start_time, end_time, venue_city }

  const overlap = active.some((b) =>
    timesOverlap(
      { start_time: b.start_time, end_time: b.end_time },
      { start_time, end_time }
    )
  )

  if (overlap) return { type: 'overlap' }

  if (travelBufferViolated(active, proposal, bufferHrs)) {
    return { type: 'buffer' }
  }

  return null
}

/**
 * Available start times for a date given windows and existing bookings.
 */
export const getAvailableStartTimes = (
  windows,
  bookings,
  hoursNeeded = 1,
  bufferHrs = 2,
  venueCity = ''
) => {
  const starts = generateHourlyStarts(windows, 1, 12)
  return starts.filter((start) => {
    const end = addHoursToTime(start, hoursNeeded)
    return !checkBookingConflict(
      bookings,
      { start_time: `${start}:00`, end_time: end, venue_city: venueCity },
      bufferHrs
    )
  })
}

/**
 * True when every bookable hour within availability is taken.
 */
export const isDateFullyBooked = (windows, bookings, bufferHrs = 2) => {
  if (!windows?.length) return false
  const starts = generateHourlyStarts(windows, 1, 1)
  if (!starts.length) return true
  return starts.every((start) => {
    const end = addHoursToTime(start, 1)
    return checkBookingConflict(
      bookings,
      { start_time: `${start}:00`, end_time: end, venue_city: '' },
      bufferHrs
    )
  })
}

/** Format date as YYYY-MM-DD */
export const toDateKey = (date) => {
  if (typeof date === 'string') return date.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
