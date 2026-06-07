import { useState } from 'react'
import { Modal, WhatsAppBtn } from '../ui'
import BookingStatusBadge from './BookingStatusBadge'
import BookingStatusSelect from './BookingStatusSelect'
import { formatCurrency, formatDate, formatTime } from '../../lib/format'
import { calcDeposit, calcBookingTotal } from '../../lib/pricing'
import { canTransition } from '../../lib/booking-status'
import { CROWD_SIZES } from '../../lib/constants'

const crowdLabel = (value) =>
  CROWD_SIZES.find((c) => c.value === value)?.labelEn || value

const BookingDetailModal = ({
  booking,
  customer,
  settings,
  open,
  onClose,
  onUpdateStatus,
  onSendDepositRequest,
  onSaveTransport,
  statusLoading,
  depositLoading,
  transportLoading,
}) => {
  const [status, setStatus] = useState(booking?.status ?? 'pending')
  const [transportFee, setTransportFee] = useState(booking?.transport_fee ?? 0)

  if (!booking) return null

  const depositPreview =
    settings && booking
      ? calcDeposit(
          calcBookingTotal(
            settings,
            booking.is_night,
            booking.hours_booked,
            transportFee
          ),
          settings.deposit_percent
        )
      : booking.deposit_amount

  const totalPreview =
    settings && booking
      ? calcBookingTotal(
          settings,
          booking.is_night,
          booking.hours_booked,
          transportFee
        )
      : booking.total_amount

  const transportChanged =
    Number(transportFee) !== Number(booking.transport_fee)

  const canSendDeposit =
    booking.status === 'pending' || booking.status === 'deposit_requested'

  return (
    <Modal open={open} onClose={onClose} title="Booking Details" className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <BookingStatusBadge status={booking.status} />
          <span className="text-sm text-muted">
            {formatDate(booking.event_date)} · {formatTime(booking.start_time)}–
            {formatTime(booking.end_time)}
          </span>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Customer</dt>
            <dd className="font-medium">{customer?.full_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd>{customer?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Cell</dt>
            <dd className="flex flex-wrap items-center gap-2">
              {customer?.cell_number || '—'}
              {customer?.cell_number && (
                <WhatsAppBtn phone={customer.cell_number} iconOnly label="WhatsApp" />
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Event type</dt>
            <dd>{booking.event_type}</dd>
          </div>
          <div>
            <dt className="text-muted">Venue</dt>
            <dd>
              {booking.venue_name}, {booking.venue_city}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Crowd size</dt>
            <dd>{crowdLabel(booking.crowd_size)}</dd>
          </div>
          <div>
            <dt className="text-muted">Hours</dt>
            <dd>{booking.hours_booked}h ({booking.is_night ? 'Night' : 'Day'} rate)</dd>
          </div>
          <div>
            <dt className="text-muted">Hourly rate</dt>
            <dd>{formatCurrency(booking.hourly_rate)}</dd>
          </div>
        </dl>

        {booking.notes && (
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <p className="text-muted">Notes</p>
            <p className="mt-1">{booking.notes}</p>
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface-2 p-4 space-y-3">
          <h3 className="font-medium text-accent">Pricing</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Transport fee override (R)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={transportFee}
                onChange={(e) => setTransportFee(e.target.value)}
                className="mt-1 min-h-touch w-full rounded-lg border border-border bg-surface px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </label>
            <div className="text-sm">
              <p className="text-muted">Recalculated total</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(totalPreview)}</p>
              <p className="text-muted">
                Deposit ({settings?.deposit_percent ?? 50}%):{' '}
                {formatCurrency(depositPreview)}
              </p>
            </div>
          </div>
          {transportChanged && (
            <button
              type="button"
              disabled={transportLoading}
              onClick={() =>
                onSaveTransport({
                  transportFee: Number(transportFee),
                  totalAmount: totalPreview,
                  depositAmount: depositPreview,
                })
              }
              className="min-h-touch rounded-lg bg-accent px-4 py-2 text-sm font-medium text-primary transition hover:bg-accent-light disabled:opacity-50"
            >
              {transportLoading ? 'Saving…' : 'Save transport & notify customer'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-muted">Update status</label>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[200px] flex-1">
              <BookingStatusSelect
                currentStatus={booking.status}
                value={status}
                onChange={setStatus}
              />
            </div>
            <button
              type="button"
              disabled={
                statusLoading ||
                status === booking.status ||
                !canTransition(booking.status, status)
              }
              onClick={() => onUpdateStatus(status)}
              className="min-h-touch rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50"
            >
              {statusLoading ? 'Updating…' : 'Apply status'}
            </button>
          </div>
        </div>

        {canSendDeposit && (
          <button
            type="button"
            disabled={depositLoading}
            onClick={() => onSendDepositRequest(booking)}
            className="min-h-touch w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-primary transition hover:bg-accent-light disabled:opacity-50"
          >
            {depositLoading ? 'Sending…' : 'Send Deposit Request (Yoco + email)'}
          </button>
        )}
      </div>
    </Modal>
  )
}

export default BookingDetailModal
