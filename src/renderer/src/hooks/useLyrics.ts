import { useEffect, useState } from 'react'

const cache = new Map<string, string | null>()

export function useLyrics(trackId: string | null, enabled: boolean): string | null | undefined {
  const [loaded, setLoaded] = useState<{ trackId: string; text: string | null } | null>(null)

  useEffect(() => {
    if (!enabled || !trackId || cache.has(trackId)) return
    let cancelled = false
    window.api
      .getLyrics(trackId)
      .catch(() => null)
      .then((text) => {
        cache.set(trackId, text)
        if (!cancelled) setLoaded({ trackId, text })
      })
    return () => {
      cancelled = true
    }
  }, [trackId, enabled])

  if (!enabled || !trackId) return undefined
  if (cache.has(trackId)) return cache.get(trackId)
  return loaded?.trackId === trackId ? loaded.text : undefined
}
