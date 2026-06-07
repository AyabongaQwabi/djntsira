import { useState } from 'react'
import { Music2 } from 'lucide-react'

const CoverImage = ({ src, alt, className = '', size = 'md' }) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'aspect-square w-full',
    lg: 'aspect-square w-full max-w-sm',
  }

  const showImage = src && !failed

  return (
    <div
      className={[
        'relative overflow-hidden rounded-lg bg-gradient-to-br from-surface-2 via-surface to-primary',
        sizeClasses[size] || sizeClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-accent/40">
          <Music2 className="h-10 w-10" aria-hidden="true" />
        </div>
      )}
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={[
            'h-full w-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />
      ) : null}
    </div>
  )
}

export default CoverImage
