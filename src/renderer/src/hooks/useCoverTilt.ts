import { useEffect } from 'react'

const MAX_TILT_DEG = 10

const clamp = (value: number): number => Math.max(-1, Math.min(1, value))

export function useCoverTilt(panel: React.RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const element = panel.current
    const cover = element?.querySelector<HTMLElement>('.player-cover')
    if (!enabled || !element || !cover || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return

    const set = (tiltX: number, tiltY: number, glare: number, x = 50, y = 30): void => {
      element.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`)
      element.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`)
      element.style.setProperty('--glare-x', `${x.toFixed(1)}%`)
      element.style.setProperty('--glare-y', `${y.toFixed(1)}%`)
      element.style.setProperty('--glare', String(glare))
    }

    const settle = (): void => set(0, 0, 0)
    const onMove = (event: PointerEvent): void => {
      if (element.classList.contains('pulling') || element.classList.contains('sliding')) return
      if ((event.target as Element | null)?.closest?.('.lyrics-panel')) return settle()
      const box = cover.getBoundingClientRect()
      const dx = clamp((event.clientX - (box.left + box.width / 2)) / (innerWidth / 2))
      const dy = clamp((event.clientY - (box.top + box.height / 2)) / (innerHeight / 2))
      set(-dy * MAX_TILT_DEG, dx * MAX_TILT_DEG, 1, 50 + dx * 50, 50 + dy * 50)
    }

    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', settle)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', settle)
      settle()
    }
  }, [panel, enabled])
}
