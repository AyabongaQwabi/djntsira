import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import BookingStatusBadge from '../../components/admin/BookingStatusBadge'
import { Modal } from '../../components/ui'
import {
  addAvailabilitySlot,
  removeAvailabilitySlot,
  fetchMonthBookings,
  fetchMonthAvailability,
} from '../../components/admin/bookingActions'
import { formatTime } from '../../lib/format'

const HOUR_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = 8 + i
  return `${String(hour).padStart(2, '0')}:00`
})

const BookingCalendar = () => {
  const queryClient = useQueryClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slotModalOpen, setSlotModalOpen] = useState(false)
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('12:00')

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1
  const monthKey = format(currentMonth, 'yyyy-MM')

  const { data: availability = [], isLoading: availLoading } = useQuery({
    queryKey: ['availability', 'admin', monthKey],
    queryFn: () => fetchMonthAvailability(year, month),
  })

  const { data: bookings = [], isLoading: bookLoading } = useQuery({
    queryKey: ['bookings', 'calendar', monthKey],
    queryFn: () => fetchMonthBookings(year, month),
  })

  const addMutation = useMutation({
    mutationFn: addAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      setSlotModalOpen(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const slotsByDate = useMemo(() => {
    const map = {}
    availability.forEach((slot) => {
      const key = slot.date
      if (!map[key]) map[key] = []
      map[key].push(slot)
    })
    return map
  }, [availability])

  const bookingsByDate = useMemo(() => {
    const map = {}
    bookings.forEach((b) => {
      const key = b.event_date
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return map
  }, [bookings])

  const selectDate = (date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'))
  }

  const openAddSlot = () => {
    setStartTime('10:00')
    setEndTime('12:00')
    setSlotModalOpen(true)
  }

  const handleAddSlot = () => {
    if (!selectedDate || startTime >= endTime) return

    const startH = parseInt(startTime.split(':')[0], 10)
    const endH = parseInt(endTime.split(':')[0], 10)
    if ((endH - startH) % 1 !== 0 || endH - startH < 1) return

    addMutation.mutate({
      date: selectedDate,
      startTime,
      endTime,
    })
  }

  const selectedDateSlots = selectedDate ? slotsByDate[selectedDate] || [] : []
  const selectedDateBookings = selectedDate
    ? bookingsByDate[selectedDate] || []
    : []

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="font-display text-3xl text-accent">Booking Calendar</h1>
        <p className="mt-1 text-sm text-muted">
          Add or remove availability in 1-hour slots. Bookings shown as coloured blocks.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="min-h-touch rounded-lg p-2 hover:bg-surface-2"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-xl text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="min-h-touch rounded-lg p-2 hover:bg-surface-2"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[88px]" />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const daySlots = slotsByDate[dateStr] || []
          const dayBookings = bookingsByDate[dateStr] || []
          const hasAvailability = daySlots.length > 0

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => selectDate(day)}
              className={`min-h-[88px] rounded-lg border p-1.5 text-left transition hover:border-accent ${
                isSameDay(day, new Date())
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface'
              } ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}`}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {hasAvailability && (
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-500" title="Available" />
              )}
              <div className="mt-1 space-y-0.5">
                {dayBookings.slice(0, 2).map((b) => (
                  <span
                    key={b.id}
                    className="block truncate rounded bg-blue-500/20 px-1 text-[10px] text-blue-300"
                  >
                    {formatTime(b.start_time)}
                  </span>
                ))}
                {dayBookings.length > 2 && (
                  <span className="text-[10px] text-muted">+{dayBookings.length - 2} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {(availLoading || bookLoading) && (
        <p className="text-center text-sm text-muted">Loading calendar…</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium text-accent">
              Available slots
              {selectedDate && ` — ${selectedDate}`}
            </h3>
            {selectedDate && (
              <button
                type="button"
                onClick={openAddSlot}
                className="inline-flex min-h-touch items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add slot
              </button>
            )}
          </div>
          {!selectedDate && (
            <p className="mt-2 text-sm text-muted">Click a date to manage slots.</p>
          )}
          {selectedDate && selectedDateSlots.length === 0 && (
            <p className="mt-2 text-sm text-muted">No availability on this date.</p>
          )}
          <ul className="mt-3 space-y-2">
            {selectedDateSlots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm"
              >
                <span>
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </span>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(slot.id)}
                  disabled={removeMutation.isPending}
                  className="rounded p-1 text-red-400 hover:bg-red-500/20"
                  aria-label="Remove slot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="font-medium text-accent">Bookings on date</h3>
          {!selectedDate && (
            <p className="mt-2 text-sm text-muted">Click a date to view bookings.</p>
          )}
          <ul className="mt-3 space-y-2">
            {selectedDateBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </span>
                  <BookingStatusBadge status={b.status} />
                </div>
                <p className="text-muted">
                  {b.customers?.full_name} · {b.event_type} · {b.venue_city}
                </p>
              </li>
            ))}
            {selectedDate && selectedDateBookings.length === 0 && (
              <p className="text-sm text-muted">No bookings on this date.</p>
            )}
          </ul>
        </section>
      </div>

      <Modal
        open={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        title={`Add availability — ${selectedDate || ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Slots use 1-hour granularity. End time must be after start time.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-muted">Start time</span>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 min-h-touch w-full rounded-lg border border-border bg-surface-2 px-3 py-2"
              >
                {HOUR_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted">End time</span>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 min-h-touch w-full rounded-lg border border-border bg-surface-2 px-3 py-2"
              >
                {HOUR_SLOTS.filter((t) => t > startTime).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleAddSlot}
            disabled={addMutation.isPending || startTime >= endTime}
            className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-primary hover:bg-accent-light disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {addMutation.isPending ? 'Adding…' : 'Add slot'}
          </button>
          {addMutation.isError && (
            <p className="text-sm text-red-400">{addMutation.error.message}</p>
          )}
        </div>
      </Modal>
    </main>
  )
}

export default BookingCalendar
