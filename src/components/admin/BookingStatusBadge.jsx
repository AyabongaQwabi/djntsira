const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  deposit_requested: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  deposit_paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
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
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {label}
    </span>
  )
}

export default BookingStatusBadge
