import { BOOKING_TRANSITIONS } from '../../lib/booking-status'

const STATUS_LABELS = {
  pending: 'Pending',
  deposit_requested: 'Deposit Requested',
  deposit_paid: 'Deposit Paid',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const BookingStatusSelect = ({ currentStatus, value, onChange, disabled = false }) => {
  const allowed = BOOKING_TRANSITIONS[currentStatus] || []
  const options = [currentStatus, ...allowed.filter((s) => s !== currentStatus)]

  return (
    <select
      value={value ?? currentStatus}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || allowed.length === 0}
      className="min-h-touch w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none disabled:opacity-50"
    >
      {options.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status] || status}
        </option>
      ))}
    </select>
  )
}

export default BookingStatusSelect
