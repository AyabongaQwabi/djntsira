import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getAvailableDates,
  groupSlotsByDate,
  isDateFullyBooked,
  toDateKey,
} from './booking-utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const AvailabilityCalendar = ({
  slots = [],
  bookingsForMonth = [],
  selectedDate,
  onSelectDate,
  bufferHrs = 2,
  viewMonth: controlledMonth,
  onViewMonthChange,
}) => {
  const { t } = useTranslation()
  const [internalMonth, setInternalMonth] = useState(() =>
    selectedDate ? new Date(selectedDate) : new Date()
  )

  const viewMonth = controlledMonth ?? internalMonth

  const setViewMonth = (updater) => {
    const next = typeof updater === 'function' ? updater(viewMonth) : updater
    if (onViewMonthChange) onViewMonthChange(next)
    else setInternalMonth(next)
  }

  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots])
  const availableDates = useMemo(() => getAvailableDates(slots), [slots])

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end = endOfMonth(viewMonth)
    return eachDayOfInterval({ start, end })
  }, [viewMonth])

  const leadingBlanks = startOfMonth(viewMonth).getDay()
  const today = startOfToday()

  const getDayState = (day) => {
    const key = toDateKey(day)
    const windows = slotsByDate.get(key) || []
    const hasAvailability = availableDates.has(key)
    const past = isBefore(day, today) && !isSameDay(day, today)
    const dayBookings = bookingsForMonth.filter((b) => b.event_date === key)
    const fullyBooked =
      hasAvailability && isDateFullyBooked(windows, dayBookings, bufferHrs)

    if (past || !hasAvailability || fullyBooked) {
      return fullyBooked ? 'full' : 'disabled'
    }
    return 'available'
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
          aria-label={t('booking.prev_month', { defaultValue: 'Previous month' })}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="font-display text-xl tracking-wide text-accent">
          {format(viewMonth, 'MMMM yyyy')}
        </h2>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
          aria-label={t('booking.next_month', { defaultValue: 'Next month' })}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = toDateKey(day)
          const state = getDayState(day)
          const isSelected = selectedDate && isSameDay(day, new Date(selectedDate))
          const isCurrentMonth = isSameMonth(day, viewMonth)

          return (
            <button
              key={key}
              type="button"
              disabled={state !== 'available'}
              onClick={() => onSelectDate(key)}
              className={[
                'relative flex min-h-touch flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors',
                !isCurrentMonth && 'opacity-40',
                state === 'available' &&
                  'cursor-pointer hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent',
                state === 'available' && isSelected && 'bg-accent text-primary ring-2 ring-accent',
                state === 'available' && !isSelected && 'text-[var(--color-text)]',
                state === 'full' && 'cursor-not-allowed bg-surface-2 text-muted line-through opacity-50',
                state === 'disabled' && 'cursor-not-allowed text-muted opacity-40',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={format(day, 'd MMMM yyyy')}
              aria-pressed={isSelected}
            >
              {format(day, 'd')}
              {state === 'available' && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          {t('booking.available', { defaultValue: 'Available' })}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-surface-2 opacity-50 line-through" />
          {t('booking.fully_booked', { defaultValue: 'Fully booked' })}
        </span>
      </div>
    </div>
  )
}

export default AvailabilityCalendar
