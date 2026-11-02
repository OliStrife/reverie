import { FLICK_MIN, FLICK_SPEED, SPEEDS, type Mode, type Sideways } from './useSwipeToClose'

const SWITCH_AT = 0.22
const RESISTANCE = 0.25

export function useQueueSwipe(
  strip: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  canMove: boolean,
  onNext: () => void,
  onPrevious: () => void
): Sideways | undefined {
  const setDrag = (px: number, mode: Mode): void => {
    const element = strip.current
    if (!element) return
    element.style.setProperty('--drag', `${px}px`)
    if (SPEEDS[mode]) element.style.setProperty('--drag-speed', SPEEDS[mode])
    else element.style.removeProperty('--drag-speed')
  }

  if (!enabled) return undefined
  return {
    from: '.queue-card',
    move: (dx, mode) => setDrag(canMove ? dx : dx * RESISTANCE, mode),
    release: (dx, speed) => {
      const width = strip.current?.querySelector('[data-slot="0"]')?.clientWidth ?? 300
      const flicked =
        Math.abs(speed) > FLICK_SPEED &&
        Math.sign(speed) === Math.sign(dx) &&
        Math.abs(dx) > FLICK_MIN
      setDrag(0, 'release')
      if (!canMove || (Math.abs(dx) < width * SWITCH_AT && !flicked)) return
      if (dx < 0) onNext()
      else onPrevious()
    }
  }
}
