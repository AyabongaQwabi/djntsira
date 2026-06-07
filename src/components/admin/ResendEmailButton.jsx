import { useResendEmail } from '../../hooks/useCustomers'

const TRIGGER_LABELS = {
  'send-purchase-receipt': 'Purchase receipt',
  'send-booking-notification': 'Booking notification',
  'send-marketing-email': 'Marketing email',
}

const ResendEmailButton = ({ log, onSuccess }) => {
  const { mutate, isPending } = useResendEmail()

  if (!log || log.status !== 'failed') return null

  const label = TRIGGER_LABELS[log.trigger_name] || log.trigger_name

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        mutate(log, {
          onSuccess,
        })
      }
      className="min-h-touch rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
      title={log.error_message || 'Email failed to send'}
    >
      {isPending ? 'Sending…' : `Resend ${label}`}
    </button>
  )
}

export default ResendEmailButton
