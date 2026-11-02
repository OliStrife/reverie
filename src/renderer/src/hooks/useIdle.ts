import { useEffect, useState } from 'react'

const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const

export function useIdle(enabled: boolean, ms: number): boolean {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let timer = setTimeout(() => setIdle(true), ms)
    const wake = (): void => {
      setIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), ms)
    }
    ACTIVITY.forEach((name) => window.addEventListener(name, wake, { passive: true }))
    return () => {
      clearTimeout(timer)
      ACTIVITY.forEach((name) => window.removeEventListener(name, wake))
      setIdle(false)
    }
  }, [enabled, ms])

  return enabled && idle
}
