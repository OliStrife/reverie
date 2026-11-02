import { useEffect, useState } from 'react'

export type PlaybackTime = { time: number; duration: number }

const read = (audio: HTMLAudioElement): PlaybackTime => ({
  time: audio.currentTime,
  duration: Number.isFinite(audio.duration) ? audio.duration : 0
})

export function usePlaybackTime(audio: HTMLAudioElement): PlaybackTime {
  const [value, setValue] = useState(() => read(audio))

  useEffect(() => {
    let frame = 0
    const update = (): void => setValue(read(audio))
    const tick = (): void => {
      update()
      frame = requestAnimationFrame(tick)
    }
    const start = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(tick)
    }
    const stop = (): void => {
      cancelAnimationFrame(frame)
      update()
    }
    const events = ['loadedmetadata', 'durationchange', 'seeked', 'emptied', 'timeupdate']
    events.forEach((name) => audio.addEventListener(name, update))
    audio.addEventListener('play', start)
    audio.addEventListener('pause', stop)
    if (!audio.paused) start()
    return () => {
      cancelAnimationFrame(frame)
      events.forEach((name) => audio.removeEventListener(name, update))
      audio.removeEventListener('play', start)
      audio.removeEventListener('pause', stop)
    }
  }, [audio])

  return value
}
