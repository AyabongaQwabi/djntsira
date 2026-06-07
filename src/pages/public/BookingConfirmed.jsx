import { Link, useLocation, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import { formatCurrency, formatDate, formatTime } from '../../lib/format'

const BookingConfirmed = () => {
  const { t } = useTranslation()
  const { state } = useLocation()
  const booking = state?.booking

  if (!booking) {
    return <Navigate to="/book" replace />
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/20">
        <CheckCircle className="h-10 w-10 text-[var(--color-success)]" aria-hidden />
      </div>

      <h1 className="font-display text-4xl tracking-wide text-accent">
        {t('booking.confirmed_title', { defaultValue: 'Booking Request Sent' })}
      </h1>

      <p className="mt-3 text-muted">
        {t('booking.confirmed_body', {
          defaultValue:
            'Thank you! DJ Ntsira will review your request and contact you about the deposit.',
        })}
      </p>

      <div className="mt-8 w-full rounded-xl border border-border bg-surface p-4 text-left">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm text-muted">
            {t('booking.status', { defaultValue: 'Status' })}
          </span>
          <BookingStatusBadge status={booking.status} />
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('booking.date')}</dt>
            <dd>{formatDate(booking.event_date)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('booking.start_time')}</dt>
            <dd>
              {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('booking.venue')}</dt>
            <dd className="text-right">{booking.venue_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('booking.total', { defaultValue: 'Total' })}</dt>
            <dd className="font-semibold text-accent">
              {formatCurrency(booking.total_amount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">
              {t('booking.deposit_due_short', { defaultValue: 'Deposit due' })}
            </dt>
            <dd>{formatCurrency(booking.deposit_amount)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-xs text-muted">{t('booking.deposit_notice')}</p>

      <Link
        to="/"
        className="mt-8 inline-flex min-h-touch items-center justify-center rounded-lg bg-accent px-6 py-3 font-semibold text-primary"
      >
        {t('booking.back_home', { defaultValue: 'Back to Home' })}
      </Link>
    </main>
  )
}

export default BookingConfirmed
