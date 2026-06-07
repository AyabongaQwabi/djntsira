const Toggle = ({
  checked,
  onChange,
  label,
  id,
  disabled = false,
  className = '',
}) => {
  const toggleId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label
      htmlFor={toggleId}
      className={[
        'inline-flex min-h-touch cursor-pointer items-center gap-3',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={[
            'absolute inset-0 rounded-full bg-surface-2 transition-colors',
            'peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg)]',
          ].join(' ')}
          aria-hidden="true"
        />
        <span
          className={[
            'absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            'peer-checked:translate-x-5',
          ].join(' ')}
          aria-hidden="true"
        />
      </span>
      {label ? <span className="text-sm font-medium text-[var(--color-text)]">{label}</span> : null}
    </label>
  )
}

export default Toggle
