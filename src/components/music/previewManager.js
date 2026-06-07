import { Howl } from 'howler'

let activeHowl = null
let activeTrackId = null
let stopTimer = null

export const stopPreview = () => {
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  if (activeHowl) {
    activeHowl.stop()
    activeHowl.unload()
    activeHowl = null
  }
  activeTrackId = null
}

export const getActivePreviewTrackId = () => activeTrackId

export const playPreview = ({ trackId, url, durationSeconds, onStart, onEnd, onError }) => {
  stopPreview()
  activeTrackId = trackId

  const howl = new Howl({
    src: [url],
    html5: true,
    onplay: onStart,
    onend: () => {
      stopPreview()
      onEnd?.()
    },
    onloaderror: (_id, err) => {
      stopPreview()
      onError?.(err)
    },
    onplayerror: (_id, err) => {
      stopPreview()
      onError?.(err)
    },
  })

  activeHowl = howl
  howl.play()

  stopTimer = setTimeout(() => {
    stopPreview()
    onEnd?.()
  }, durationSeconds * 1000)

  return howl
}
