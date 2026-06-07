const Spinner = ({ size = 'md', className = '', label = 'Loading' }) => {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={['inline-flex items-center justify-center', className].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    >
      <span
        className={[
          'animate-spin rounded-full border-2 border-accent border-t-transparent',
          sizes[size] || sizes.md,
        ].join(' ')}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default Spinner
