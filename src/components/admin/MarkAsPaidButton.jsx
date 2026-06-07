import { useMarkPurchasePaid } from '../../hooks/useCustomers'

const MarkAsPaidButton = ({ purchaseId, status, onSuccess }) => {
  const { mutate, isPending } = useMarkPurchasePaid()

  if (status === 'paid') {
    return (
      <span className="text-xs font-medium text-emerald-400">Paid</span>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        mutate(purchaseId, {
          onSuccess,
        })
      }
      className="min-h-touch rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
    >
      {isPending ? 'Saving…' : 'Mark as Paid'}
    </button>
  )
}

export default MarkAsPaidButton
