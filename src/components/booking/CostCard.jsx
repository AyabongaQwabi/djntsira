import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { calcTransportFee, getDistanceKm } from '../../lib/distance'
import {
  calcBalance,
  calcBookingSubtotal,
  calcBookingTotal,
  calcDeposit,
} from '../../lib/pricing'
import { formatCurrency } from '../../lib/format'

const CostCard = ({ settings, isNight, hours, venueCity, loadingSettings }) => {
  const { t } = useTranslation()

  const shouldFetchTransport = Boolean(settings && venueCity?.trim())

  const { data: transportFee = 0, isLoading: transportLoading } = useQuery({
    queryKey: ['transport-fee', venueCity, settings?.updated_at],
    enabled: shouldFetchTransport,
    queryFn: async () => {
      try {
        const km = await getDistanceKm(venueCity, settings)
        return calcTransportFee(settings, venueCity, km)
      } catch {
        return calcTransportFee(settings, venueCity, null)
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const hourlyRate = settings
    ? isNight
      ? Number(settings.night_rate)
      : Number(settings.day_rate)
    : 0

  if (loadingSettings || !settings) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">{t('common.loading')}</p>
      </div>
    )
  }

  const subtotal = calcBookingSubtotal(hourlyRate, hours)
  const total = calcBookingTotal(settings, isNight, hours, transportFee)
  const deposit = calcDeposit(total, settings.deposit_percent)
  const balance = calcBalance(total, deposit)

  const rows = [
    {
      label: t('booking.hourly_rate', { defaultValue: 'Hourly rate' }),
      value: formatCurrency(hourlyRate),
    },
    {
      label: t('booking.hours_label', { defaultValue: 'Hours' }),
      value: String(hours),
    },
    {
      label: t('booking.subtotal', { defaultValue: 'Subtotal' }),
      value: formatCurrency(subtotal),
    },
  ]

  if (transportFee > 0 || transportLoading) {
    rows.push({
      label: t('booking.transport_fee', { defaultValue: 'Transport fee' }),
      value: transportLoading ? '…' : formatCurrency(transportFee),
    })
  }

  return (
    <div className="sticky top-4 rounded-xl border border-accent/30 bg-surface p-4">
      <h3 className="mb-3 font-display text-lg text-accent">
        {t('booking.cost_summary', { defaultValue: 'Cost summary' })}
      </h3>

      <dl className="space-y-2 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}

        <div className="border-t border-border pt-2">
          <div className="flex justify-between gap-4 font-semibold">
            <dt>{t('booking.total', { defaultValue: 'Total' })}</dt>
            <dd className="text-accent">{formatCurrency(total)}</dd>
          </div>
        </div>

        <div className="flex justify-between gap-4 text-accent">
          <dt>
            {t('booking.deposit_due', {
              defaultValue: '{{percent}}% deposit due now',
              percent: settings.deposit_percent,
            })}
          </dt>
          <dd className="font-semibold">{formatCurrency(deposit)}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-muted">
            {t('booking.balance_due', { defaultValue: 'Balance due on the day' })}
          </dt>
          <dd>{formatCurrency(balance)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted">{t('booking.deposit_notice')}</p>
      {transportFee > 0 && (
        <p className="mt-1 text-xs text-muted">{t('booking.transport_notice')}</p>
      )}
    </div>
  )
}

export default CostCard
