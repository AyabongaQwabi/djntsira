const Input = ({
  id,
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const inputId = id || props.name

  return (
    <div className={['flex flex-col gap-1.5', containerClassName].filter(Boolean).join(' ')}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={[
          'min-h-touch w-full rounded-lg border bg-surface px-4 py-3 text-base text-[var(--color-text)]',
          'placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
          error ? 'border-[var(--color-error)]' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      {!error && helperText ? (
        <p id={`${inputId}-helper`} className="text-sm text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

export default Input
