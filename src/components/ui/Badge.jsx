const variants = {
  gold: 'bg-accent/20 text-accent border-accent/40',
  green: 'bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40',
  amber: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/40',
  red: 'bg-[var(--color-error)]/20 text-[var(--color-error)] border-[var(--color-error)]/40',
  grey: 'bg-surface-2 text-muted border-border',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
}

const Badge = ({ children, variant = 'gold', className = '' }) => {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        variants[variant] || variants.gold,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}

export default Badge
