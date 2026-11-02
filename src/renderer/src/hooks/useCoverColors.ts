import { useEffect, useState } from 'react'
import { songCoverUrl } from '../media'
import { coverColors, knownColors, RED_COLORS, type CoverColors } from '../visualizer/palette'

export function useCoverColors(coverId: string | null): CoverColors {
  const [found, setFound] = useState<CoverColors | null>(null)

  useEffect(() => {
    if (!coverId) return
    let cancelled = false
    coverColors(songCoverUrl(coverId)).then((colors) => {
      if (!cancelled) setFound(colors)
    })
    return () => {
      cancelled = true
    }
  }, [coverId])

  if (!coverId) return RED_COLORS
  return knownColors(songCoverUrl(coverId)) ?? found ?? RED_COLORS
}
