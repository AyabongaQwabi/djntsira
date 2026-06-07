import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, endOfMonth, startOfMonth } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import AvailabilityCalendar from '../../components/booking/AvailabilityCalendar'
import TimeSlotPicker from '../../components/booking/TimeSlotPicker'
import BookingForm from '../../components/booking/BookingForm'
import CostCard from '../../components/booking/CostCard'
import { useAvailability } from '../../hooks/useAvailability'
import { useBookings, useBookingsByDate, useCreateBooking } from '../../hooks/useBookings'
import { useSettings } from '../../hooks/useSettings'
import { CLASH_ERROR_EN, CLASH_ERROR_XH } from '../../lib/constants'
import { calcTransportFee, getDistanceKm } from '../../lib/distance'
import { calcBookingTotal, calcDeposit } from '../../lib/pricing'
import {
  addHoursToTime,
  checkBookingConflict,
  getAvailableStartTimes,
  groupSlotsByDate,
  normalizeTime,
  toDateKey,
} from '../../components/booking/booking-utils'

const Book = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [hoursNeeded, setHoursNeeded] = useState(1)
  const [isNight, setIsNight] = useState(false)
  const [venueCity, setVenueCity] = useState('')
  const [submitError, setSubmitError] = useState(null)

  const monthKey = format(viewMonth, 'yyyy-MM')
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const { data: availability = [], isLoading: availabilityLoading } =
    useAvailability(monthKey)

  const monthStart = toDateKey(startOfMonth(viewMonth))
  const monthEnd = toDateKey(endOfMonth(viewMonth))
  const { data: monthBookings = [] } = useBookings({
    dateFrom: monthStart,
    dateTo: monthEnd,
  })

  const { data: dateBookings = [], refetch: refetchDateBookings } =
    useBookingsByDate(selectedDate)

  const createBooking = useCreateBooking()

  const slotsByDate = useMemo(() => groupSlotsByDate(availability), [availability])
  const windowsForDate = useMemo(
    () => (selectedDate ? slotsByDate.get(selectedDate) || [] : []),
    [selectedDate, slotsByDate]
  )

  const validStartTime = useMemo(() => {
    if (!startTime || !selectedDate || !windowsForDate.length) return null
    const available = getAvailableStartTimes(
      windowsForDate,
      dateBookings,
      hoursNeeded,
      settings?.travel_buffer_hours ?? 2,
      venueCity
    )
    return available.includes(normalizeTime(startTime)) ? startTime : null
  }, [
    startTime,
    selectedDate,
    windowsForDate,
    dateBookings,
    hoursNeeded,
    settings?.travel_buffer_hours,
    venueCity,
  ])

  const endTime = validStartTime ? addHoursToTime(validStartTime, hoursNeeded) : null

  const clashMessage = useMemo(() => {
    if (!selectedDate || !validStartTime || !endTime || !settings) return null
    const conflict = checkBookingConflict(
      dateBookings,
      {
        start_time: validStartTime,
        end_time: endTime,
        venue_city: venueCity,
      },
      settings.travel_buffer_hours
    )
    if (!conflict) return null
    return i18n.language?.startsWith('xh') ? CLASH_ERROR_XH : CLASH_ERROR_EN
  }, [selectedDate, validStartTime, endTime, dateBookings, venueCity, settings, i18n.language])

  const handleSelectDate = (date) => {
    setSelectedDate(date)
    setStartTime(null)
    setSubmitError(null)
  }

  const handleStartTimeChange = (time) => {
    setStartTime(time)
    setSubmitError(null)
  }

  const handleSubmit = useCallback(
    async (formData) => {
      if (!settings || !selectedDate || !validStartTime || !endTime) return
      if (clashMessage) {
        setSubmitError(clashMessage)
        return
      }

      setSubmitError(null)

      try {
        const km = await getDistanceKm(formData.venue_city, settings)
        const transportFee = calcTransportFee(settings, formData.venue_city, km)
        const hourlyRate = isNight
          ? Number(settings.night_rate)
          : Number(settings.day_rate)
        const total = calcBookingTotal(settings, isNight, hoursNeeded, transportFee)
        const deposit = calcDeposit(total, settings.deposit_percent)

        const booking = await createBooking.mutateAsync({
          ...formData,
          event_date: selectedDate,
          start_time: validStartTime,
          end_time: endTime,
          hours_booked: hoursNeeded,
          is_night: isNight,
          hourly_rate: hourlyRate,
          transport_fee: transportFee,
          deposit_amount: deposit,
          total_amount: total,
        })

        navigate('/booking-confirmed', { state: { booking } })
      } catch (err) {
        const msg = err?.message || ''
        if (msg.includes('BOOKING_CLASH')) {
          setSubmitError(i18n.language?.startsWith('xh') ? CLASH_ERROR_XH : CLASH_ERROR_EN)
          await refetchDateBookings()
          queryClient.invalidateQueries({ queryKey: ['bookings'] })
          queryClient.invalidateQueries({ queryKey: ['availability'] })
        } else {
          setSubmitError(t('common.error'))
        }
      }
    },
    [
      settings,
      selectedDate,
      validStartTime,
      endTime,
      hoursNeeded,
      isNight,
      clashMessage,
      createBooking,
      navigate,
      refetchDateBookings,
      queryClient,
      i18n.language,
      t,
    ]
  )

  const loading = settingsLoading || availabilityLoading

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-4xl tracking-wide text-accent">
          {t('booking.title')}
        </h1>
        <p className="mt-2 text-muted">
          {t('booking.intro', {
            defaultValue:
              'Choose an available date, pick your time, and send your booking request.',
          })}
        </p>
      </header>

      {loading ? (
        <p className="text-muted">{t('common.loading')}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <AvailabilityCalendar
              slots={availability}
              bookingsForMonth={monthBookings}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              bufferHrs={settings?.travel_buffer_hours ?? 2}
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
            />

            {selectedDate && (
              <TimeSlotPicker
                windows={windowsForDate}
                bookings={dateBookings}
                hoursNeeded={hoursNeeded}
                startTime={validStartTime}
                onStartTimeChange={handleStartTimeChange}
                onHoursChange={(h) => {
                  setHoursNeeded(h)
                  setSubmitError(null)
                }}
                bufferHrs={settings?.travel_buffer_hours ?? 2}
                venueCity={venueCity}
                clashError={clashMessage}
              />
            )}

            {selectedDate && validStartTime && (
              <BookingForm
                eventDate={selectedDate}
                startTime={validStartTime}
                endTime={endTime}
                hoursBooked={hoursNeeded}
                isNight={isNight}
                onIsNightChange={setIsNight}
                onVenueCityChange={setVenueCity}
                settings={settings}
                onSubmit={handleSubmit}
                isSubmitting={createBooking.isPending}
                submitError={submitError}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedDate && validStartTime && (
              <CostCard
                settings={settings}
                isNight={isNight}
                hours={hoursNeeded}
                venueCity={venueCity}
                loadingSettings={settingsLoading}
              />
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default Book
