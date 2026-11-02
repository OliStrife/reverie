import { useEffect, useRef } from 'react'

const INTERACTIVE = 'button, input, .progress, .volume, [data-no-swipe]'
const DEAD_ZONE = 6
export const FLICK_SPEED = 0.6
export const FLICK_MIN = 40
const WHEEL_SETTLE_MS = 140

export type Mode = 'follow' | 'soft' | 'release'

export const SPEEDS: Record<Mode, string> = { follow: '0s', soft: '0.15s', release: '' }

export type Sideways = {
  from: string
  move: (dx: number, mode: Mode) => void
  release: (dx: number, speed: number) => void
}

type Handlers = Pick<
  React.DOMAttributes<HTMLElement>,
  | 'onPointerDown'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'onPointerCancel'
  | 'onWheel'
  | 'onClickCapture'
>

type Drag = {
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastTime: number
  speedX: number
  speedY: number
  axis: 'x' | 'y' | null
  canSlide: boolean
}

export function useSwipeToClose(
  panel: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  sideways?: Sideways
): Handlers {
  const pull = useRef(0)
  const drag = useRef<Drag | null>(null)
  const wheelTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wheelX = useRef(0)
  const swallowClick = useRef(false)

  const setPull = (px: number, mode: Mode): void => {
    pull.current = px
    const element = panel.current
    if (!element) return
    element.style.setProperty('--pull', `${px}px`)
    if (SPEEDS[mode]) element.style.setProperty('--pull-speed', SPEEDS[mode])
    else element.style.removeProperty('--pull-speed')
    element.classList.toggle('pulled', px > 0)
    element.classList.toggle('pulling', mode === 'follow')
  }

  const settle = (flicked: boolean): void => {
    const threshold = Math.min(220, window.innerHeight * 0.3)
    const close = pull.current > threshold || (flicked && pull.current > FLICK_MIN)
    setPull(0, 'release')
    if (close) onClose()
  }

  const swallowNextClick = (): void => {
    swallowClick.current = true
    setTimeout(() => (swallowClick.current = false))
  }

  useEffect(() => {
    if (open) return
    clearTimeout(wheelTimer.current)
    drag.current = null
    pull.current = 0
    wheelX.current = 0
    panel.current?.style.removeProperty('--pull')
    panel.current?.classList.remove('pulled', 'pulling', 'sliding')
  }, [open, panel])

  const onClickCapture = (event: React.MouseEvent): void => {
    if (!swallowClick.current) return
    swallowClick.current = false
    event.stopPropagation()
  }

  if (!open) return { onClickCapture }

  return {
    onClickCapture,
    onPointerDown: (event) => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement
      const canSlide = sideways !== undefined && target.closest(sideways.from) !== null
      if (!canSlide && target.closest(INTERACTIVE)) return
      drag.current = {
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: event.timeStamp,
        speedX: 0,
        speedY: 0,
        axis: null,
        canSlide
      }
    },
    onPointerMove: (event) => {
      const state = drag.current
      if (!state) return
      const elapsed = event.timeStamp - state.lastTime
      if (elapsed > 0) {
        state.speedX = (event.clientX - state.lastX) / elapsed
        state.speedY = (event.clientY - state.lastY) / elapsed
      }
      state.lastX = event.clientX
      state.lastY = event.clientY
      state.lastTime = event.timeStamp
      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY
      if (!state.axis) {
        if (Math.hypot(dx, dy) <= DEAD_ZONE) return
        state.axis = state.canSlide && Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (state.axis === 'x') panel.current?.classList.add('sliding')
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      if (state.axis === 'x') sideways?.move(dx, 'follow')
      else if (dy > 0 || pull.current > 0) setPull(Math.max(0, dy), 'follow')
    },
    onPointerUp: () => {
      const state = drag.current
      drag.current = null
      if (!state?.axis) return
      if (state.axis === 'x') {
        panel.current?.classList.remove('sliding')
        swallowNextClick()
        sideways?.release(state.lastX - state.startX, state.speedX)
        return
      }
      if (pull.current === 0) return
      swallowNextClick()
      settle(state.speedY > FLICK_SPEED)
    },
    onPointerCancel: () => {
      const state = drag.current
      drag.current = null
      if (state?.axis === 'x') {
        panel.current?.classList.remove('sliding')
        sideways?.release(0, 0)
      } else if (pull.current > 0) settle(false)
    },
    onWheel: (event) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-no-swipe]')) return
      const unit = event.deltaMode === 1 ? 16 : 1
      if (
        sideways &&
        Math.abs(event.deltaX) > Math.abs(event.deltaY) &&
        target.closest(sideways.from)
      ) {
        wheelX.current -= event.deltaX * unit
        sideways.move(wheelX.current, 'soft')
        clearTimeout(wheelTimer.current)
        wheelTimer.current = setTimeout(() => {
          const dx = wheelX.current
          wheelX.current = 0
          sideways.release(dx, 0)
        }, WHEEL_SETTLE_MS)
        return
      }
      const next = Math.max(0, pull.current - event.deltaY * unit)
      if (next === 0 && pull.current === 0) return
      setPull(next, 'soft')
      clearTimeout(wheelTimer.current)
      wheelTimer.current = setTimeout(() => settle(false), WHEEL_SETTLE_MS)
    }
  }
}
