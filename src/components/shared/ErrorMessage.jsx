import { AlertCircle } from 'lucide-react'

const ErrorMessage = ({ title, message, onRetry, className = '' }) => {
  return (
    <div
      role="alert"
      className={[
        'flex flex-col gap-3 rounded-xl border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-error)]" aria-hidden="true" />
        <div>
          {title ? <p className="font-semibold text-[var(--color-error)]">{title}</p> : null}
          {message ? <p className="mt-1 text-sm text-[var(--color-text)]">{message}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-touch self-start rounded-lg border border-[var(--color-error)] px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

export default ErrorMessage
