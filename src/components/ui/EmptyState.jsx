import { Music2 } from 'lucide-react'

const EmptyState = ({
  icon: Icon = Music2,
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      {title ? (
        <h3 className="font-display text-xl text-[var(--color-text)]">{title}</h3>
      ) : null}
      {message ? <p className="mt-2 max-w-sm text-muted">{message}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export default EmptyState
