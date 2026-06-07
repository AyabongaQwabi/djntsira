import { ChevronDown } from 'lucide-react'

const Select = ({
  id,
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const selectId = id || props.name

  return (
    <div className={['flex flex-col gap-1.5', containerClassName].filter(Boolean).join(' ')}>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          className={[
            'min-h-touch w-full appearance-none rounded-lg border bg-surface px-4 py-3 pr-10 text-base text-[var(--color-text)]',
            'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
            error ? 'border-[var(--color-error)]' : 'border-border',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt
            const labelText = typeof opt === 'object' ? opt.label : opt
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            )
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
      {!error && helperText ? (
        <p className="text-sm text-muted">{helperText}</p>
      ) : null}
    </div>
  )
}

export default Select
