import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatTime } from '../../lib/format'
import {
  addHoursToTime,
  getAvailableStartTimes,
  normalizeTime,
} from './booking-utils'

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

const TimeSlotPicker = ({
  windows = [],
  bookings = [],
  hoursNeeded = 1,
  startTime,
  onStartTimeChange,
  onHoursChange,
  bufferHrs = 2,
  venueCity = '',
  clashError = null,
}) => {
  const { t } = useTranslation()

  const availableStarts = useMemo(
    () =>
      getAvailableStartTimes(windows, bookings, hoursNeeded, bufferHrs, venueCity),
    [windows, bookings, hoursNeeded, bufferHrs, venueCity]
  )

  const endTimePreview = startTime
    ? addHoursToTime(startTime, hoursNeeded)
    : null

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <h3 className="font-display text-lg text-accent">
        {t('booking.select_time', { defaultValue: 'Select your time' })}
      </h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-muted">
          {t('booking.start_time')}
        </label>
        {availableStarts.length === 0 ? (
          <p className="text-sm text-[var(--color-warning)]">
            {t('booking.no_slots', {
              defaultValue: 'No time slots available for this date.',
            })}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {availableStarts.map((time) => {
              const selected = normalizeTime(startTime) === time
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onStartTimeChange(`${time}:00`)}
                  className={[
                    'min-h-touch rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
                    selected
                      ? 'border-accent bg-accent text-primary'
                      : 'border-border bg-surface-2 hover:border-accent hover:text-accent',
                  ].join(' ')}
                >
                  {formatTime(time)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="hours-needed" className="mb-2 block text-sm font-medium text-muted">
          {t('booking.hours_needed', { defaultValue: 'Hours needed' })}
        </label>
        <select
          id="hours-needed"
          value={hoursNeeded}
          onChange={(e) => onHoursChange(Number(e.target.value))}
          className="min-h-touch w-full rounded-lg border border-border bg-surface-2 px-3 text-[var(--color-text)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h} {h === 1 ? 'hr' : 'hrs'}
            </option>
          ))}
        </select>
      </div>

      {startTime && endTimePreview && (
        <p className="text-sm text-muted">
          {t('booking.end_time')}:{' '}
          <span className="font-medium text-[var(--color-text)]">
            {formatTime(endTimePreview)}
          </span>
        </p>
      )}

      {clashError && (
        <p className="rounded-lg border border-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {clashError}
        </p>
      )}
    </div>
  )
}

export default TimeSlotPicker
