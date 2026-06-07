import Badge from './Badge'

const statusConfig = {
  pending: { variant: 'amber', label: 'Pending' },
  deposit_requested: { variant: 'amber', label: 'Deposit Requested' },
  deposit_paid: { variant: 'blue', label: 'Deposit Paid' },
  confirmed: { variant: 'green', label: 'Confirmed' },
  completed: { variant: 'grey', label: 'Completed' },
  cancelled: { variant: 'red', label: 'Cancelled' },
  paid: { variant: 'green', label: 'Paid' },
}

const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || { variant: 'grey', label: status || 'Unknown' }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export default StatusBadge
