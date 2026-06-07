import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { Pause, Play } from 'lucide-react'
import Button from './Button'

/** Global singleton — only one preview at a time */
let activeHowl = null

const stopActive = () => {
  if (activeHowl) {
    activeHowl.stop()
    activeHowl.unload()
    activeHowl = null
  }
}

const AudioPlayer = ({
  src,
  duration = 30,
  label = 'Preview',
  onPlay,
  onStop,
  className = '',
}) => {
  const howlRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current.unload()
        if (activeHowl === howlRef.current) activeHowl = null
      }
    }
  }, [])

  const handleToggle = () => {
    if (!src) return

    if (playing && howlRef.current) {
      howlRef.current.stop()
      setPlaying(false)
      onStop?.()
      return
    }

    stopActive()
    setLoading(true)
    setError(null)

    const howl = new Howl({
      src: [src],
      html5: true,
      onload: () => setLoading(false),
      onplay: () => {
        setPlaying(true)
        setLoading(false)
        onPlay?.()
      },
      onend: () => {
        setPlaying(false)
        onStop?.()
      },
      onstop: () => setPlaying(false),
      onloaderror: () => {
        setLoading(false)
        setError('Could not load preview')
      },
      onplayerror: () => {
        setLoading(false)
        setError('Could not play preview')
      },
    })

    howlRef.current = howl
    activeHowl = howl
    howl.play()

    const timer = setTimeout(() => {
      if (howl.playing()) {
        howl.stop()
        setPlaying(false)
        onStop?.()
      }
    }, duration * 1000)

    howl.once('stop', () => clearTimeout(timer))
    howl.once('end', () => clearTimeout(timer))
  }

  return (
    <div className={['flex flex-col gap-1', className].filter(Boolean).join(' ')}>
      <Button
        type="button"
        variant={playing ? 'secondary' : 'ghost'}
        size="sm"
        loading={loading}
        disabled={!src}
        onClick={handleToggle}
        className={playing ? 'border-accent text-accent' : ''}
        aria-pressed={playing}
      >
        {playing ? (
          <Pause className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Play className="h-5 w-5" aria-hidden="true" />
        )}
        {label}
      </Button>
      {playing ? (
        <div className="flex h-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-full animate-pulse bg-accent" />
        </div>
      ) : null}
      {error ? <p className="text-xs text-[var(--color-error)]">{error}</p> : null}
    </div>
  )
}

export default AudioPlayer
