const STATUS_STYLES = {
  pending: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  deposit_requested: 'bg-amber-500/20 text-amber-400',
  deposit_paid: 'bg-blue-500/20 text-blue-400',
  confirmed: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  completed: 'bg-muted/20 text-muted',
  cancelled: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
}

const STATUS_LABELS = {
  pending: 'Pending',
  deposit_requested: 'Deposit Requested',
  deposit_paid: 'Deposit Paid',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const BookingStatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  const label = STATUS_LABELS[status] || status

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  )
}

export default BookingStatusBadge
