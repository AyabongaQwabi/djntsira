import { useEffect, useRef } from 'react'

const Textarea = ({
  id,
  label,
  error,
  helperText,
  autoResize = true,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const textareaId = id || props.name
  const ref = useRef(null)

  useEffect(() => {
    if (!autoResize || !ref.current) return
    const el = ref.current
    const resize = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    resize()
    el.addEventListener('input', resize)
    return () => el.removeEventListener('input', resize)
  }, [autoResize, props.value])

  return (
    <div className={['flex flex-col gap-1.5', containerClassName].filter(Boolean).join(' ')}>
      {label ? (
        <label htmlFor={textareaId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={[
          'min-h-[120px] w-full resize-none rounded-lg border bg-surface px-4 py-3 text-base text-[var(--color-text)]',
          'placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
          error ? 'border-[var(--color-error)]' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
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

export default Textarea
