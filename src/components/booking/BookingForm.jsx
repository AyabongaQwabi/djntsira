import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { bookingSchema } from '../../lib/schemas'
import { EVENT_TYPES, CROWD_SIZES } from '../../lib/constants'
import { formatPhoneDisplay } from '../../lib/phone'

const inputClass =
  'min-h-touch w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[var(--color-text)] placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

const labelClass = 'mb-1 block text-sm font-medium text-muted'

const BookingForm = ({
  eventDate,
  startTime,
  endTime,
  hoursBooked,
  isNight,
  onIsNightChange,
  onVenueCityChange,
  settings,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  const { t, i18n } = useTranslation()
  const isXh = i18n.language?.startsWith('xh')

  const hospitalityText = settings
    ? isXh
      ? settings.hospitality_text_xh
      : settings.hospitality_text_en
    : ''

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      full_name: '',
      cell_number: '',
      email: '',
      event_type: '',
      venue_name: '',
      venue_city: '',
      crowd_size: undefined,
      event_date: eventDate || '',
      start_time: startTime || '',
      end_time: endTime || '',
      is_night: isNight,
      hours_booked: hoursBooked,
      notes: '',
      hospitality_acknowledged: false,
    },
  })

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      event_date: eventDate || '',
      start_time: startTime || '',
      end_time: endTime || '',
      is_night: isNight,
      hours_booked: hoursBooked,
    }))
  }, [eventDate, startTime, endTime, isNight, hoursBooked, reset])

  const hospitalityAck = watch('hospitality_acknowledged')
  const watchedVenueCity = watch('venue_city')

  useEffect(() => {
    onVenueCityChange?.(watchedVenueCity || '')
  }, [watchedVenueCity, onVenueCityChange])
  const canSubmit = Boolean(
    eventDate && startTime && endTime && hospitalityAck && !isSubmitting
  )

  const onFormSubmit = (data) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <h3 className="font-display text-lg text-accent">
        {t('booking.your_details', { defaultValue: 'Your details' })}
      </h3>

      <div>
        <label htmlFor="full_name" className={labelClass}>
          {t('booking.full_name')} *
        </label>
        <input
          id="full_name"
          type="text"
          autoComplete="name"
          className={inputClass}
          {...register('full_name')}
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cell_number" className={labelClass}>
          {t('booking.cell')} *
        </label>
        <input
          id="cell_number"
          type="tel"
          autoComplete="tel"
          placeholder="083 123 4567"
          className={inputClass}
          {...register('cell_number', {
            onBlur: (e) => {
              e.target.value = formatPhoneDisplay(e.target.value)
            },
          })}
        />
        {errors.cell_number && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.cell_number.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          {t('booking.email')} *
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="event_type" className={labelClass}>
          {t('booking.event_type')} *
        </label>
        <select id="event_type" className={inputClass} {...register('event_type')}>
          <option value="">{t('booking.select_event', { defaultValue: 'Select event type' })}</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.event_type && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.event_type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="venue_name" className={labelClass}>
          {t('booking.venue')} *
        </label>
        <input id="venue_name" type="text" className={inputClass} {...register('venue_name')} />
        {errors.venue_name && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.venue_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="venue_city" className={labelClass}>
          {t('booking.city')} *
        </label>
        <input id="venue_city" type="text" className={inputClass} {...register('venue_city')} />
        {errors.venue_city && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.venue_city.message}</p>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>{t('booking.crowd_size')} *</legend>
        <div className="space-y-2">
          {CROWD_SIZES.map(({ value, labelEn, labelXh }) => (
            <label
              key={value}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-2 px-3"
            >
              <input
                type="radio"
                value={value}
                className="h-5 w-5 accent-[var(--color-accent)]"
                {...register('crowd_size')}
              />
              <span>{isXh ? labelXh : labelEn}</span>
            </label>
          ))}
        </div>
        {errors.crowd_size && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.crowd_size.message}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>
          {t('booking.rate_type', { defaultValue: 'Day or night booking' })} *
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-2 px-3">
            <input
              type="radio"
              name="is_night"
              checked={!isNight}
              onChange={() => onIsNightChange(false)}
              className="h-5 w-5 accent-[var(--color-accent)]"
            />
            <span>
              {t('booking.day_booking')} —{' '}
              {settings ? `R${Number(settings.day_rate).toLocaleString('en-ZA')}/hr` : '…'}
            </span>
          </label>
          <label className="flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-2 px-3">
            <input
              type="radio"
              name="is_night"
              checked={isNight}
              onChange={() => onIsNightChange(true)}
              className="h-5 w-5 accent-[var(--color-accent)]"
            />
            <span>
              {t('booking.night_booking')} —{' '}
              {settings ? `R${Number(settings.night_rate).toLocaleString('en-ZA')}/hr` : '…'}
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className={labelClass}>
          {t('booking.notes')}
        </label>
        <textarea
          id="notes"
          rows={3}
          className={`${inputClass} min-h-[96px] resize-y`}
          {...register('notes')}
        />
      </div>

      {hospitalityText && (
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="mb-3 text-sm text-[var(--color-text)]">{hospitalityText}</p>
          <label className="flex min-h-touch cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              {...register('hospitality_acknowledged')}
            />
            <span className="text-sm">
              {t('booking.hospitality_ack')} *
            </span>
          </label>
          {errors.hospitality_acknowledged && (
            <p className="mt-2 text-sm text-[var(--color-error)]">
              {errors.hospitality_acknowledged.message}
            </p>
          )}
        </div>
      )}

      {submitError && (
        <p className="rounded-lg border border-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-touch w-full rounded-lg bg-accent px-4 py-3 font-semibold text-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? t('common.loading') : t('booking.submit')}
      </button>
    </form>
  )
}

export default BookingForm
