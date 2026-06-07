const variants = {
  primary:
    'bg-accent text-primary hover:bg-accent/90 focus-visible:ring-accent',
  secondary:
    'border border-accent text-accent bg-transparent hover:bg-accent/10 focus-visible:ring-accent',
  ghost:
    'text-[var(--color-text)] hover:bg-surface-2 focus-visible:ring-muted',
  danger:
    'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90 focus-visible:ring-[var(--color-error)]',
}

const sizes = {
  sm: 'min-h-touch px-4 py-2 text-sm sm:min-h-10',
  md: 'min-h-touch px-6 py-3 text-base',
  lg: 'min-h-touch px-8 py-4 text-lg',
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
}

export default Button
