import { useEffect } from 'react'
import { X } from 'lucide-react'

const BottomSheet = ({
  open,
  onClose,
  title,
  children,
  className = '',
}) => {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={[
          'relative z-10 w-full max-w-lg animate-slide-up rounded-t-2xl bg-surface p-6 shadow-xl',
          'sm:animate-none sm:rounded-2xl',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? (
            <h2 id="bottom-sheet-title" className="font-display text-2xl text-accent">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default BottomSheet
