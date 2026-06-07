import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import BottomSheet from './BottomSheet'

const Modal = ({
  open,
  onClose,
  title,
  children,
  className = '',
  mobileAsSheet = true,
}) => {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open || mobileAsSheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mobileAsSheet])

  useEffect(() => {
    if (!open || mobileAsSheet) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, mobileAsSheet])

  useEffect(() => {
    if (!open || mobileAsSheet || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    first?.focus()
  }, [open, mobileAsSheet])

  if (!open) return null

  if (mobileAsSheet) {
    return (
      <>
        <div className="sm:hidden">
          <BottomSheet open={open} onClose={onClose} title={title} className={className}>
            {children}
          </BottomSheet>
        </div>
        <div className="hidden sm:block">
          <DesktopModal
            open={open}
            onClose={onClose}
            title={title}
            className={className}
            panelRef={panelRef}
          >
            {children}
          </DesktopModal>
        </div>
      </>
    )
  }

  return (
    <DesktopModal
      open={open}
      onClose={onClose}
      title={title}
      className={className}
      panelRef={panelRef}
    >
      {children}
    </DesktopModal>
  )
}

const DesktopModal = ({ open, onClose, title, children, className, panelRef }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={[
          'relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? (
            <h2 id="modal-title" className="font-display text-2xl text-accent">
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

export default Modal
